import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/utils/password";

const prisma = new PrismaClient();

async function main() {
  // Super Admins are the app's own operators — not tied to any Business. They use
  // POST /businesses to onboard each new paying customer (creates the Business + its
  // first Admin account together). Always active: there's no license fee for them to pay.
  const superadminPassword = process.env.SUPERADMIN_PASSWORD ?? "ChangeMe123!";
  const superadmin1 = await prisma.user.upsert({
    where: { email: process.env.SUPERADMIN_1_EMAIL ?? "owner1@kasrevent.local" },
    update: {},
    create: {
      nom: "Super Admin 1",
      email: process.env.SUPERADMIN_1_EMAIL ?? "owner1@kasrevent.local",
      role: "SUPERADMIN",
      passwordHash: await hashPassword(superadminPassword),
      actif: true
    }
  });

  const superadmin2 = await prisma.user.upsert({
    where: { email: process.env.SUPERADMIN_2_EMAIL ?? "owner2@kasrevent.local" },
    update: {},
    create: {
      nom: "Super Admin 2",
      email: process.env.SUPERADMIN_2_EMAIL ?? "owner2@kasrevent.local",
      role: "SUPERADMIN",
      passwordHash: await hashPassword(superadminPassword),
      actif: true
    }
  });

  // Everything below is one demo Business, kept for local dev / the existing Railway
  // demo deployment. Real customers are onboarded via POST /businesses instead, not seeded.
  const business = await prisma.business.upsert({
    where: { id: "seed-business-1" },
    update: {},
    create: { id: "seed-business-1", nom: "Demo" }
  });

  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  // The demo business's own admin/gérant still go through the one-time-fee activation
  // gate (set SEED_ADMIN_ACTIVE=true for dev/demo where there's no fee to collect) —
  // this is independent of the Super Admin onboarding flow above.
  const seedActive = process.env.SEED_ADMIN_ACTIVE === "true";
  const admin = await prisma.user.upsert({
    where: { email: "admin@kasrevent.local" },
    update: {},
    create: {
      nom: "Administrateur",
      email: "admin@kasrevent.local",
      role: "ADMIN",
      businessId: business.id,
      passwordHash: await hashPassword(adminPassword),
      actif: seedActive
    }
  });

  const gerant = await prisma.user.upsert({
    where: { email: "gerant@kasrevent.local" },
    update: {},
    create: {
      nom: "Gérant",
      email: "gerant@kasrevent.local",
      role: "GERANT",
      businessId: business.id,
      passwordHash: await hashPassword(adminPassword),
      actif: seedActive
    }
  });

  const salle = await prisma.salle.upsert({
    where: { id: "seed-salle-1" },
    update: {},
    create: {
      id: "seed-salle-1",
      businessId: business.id,
      nom: "Salle Royale",
      localisation: "Alger",
      capacite: 300,
      tarif: 150000,
      equipementsInclus: ["Climatisation", "Sonorisation"],
      utilisateurId: admin.id
    }
  });

  const client = await prisma.client.upsert({
    where: { id: "seed-client-1" },
    update: {},
    create: {
      id: "seed-client-1",
      businessId: business.id,
      nom: "Benali",
      prenom: "Karim",
      telephone: "0555000000",
      email: "karim.benali@example.com",
      utilisateurId: admin.id
    }
  });

  await prisma.adminConfig.upsert({
    where: { businessId: business.id },
    update: {},
    create: { businessId: business.id, nom: "KasrEvent", numeroWhatsapp: "213555000000" }
  });

  console.log("Seeded Super Admins:", { superadmin1: superadmin1.email, superadmin2: superadmin2.email });
  console.log(`Super Admin password: ${superadminPassword}`);
  console.log("Seeded demo business:", { business: business.nom, admin: admin.email, gerant: gerant.email, salle: salle.nom, client: client.nom });
  console.log(`Demo admin/gérant password: ${adminPassword}`);
  console.log(`Demo admin/gérant active: ${seedActive} (set SEED_ADMIN_ACTIVE=true to seed them pre-activated)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
