"use client";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, ZoomControl, useMap } from "react-leaflet";
import type { JournalMapPin } from "@/components/LiveWorldMap";

type AtlasLeafletMapProps = {
  pins: JournalMapPin[];
};

const categoryColors: Record<string, string> = {
  Adventure: "#4CAF50",
  Cultural: "#EF4444",
  Backpacking: "#F97316",
  Luxury: "#A855F7",
  "Slow travel": "#3B82F6",
  Food: "#EAB308",
  "Road trip": "#14B8A6"
};

function createCategoryIcon(category: string) {
  const color = categoryColors[category] ?? "#8A6040";
  return L.divIcon({
    className: "",
    html: `<div style="width:13px;height:13px;border-radius:50%;background:${color};border:2.5px solid white;box-shadow:0 1px 5px rgba(0,0,0,0.35)"></div>`,
    iconSize: [13, 13],
    iconAnchor: [6, 6],
    popupAnchor: [0, -10]
  });
}

function timeAgo(dateStr: string): string {
  const diff = Math.max(0, Date.now() - new Date(dateStr).getTime());
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function FitPins({ pins }: AtlasLeafletMapProps) {
  const map = useMap();

  useEffect(() => {
    if (pins.length === 0) {
      map.setView([20, 0], 2);
      return;
    }
    const bounds = L.latLngBounds(pins.map((pin) => [pin.lat, pin.lng]));
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: pins.length === 1 ? 8 : 4 });
  }, [map, pins]);

  return null;
}

export default function AtlasLeafletMap({ pins }: AtlasLeafletMapProps) {
  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      minZoom={2}
      scrollWheelZoom={false}
      className="h-full min-h-[560px] w-full"
      worldCopyJump
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <ZoomControl position="bottomright" />
      <FitPins pins={pins} />
      {pins.map((pin) => (
        <Marker
          key={pin.id}
          position={[pin.lat, pin.lng]}
          icon={createCategoryIcon(pin.category)}
        >
          <Popup className="atlas-popup" maxWidth={232} minWidth={200}>
            <div style={{ width: "200px", fontFamily: "inherit" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <div style={{
                  width: "28px", height: "28px", borderRadius: "50%",
                  background: "#244033", color: "white", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: "11px", fontWeight: "700", flexShrink: 0
                }}>
                  {pin.authorName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ fontSize: "11px", fontWeight: "600", color: "#221F1A", lineHeight: "1.2", margin: 0 }}>
                    {pin.authorName}
                  </p>
                  <p style={{ fontSize: "10px", color: "#221F1A", opacity: 0.5, margin: 0 }}>
                    {pin.locationName}
                  </p>
                </div>
              </div>

              {pin.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={pin.photoUrl}
                  alt={pin.title}
                  style={{ width: "100%", height: "100px", objectFit: "cover", borderRadius: "6px", display: "block", marginBottom: "8px" }}
                />
              )}

              <p style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: "14px", fontWeight: "600", color: "#221F1A", lineHeight: "1.3", margin: "0 0 4px" }}>
                {pin.title}
              </p>

              {pin.teaser && (
                <p style={{ fontSize: "11px", color: "#221F1A", opacity: 0.6, margin: "0 0 8px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {pin.teaser}
                </p>
              )}

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "10px", color: "#221F1A", opacity: 0.4 }}>
                  {timeAgo(pin.createdAt)}
                </span>
                <a
                  href={`/journals/${pin.id}`}
                  style={{ fontSize: "11px", fontWeight: "600", color: "#244033", textDecoration: "none" }}
                >
                  Read →
                </a>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
