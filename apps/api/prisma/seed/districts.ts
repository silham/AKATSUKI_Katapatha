/**
 * All twenty-five districts of Sri Lanka.
 *
 * The competition data names a handful of districts, which is all an outlet
 * could be in, so a dispatcher or admin adding a store outside them had no
 * district to choose. This adds the rest, and fills gaps only: a district that
 * is already there (from the CSV, or edited since) is never touched.
 *
 * What a district needs beyond its name is a depot and travel figures, and for
 * the districts the data does not cover those are ESTIMATES, not measurements:
 *
 *  - the depot is the nearest one by straight line (the mapping is 1:1);
 *  - the road class is a judgement from the terrain and the main road there;
 *  - distance is the straight line from the depot lengthened by that class's
 *    road factor, and time is that distance at the class's free-flow speed.
 *
 * The planner treats them like any others, so a plan reaching a far district
 * is only as good as these figures. The road network replaces them per leg when
 * it is reachable (pnpm osrm:up); until then they are what there is.
 */

import type { PrismaClient, RoadClass } from "@prisma/client";
import { DEPOT_POSITIONS, DISTRICT_POSITIONS, ROAD_FACTOR, haversineKm, type LatLng } from "@katapatha/core/domain/geography";

/** Free-flow speed by road class, as the CSV's own rows use them. */
export const FREE_FLOW_KMH: Record<RoadClass, number> = { urban: 28, suburban: 42, highway: 55, hill: 34 };

/** How far apart stops in one district are, by class. */
const INTER_STOP_KM: Record<RoadClass, number> = { urban: 5, suburban: 8, highway: 14, hill: 8 };

/** Stopping and turning in a district is slower than free-flow driving. */
const INTER_STOP_SPEED_SHARE = 0.8;

export const ROAD_CLASS_BY_DISTRICT: Record<string, RoadClass> = {
  Colombo: "urban",
  Gampaha: "suburban",
  Kalutara: "suburban",
  Galle: "suburban",
  Matara: "suburban",
  Kurunegala: "suburban",
  Kandy: "hill",
  Matale: "hill",
  "Nuwara Eliya": "hill",
  Badulla: "hill",
  Kegalle: "hill",
  Ratnapura: "hill",
  Puttalam: "highway",
  Hambantota: "highway",
  Monaragala: "highway",
  Ampara: "highway",
  Batticaloa: "highway",
  Trincomalee: "highway",
  Polonnaruwa: "highway",
  Anuradhapura: "highway",
  Vavuniya: "highway",
  Mannar: "highway",
  Mullaitivu: "highway",
  Kilinochchi: "highway",
  Jaffna: "highway",
};

export interface DepotPoint extends LatLng {
  code: string;
}

export interface DistrictRow {
  name: string;
  depotCode: string;
  roadClass: RoadClass;
  freeFlowKmh: number;
  depotToDistrictKm: number;
  depotToDistrictFreeflowMin: number;
  interStopKm: number;
  interStopFreeflowMin: number;
}

/** The nearest depot by straight line; null when there is none to choose from. */
export function nearestDepot(centre: LatLng, depots: readonly DepotPoint[]): DepotPoint | null {
  let best: DepotPoint | null = null;
  let bestKm = Infinity;
  for (const depot of depots) {
    const km = haversineKm(depot, centre);
    if (km < bestKm) {
      best = depot;
      bestKm = km;
    }
  }
  return best;
}

/** One row per district of Sri Lanka, estimated against the given depots. */
export function districtRows(depots: readonly DepotPoint[]): DistrictRow[] {
  const rows: DistrictRow[] = [];
  for (const [name, centre] of Object.entries(DISTRICT_POSITIONS)) {
    const roadClass = ROAD_CLASS_BY_DISTRICT[name];
    const depot = nearestDepot(centre, depots);
    if (!roadClass || !depot) continue;
    const kmh = FREE_FLOW_KMH[roadClass];
    const km = Math.max(1, Math.round(haversineKm(depot, centre) * ROAD_FACTOR[roadClass]));
    const stopKm = INTER_STOP_KM[roadClass];
    rows.push({
      name,
      depotCode: depot.code,
      roadClass,
      freeFlowKmh: kmh,
      depotToDistrictKm: km,
      depotToDistrictFreeflowMin: Math.round((km / kmh) * 60),
      interStopKm: stopKm,
      interStopFreeflowMin: Math.round((stopKm / (kmh * INTER_STOP_SPEED_SHARE)) * 60),
    });
  }
  return rows;
}

/** Adds the districts that are missing. Returns how many it added. */
export async function seedDistricts(prisma: PrismaClient): Promise<number> {
  const existing = await prisma.depot.findMany({ select: { code: true, lat: true, lng: true } });
  // A depot with no known position cannot be the nearest to anything.
  const depots = existing.flatMap((d) => {
    const at = d.lat !== null && d.lng !== null ? { lat: d.lat, lng: d.lng } : DEPOT_POSITIONS[d.code];
    return at ? [{ code: d.code, ...at }] : [];
  });
  const result = await prisma.district.createMany({ data: districtRows(depots), skipDuplicates: true });
  return result.count;
}
