import { describe, expect, it } from "vitest";
import { encodePolyline } from "@katapatha/core/domain/polyline";
import { anyStraightRoutes, toLayers } from "./map-layers";
import type { MapVehicle } from "./map-view";

const base: MapVehicle = {
  vehicleId: "VEH101",
  vehicleType: "truck",
  vehicleTemp: "reefer",
  driverName: "Sunil Fernando",
  state: "ON_TIME",
  lateMinutes: 0,
  trip: { tripId: "t1", tripNo: 1, districtName: "Puttalam" },
  position: { lat: 7.5, lng: 79.85, accuracyM: 10, recordedAt: "2026-10-04T01:00:00.000Z", ageSeconds: 60, lamp: false },
  nextStop: null,
  stops: [
    { stopNumber: 1, outletId: "OUT070", outletName: "Fresh Chilaw", status: "DONE", lat: 7.57, lng: 79.79 },
    { stopNumber: 2, outletId: "OUT074", outletName: "OUT074", status: "PENDING", lat: 8.03, lng: 79.82 },
    { stopNumber: 3, outletId: "OUT075", outletName: "No position", status: "PENDING", lat: null, lng: null },
  ],
  route: {
    polyline: encodePolyline([
      { lat: 6.9689, lng: 79.8936 },
      { lat: 8.0362, lng: 79.8283 },
    ]),
    km: 129.4,
    live: true,
  },
};

describe("toLayers", () => {
  it("decodes the road route and keeps only stops with a known position", () => {
    const [layer] = toLayers([base], undefined, (id) => `/m?vehicle=${id}`);
    expect(layer!.route).toEqual([
      [6.9689, 79.8936],
      [8.0362, 79.8283],
    ]);
    expect(layer!.routeLive).toBe(true);
    expect(layer!.stops.map((s) => s.label)).toEqual(["1. OUT070 · Fresh Chilaw", "2. OUT074"]);
    expect(layer!.stops.map((s) => s.finished)).toEqual([true, false]);
    expect(layer!.href).toBe("/m?vehicle=VEH101");
  });

  it("never places a vehicle that has not reported, and gives an idle one no route", () => {
    const [layer] = toLayers([{ ...base, state: "IDLE", trip: null, position: null, stops: [], route: null }], "VEH101", (id) => id);
    expect(layer).toMatchObject({ position: null, route: null, idle: true, selected: true, stops: [] });
  });

  it("notices when a route is only a straight line", () => {
    expect(anyStraightRoutes(toLayers([base], undefined, (id) => id))).toBe(false);
    expect(anyStraightRoutes(toLayers([{ ...base, route: { ...base.route!, live: false } }], undefined, (id) => id))).toBe(true);
  });
});
