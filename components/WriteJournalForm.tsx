"use client";

import { useUser } from "@clerk/nextjs";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bold, Heading1, Heading2, ImagePlus, Italic, Quote } from "lucide-react";
import {
  categories,
  categoryStyles,
  stickerGlyphs,
  stickerOptions,
  type TravelCategory,
  type TravelSticker
} from "@/data/journals";
import { calculateReadTime, normalizeAuthorName } from "@/lib/journal-mappers";
import { pointsByAction } from "@/lib/reputation";
import { createSupabaseBrowserClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { adjustUserPoints, ensureAtlasUser } from "@/lib/users";

const editorPlaceholder =
  "Start writing your journey... The details are what make it real. The conversation that changed your route, the meal that made the city click, the morning you'll think about for years.";

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim();
}

export function WriteJournalForm() {
  const router = useRouter();
  const { user } = useUser();
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [locationName, setLocationName] = useState("");
  const [zoneName, setZoneName] = useState("");
  const [category, setCategory] = useState<TravelCategory | null>(null);
  const [journeyMode, setJourneyMode] = useState(false);
  const [stickers, setStickers] = useState<TravelSticker[]>([]);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [teaser, setTeaser] = useState("");
  const [error, setError] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  const canUseSupabase = isSupabaseConfigured();

  function runEditorCommand(command: string, value?: string) {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    setBody(editorRef.current?.innerHTML ?? "");
  }

  function toggleSticker(sticker: TravelSticker) {
    setStickers((current) => {
      if (current.includes(sticker)) {
        return current.filter((item) => item !== sticker);
      }

      if (current.length === 2) {
        return [current[1], sticker];
      }

      return [...current, sticker];
    });
  }

  function handlePhoto(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function publishJournal() {
    setError("");

    const plainBody = stripHtml(body);

    if (!title.trim()) {
      setError("Give your journey a title before publishing.");
      return;
    }

    if (!locationName.trim() || !zoneName.trim()) {
      setError("Add both the location and the specific zone.");
      return;
    }

    if (!category) {
      setError("Choose one travel category.");
      return;
    }

    if (stickers.length !== 2) {
      setError("Choose exactly two stickers for the photo overlay.");
      return;
    }

    if (!photoFile) {
      setError("Upload one image for this location zone.");
      return;
    }

    if (!plainBody) {
      setError("Write the full journal before publishing.");
      return;
    }

    if (!teaser.trim()) {
      setError("Add a 1-2 line teaser for the feed card.");
      return;
    }

    if (!canUseSupabase) {
      setError("Add your Supabase URL and anon key to .env.local before publishing.");
      return;
    }

    if (!user) {
      setError("Sign in before publishing to Atlas.");
      router.push("/sign-in?redirect_url=/write");
      return;
    }

    setIsPublishing(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const profile = await ensureAtlasUser(supabase, {
        id: user.id,
        fullName: user.fullName,
        firstName: user.firstName,
        email: user.primaryEmailAddress?.emailAddress,
        avatarUrl: user.imageUrl
      });
      const bucket = process.env.NEXT_PUBLIC_SUPABASE_JOURNAL_PHOTOS_BUCKET ?? "journal-photos";
      const extension = photoFile.name.split(".").pop() ?? "jpg";
      const photoPath = `${user.id}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(photoPath, photoFile, {
          cacheControl: "3600",
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      const { data: publicPhoto } = supabase.storage.from(bucket).getPublicUrl(photoPath);

      // Geocode the location so the pin shows on the map immediately
      let latitude: number | null = null;
      let longitude: number | null = null;
      try {
        const geoUrl = new URL("https://nominatim.openstreetmap.org/search");
        geoUrl.searchParams.set("format", "json");
        geoUrl.searchParams.set("limit", "1");
        geoUrl.searchParams.set("q", locationName.trim());
        const geoRes = await fetch(geoUrl.toString(), { headers: { Accept: "application/json" } });
        if (geoRes.ok) {
          const geoData = (await geoRes.json()) as Array<{ lat: string; lon: string }>;
          if (geoData[0]) {
            latitude = Number(geoData[0].lat);
            longitude = Number(geoData[0].lon);
          }
        }
      } catch {
        // geocoding is best-effort — continue without coordinates
      }

      const { error: insertError } = await supabase.from("journals").insert({
        title: title.trim(),
        body,
        teaser: teaser.trim(),
        location_name: locationName.trim(),
        zone_name: zoneName.trim(),
        latitude,
        longitude,
        category,
        journey_mode: journeyMode,
        stickers,
        photo_url: publicPhoto.publicUrl,
        author_id: user.id,
        author_name: normalizeAuthorName(
          user.fullName ?? user.firstName ?? user.primaryEmailAddress?.emailAddress,
          profile.full_name
        ),
        author_rank: profile.rank_name,
        hearts: 0,
        comments_count: 0,
        saves: 0,
        read_time: calculateReadTime(plainBody)
      });

      if (insertError) {
        throw insertError;
      }

      await adjustUserPoints(supabase, user.id, pointsByAction.publishJournal, {
        full_name: profile.full_name,
        email: profile.email,
        avatar_url: profile.avatar_url
      });

      router.push("/#explore");
      router.refresh();
    } catch (caughtError) {
      const message =
        caughtError instanceof Error ? caughtError.message : "Publishing failed. Try again.";
      setError(message);
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <section className="mx-auto max-w-5xl px-5 py-12 sm:px-8 lg:px-10 lg:py-16">
      <div className="mb-10 border-b border-ink/10 pb-8">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Give your journey a title..."
          className="w-full bg-transparent font-serif text-5xl font-semibold leading-tight text-ink outline-none placeholder:text-ink/30 sm:text-7xl"
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <input
            value={locationName}
            onChange={(event) => setLocationName(event.target.value)}
            placeholder="Where were you? e.g. Kyoto, Japan"
            className="rounded-lg border border-ink/10 bg-paper px-5 py-4 text-base text-ink outline-none transition placeholder:text-ink/35 focus:border-moss"
          />
          <input
            value={zoneName}
            onChange={(event) => setZoneName(event.target.value)}
            placeholder="Which part specifically? e.g. Higashiyama district"
            className="rounded-lg border border-ink/10 bg-paper px-5 py-4 text-base text-ink outline-none transition placeholder:text-ink/35 focus:border-moss"
          />
        </div>
      </div>

      <div className="space-y-10">
        <section>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-moss">
            Category
          </p>
          <div className="flex flex-wrap gap-3">
            {categories.map((item) => {
              const selected = category === item;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    selected
                      ? `${categoryStyles[item]} ring-2 ring-moss ring-offset-2 ring-offset-bone`
                      : "border-ink/15 bg-paper text-ink/65 hover:border-moss"
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </section>

        <section className="flex items-center justify-between gap-6 rounded-lg border border-ink/10 bg-paper p-5">
          <div>
            <p className="font-semibold text-ink">The journey was the destination</p>
            <p className="mt-1 text-sm text-ink/55">
              Turn this on if your trip had no fixed endpoint
            </p>
          </div>
          <button
            type="button"
            onClick={() => setJourneyMode((value) => !value)}
            className={`relative h-8 w-14 rounded-full transition ${
              journeyMode ? "bg-moss" : "bg-oatmeal"
            }`}
            aria-pressed={journeyMode}
          >
            <span
              className={`absolute top-1 h-6 w-6 rounded-full bg-paper shadow-sm transition ${
                journeyMode ? "left-7" : "left-1"
              }`}
            />
          </button>
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-moss">
              Choose 2 stickers
            </p>
            <p className="text-sm font-medium text-ink/55">{stickers.length}/2 selected</p>
          </div>
          <div className="grid grid-cols-5 gap-3 sm:grid-cols-10">
            {stickerOptions.map((sticker) => {
              const selected = stickers.includes(sticker);

              return (
                <button
                  key={sticker}
                  type="button"
                  onClick={() => toggleSticker(sticker)}
                  className={`flex aspect-square items-center justify-center rounded-lg border text-3xl transition ${
                    selected
                      ? "border-moss bg-paper shadow-[0_12px_28px_rgba(36,64,51,0.14)] ring-2 ring-moss"
                      : "border-ink/10 bg-paper hover:border-moss"
                  }`}
                  aria-label={sticker}
                >
                  {stickerGlyphs[sticker]}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.24em] text-moss">
            One photo
          </p>
          <div
            className="flex min-h-[22rem] cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-ink/20 bg-paper text-center transition hover:border-moss"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              handlePhoto(event.dataTransfer.files[0]);
            }}
          >
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoPreview} alt="Journal upload preview" className="h-full w-full object-cover" />
            ) : (
              <div className="px-6">
                <ImagePlus aria-hidden="true" className="mx-auto text-moss" size={34} />
                <p className="mt-4 font-serif text-3xl font-semibold text-ink">
                  Drop one image here
                </p>
                <p className="mt-2 text-sm text-ink/55">or click to choose a file</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => handlePhoto(event.target.files?.[0])}
            />
          </div>
        </section>

        <section>
          <div className="mb-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => runEditorCommand("bold")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 bg-paper text-ink hover:border-moss"
              aria-label="Bold"
            >
              <Bold size={17} />
            </button>
            <button
              type="button"
              onClick={() => runEditorCommand("italic")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 bg-paper text-ink hover:border-moss"
              aria-label="Italic"
            >
              <Italic size={17} />
            </button>
            <button
              type="button"
              onClick={() => runEditorCommand("formatBlock", "h2")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 bg-paper text-ink hover:border-moss"
              aria-label="Heading"
            >
              <Heading1 size={17} />
            </button>
            <button
              type="button"
              onClick={() => runEditorCommand("formatBlock", "h3")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 bg-paper text-ink hover:border-moss"
              aria-label="Subheading"
            >
              <Heading2 size={17} />
            </button>
            <button
              type="button"
              onClick={() => runEditorCommand("formatBlock", "blockquote")}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-ink/10 bg-paper text-ink hover:border-moss"
              aria-label="Blockquote"
            >
              <Quote size={17} />
            </button>
          </div>
          <div
            ref={editorRef}
            contentEditable
            role="textbox"
            aria-label="Journal body"
            data-placeholder={editorPlaceholder}
            onInput={() => setBody(editorRef.current?.innerHTML ?? "")}
            className="prose-editor min-h-[28rem] rounded-lg border border-ink/10 bg-paper px-6 py-6 font-serif text-2xl leading-10 text-ink outline-none transition focus:border-moss"
          />
        </section>

        <section>
          <label className="text-xs font-semibold uppercase tracking-[0.24em] text-moss">
            Write a 1-2 line teaser for the feed card
          </label>
          <textarea
            value={teaser}
            onChange={(event) => setTeaser(event.target.value)}
            placeholder="What's the one line that makes someone want to read this?"
            rows={3}
            className="mt-3 w-full resize-none rounded-lg border border-ink/10 bg-paper px-5 py-4 text-base leading-7 text-ink outline-none transition placeholder:text-ink/35 focus:border-moss"
          />
        </section>

        {error ? (
          <p className="rounded-lg border border-clay/30 bg-[#F4E3D8] px-5 py-4 text-sm font-semibold text-[#713B25]">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={publishJournal}
          disabled={isPublishing}
          className="w-full rounded-full bg-moss px-8 py-5 text-base font-bold text-paper transition hover:bg-ink disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPublishing ? "Publishing..." : "Publish to Atlas"}
        </button>
      </div>
    </section>
  );
}
