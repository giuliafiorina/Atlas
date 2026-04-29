import { getRankProgress } from "@/data/journals";

type RankProgressProps = {
  points: number;
};

export function RankProgress({ points }: RankProgressProps) {
  const progress = getRankProgress(points);

  return (
    <div className="rounded-lg border border-ink/10 bg-paper p-4 shadow-[0_14px_40px_rgba(34,31,26,0.05)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink/45">
            Level {progress.current.level}
          </p>
          <p className="mt-1 font-serif text-3xl font-semibold leading-none text-ink">
            {progress.current.name}
          </p>
        </div>
        <p className="rounded-full bg-[#EAC06C] px-3 py-1 text-sm font-bold text-ink">
          {points.toLocaleString()} pts
        </p>
      </div>

      <div className="mt-4 h-3 overflow-hidden rounded-full bg-oatmeal">
        <div
          className="h-full rounded-full bg-[#E7A93C] transition-all duration-700 ease-out"
          style={{ width: `${progress.percent}%` }}
          aria-hidden="true"
        />
      </div>

      <p className="mt-3 text-sm font-medium text-ink/65">
        {progress.next
          ? `${progress.pointsToNext.toLocaleString()} points to ${progress.next.name}`
          : "Top rank reached"}
      </p>
    </div>
  );
}
