import { describe, expect, it } from "vitest";
import { DEPOT_POSITIONS, DISTRICT_POSITIONS, withinSriLanka } from "@katapatha/core/domain/geography";
import { ROAD_CLASS_BY_DISTRICT, districtRows, nearestDepot } from "./districts";

const depots = Object.entries(DEPOT_POSITIONS).map(([code, at]) => ({ code, ...at }));

describe("districts of Sri Lanka", () => {
  it("covers all twenty-five, each with a centre on the island and a road class", () => {
    const names = Object.keys(DISTRICT_POSITIONS);
    expect(names).toHaveLength(25);
    expect(Object.keys(ROAD_CLASS_BY_DISTRICT).sort()).toEqual([...names].sort());
    for (const name of names) expect(withinSriLanka(DISTRICT_POSITIONS[name]!), name).toBe(true);
  });

  it("gives every district exactly one depot, the nearest, and sensible figures", () => {
    const rows = districtRows(depots);
    expect(rows).toHaveLength(25);
    expect(new Set(rows.map((r) => r.name)).size).toBe(25);
    for (const r of rows) {
      expect(depots.map((d) => d.code), r.name).toContain(r.depotCode);
      expect(r.depotToDistrictKm, r.name).toBeGreaterThanOrEqual(1);
      expect(r.depotToDistrictFreeflowMin, r.name).toBeGreaterThan(0);
      // The implied speed is the class's free-flow speed, within rounding.
      expect(((r.depotToDistrictKm / r.depotToDistrictFreeflowMin) * 60) / r.freeFlowKmh, r.name).toBeGreaterThan(0.8);
      expect(((r.depotToDistrictKm / r.depotToDistrictFreeflowMin) * 60) / r.freeFlowKmh, r.name).toBeLessThan(1.2);
    }
  });

  it("sends the south and west to Peliyagoda and the hill country and far north to Kandy's side by distance alone", () => {
    const byName = new Map(districtRows(depots).map((r) => [r.name, r.depotCode]));
    expect(byName.get("Galle")).toBe("Peliyagoda");
    expect(byName.get("Kalutara")).toBe("Peliyagoda");
    expect(byName.get("Nuwara Eliya")).toBe("Kandy");
    expect(byName.get("Badulla")).toBe("Kandy");
  });

  it("farther districts cost more than nearer ones, so a plan can tell them apart", () => {
    const rows = new Map(districtRows(depots).map((r) => [r.name, r]));
    expect(rows.get("Jaffna")!.depotToDistrictKm).toBeGreaterThan(rows.get("Kurunegala")!.depotToDistrictKm);
    expect(rows.get("Jaffna")!.depotToDistrictFreeflowMin).toBeGreaterThan(rows.get("Gampaha")!.depotToDistrictFreeflowMin);
  });

  it("picks the nearest of the depots it is given, and none when there are none", () => {
    expect(nearestDepot(DISTRICT_POSITIONS.Kandy!, depots)?.code).toBe("Kandy");
    expect(nearestDepot(DISTRICT_POSITIONS.Colombo!, depots)?.code).toBe("Peliyagoda");
    expect(nearestDepot(DISTRICT_POSITIONS.Colombo!, [])).toBeNull();
    // With a single depot, every district belongs to it.
    expect(new Set(districtRows([depots[0]!]).map((r) => r.depotCode)).size).toBe(1);
  });
});
