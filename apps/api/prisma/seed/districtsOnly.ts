/**
 * Add the districts of Sri Lanka that a database seeded earlier does not have,
 * without wiping anything. Fills gaps only.
 *
 *   pnpm db:seed:districts
 */

import { PrismaClient } from "@prisma/client";
import { seedDistricts } from "./districts";

const prisma = new PrismaClient();

seedDistricts(prisma)
  .then((added) => console.log(`[seed:districts] ${added} district(s) added (travel figures are estimates).`))
  .catch((err) => {
    console.error("[seed:districts] Failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
