import { decodePolyline } from "@katapatha/core/domain/polyline";
import { STATE_VIEW, stateLabel, type MapVehicle } from "./map-view";

/**
 * What the road map draws, as plain data: the page is a server component and
 * the map is a client one, so everything crosses as JSON. Routes are decoded
 * here so the browser does not ship a polyline decoder.
 */

export type Point = [lat: number, lng: number];

export interface LayerStop {
  at: Point;
  label: string;
  /** Delivered, skipped or failed: drawn hollow. */
  finished: boolean;
}

export interface LayerVehicle {
  vehicleId: string;
  label: string;
  href: string;
  selected: boolean;
  lamp: boolean;
  idle: boolean;
  /** Tailwind classes for the marker dot and the route line, from STATE_VIEW. */
  fill: string;
  stroke: string;
  /** Where the phone last reported. Never invented. */
  position: Point | null;
  /** Road geometry, or a straight-line stand-in when `routeLive` is false. */
  route: Point[] | null;
  routeLive: boolean;
  stops: LayerStop[];
}

export function toLayers(vehicles: readonly MapVehicle[], selectedId: string | undefined, hrefFor: (id: string) => string): LayerVehicle[] {
  return vehicles.map((v) => {
    const view = STATE_VIEW[v.state];
    return {
      vehicleId: v.vehicleId,
      label: stateLabel(v),
      href: hrefFor(v.vehicleId),
      selected: v.vehicleId === selectedId,
      lamp: v.state === "LAMP",
      idle: v.state === "IDLE",
      fill: view.dot,
      stroke: view.leg,
      position: v.position ? [v.position.lat, v.position.lng] : null,
      route: v.route ? decodePolyline(v.route.polyline).map((p): Point => [p.lat, p.lng]) : null,
      routeLive: v.route?.live ?? false,
      stops: v.stops.flatMap((s) =>
        s.lat !== null && s.lng !== null
          ? [{
              at: [s.lat, s.lng] as Point,
              label: `${s.stopNumber}. ${s.outletName === s.outletId ? s.outletId : `${s.outletId} · ${s.outletName}`}`,
              finished: s.status === "DONE" || s.status === "SKIPPED" || s.status === "FAILED",
            }]
          : [],
      ),
    };
  });
}

/** Whether any route on the map is a straight-line stand-in rather than the road. */
export function anyStraightRoutes(layers: readonly LayerVehicle[]): boolean {
  return layers.some((l) => l.route !== null && !l.routeLive);
}
