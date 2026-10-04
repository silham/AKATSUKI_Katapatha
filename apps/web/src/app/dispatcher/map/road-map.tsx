"use client";

import "leaflet/dist/leaflet.css";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import type { LayerVehicle, Point } from "./map-layers";

/**
 * The fleet on an OpenStreetMap base map.
 *
 * Each trip's route is drawn along the roads (OSRM's geometry), dashed where it
 * is only a straight-line stand-in. A vehicle marker is where the driver's phone
 * last reported it — not a live position, and absent if it never reported.
 *
 * Leaflet touches `window` when it loads, so it is imported inside the effect;
 * the server renders the empty frame and the browser fills it. The map is made
 * once and its layers are redrawn when the data changes, so moving between days
 * or vehicles does not rebuild the tiles.
 */

const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export function RoadMap({
  depot,
  vehicles,
  fitKey,
}: {
  depot: { name: string; at: Point } | null;
  vehicles: LayerVehicle[];
  /** Refit the view when this changes (the day, or the selected vehicle). */
  fitKey: string;
}) {
  const router = useRouter();
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const layers = useRef<LayerGroup | null>(null);
  const fitted = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void import("leaflet").then((L) => {
      if (cancelled || !container.current) return;

      if (!map.current) {
        map.current = L.map(container.current, { zoomControl: true, scrollWheelZoom: true }).setView(depot?.at ?? [7.8731, 80.7718], 9);
        L.tileLayer(TILE_URL, { maxZoom: 19, attribution: ATTRIBUTION }).addTo(map.current);
        layers.current = L.layerGroup().addTo(map.current);
      }
      const group = layers.current!;
      group.clearLayers();

      const bounds: Point[] = [];
      const selected = vehicles.find((v) => v.selected);

      // Routes first, so markers sit on top. The selected one is drawn last and heavier.
      const ordered = [...vehicles].sort((a, b) => Number(a.selected) - Number(b.selected));
      for (const v of ordered) {
        if (!v.route || v.route.length < 2) continue;
        const faded = selected && !v.selected;
        L.polyline(v.route, {
          className: v.stroke,
          weight: v.selected ? 6 : 4,
          opacity: faded ? 0.35 : 0.85,
          dashArray: v.routeLive ? undefined : "8 8",
        })
          .on("click", () => router.push(v.href))
          .addTo(group);
        if (!selected || v.selected) bounds.push(...v.route);
      }

      for (const v of vehicles) {
        if (selected && !v.selected) continue;
        for (const stop of v.stops) {
          L.marker(stop.at, {
            icon: L.divIcon({
              className: "",
              html: `<span class="block size-3.5 rounded-full border-2 border-ink ${stop.finished ? "bg-surface" : "bg-action"}"></span>`,
              iconSize: [14, 14],
              iconAnchor: [7, 7],
            }),
            keyboard: false,
          })
            .bindTooltip(escapeHtml(stop.label), { direction: "top", offset: [0, -6] })
            .addTo(group);
          bounds.push(stop.at);
        }
      }

      if (depot) {
        L.marker(depot.at, {
          icon: L.divIcon({
            className: "",
            html: `<span class="grid size-7 place-items-center rounded-md bg-navy text-white shadow" aria-hidden="true"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M4 11l8-7 8 7v9H4z"/></svg></span>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14],
          }),
          zIndexOffset: 500,
          title: depot.name,
        })
          .bindTooltip(escapeHtml(depot.name), { direction: "right", offset: [12, 0], permanent: true, className: "font-semibold" })
          .addTo(group);
        bounds.push(depot.at);
      }

      for (const v of vehicles) {
        if (!v.position) continue;
        const ring = v.selected ? "ring-4 ring-ink" : "";
        const edge = v.lamp ? "border-2 border-dashed border-warn" : "border-2 border-surface";
        L.marker(v.position, {
          icon: L.divIcon({
            className: "",
            html: `<span class="grid size-8 place-items-center rounded-full shadow ${v.fill} ${edge} ${ring} ${v.lamp || v.idle ? "text-ink" : "text-white"}"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h13v10H3z"/><path d="M16 10h3l2 3v4h-5"/></svg></span>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
          }),
          zIndexOffset: v.selected ? 1000 : 600,
          title: `${v.vehicleId}, ${v.label}`,
          alt: `${v.vehicleId}, ${v.label}`,
        })
          .bindTooltip(`<strong>${escapeHtml(v.vehicleId)}</strong> · ${escapeHtml(v.label)}`, { direction: "top", offset: [0, -14] })
          .on("click", () => router.push(v.href))
          .addTo(group);
        if (!selected || v.selected) bounds.push(v.position);
      }

      if (fitted.current !== fitKey && bounds.length > 0) {
        fitted.current = fitKey;
        if (bounds.length === 1) map.current!.setView(bounds[0]!, 13);
        else map.current!.fitBounds(L.latLngBounds(bounds), { padding: [36, 36], maxZoom: 14 });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [depot, vehicles, fitKey, router]);

  // Tear the map down only when the component goes away.
  useEffect(
    () => () => {
      map.current?.remove();
      map.current = null;
      layers.current = null;
    },
    [],
  );

  return (
    <div
      ref={container}
      role="region"
      aria-label="Map of the fleet on OpenStreetMap. Each vehicle is listed beside the map as well."
      className="z-0 h-[560px] w-full bg-raised xl:h-[640px]"
    />
  );
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
