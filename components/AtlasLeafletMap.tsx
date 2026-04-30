"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import type { JournalMapPin } from "@/components/LiveWorldMap";

type AtlasLeafletMapProps = {
  pins: JournalMapPin[];
};

const atlasMarkerIcon = L.divIcon({
  className: "",
  html:
    '<span class="atlas-map-pin"><span class="atlas-map-pin-dot"></span></span>',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -14]
});

function FitPins({ pins }: AtlasLeafletMapProps) {
  const map = useMap();

  useEffect(() => {
    if (pins.length === 0) {
      map.setView([20, 0], 2);
      return;
    }

    const bounds = L.latLngBounds(pins.map((pin) => [pin.lat, pin.lng]));
    map.fitBounds(bounds, {
      padding: [42, 42],
      maxZoom: pins.length === 1 ? 8 : 5
    });
  }, [map, pins]);

  return null;
}

export default function AtlasLeafletMap({ pins }: AtlasLeafletMapProps) {
  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      minZoom={2}
      scrollWheelZoom
      className="h-full min-h-[28rem] w-full"
      worldCopyJump
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <FitPins pins={pins} />
      {pins.map((pin) => (
        <Marker
          key={pin.id}
          position={[pin.lat, pin.lng]}
          icon={atlasMarkerIcon}
        >
          <Popup>
            <div className="min-w-44">
              <p className="font-serif text-xl font-semibold text-ink">{pin.title}</p>
              <p className="mt-1 text-sm text-ink/60">By {pin.authorName}</p>
              <a
                href={`/journals/${pin.id}`}
                className="mt-3 inline-flex rounded-full bg-moss px-4 py-2 text-xs font-semibold text-paper transition hover:bg-ink"
              >
                Read journal
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
