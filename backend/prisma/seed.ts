import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/utils/password";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  // A freshly provisioned deployment (a new paying customer's copy of the app) starts
  // deactivated by default — set SEED_ADMIN_ACTIVE=true for your own dev/demo deployments
  // where there's no license fee to collect. Activate a real customer's account via
  // POST /auth/activate once they've paid (see ACTIVATION_SECRET in env.ts).
  const seedActive = process.env.SEED_ADMIN_ACTIVE === "true";
  const admin = await prisma.user.upsert({
    where: { email: "admin@kasrevent.local" },
    update: {},
    create: {
      nom: "Administrateur",
      email: "admin@kasrevent.local",
      role: "ADMIN",
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
      passwordHash: await hashPassword(adminPassword),
      actif: seedActive
    }
  });

  const salle = await prisma.salle.upsert({
    where: { id: "seed-salle-1" },
    update: {},
    create: {
      id: "seed-salle-1",
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
      nom: "Benali",
      prenom: "Karim",
      telephone: "0555000000",
      email: "karim.benali@example.com",
      utilisateurId: admin.id
    }
  });

  await prisma.adminConfig.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton", nom: "KasrEvent", numeroWhatsapp: "213555000000" }
  });

  console.log("Seeded:", { admin: admin.email, gerant: gerant.email, salle: salle.nom, client: client.nom });
  console.log(`Default password for seeded users: ${adminPassword}`);
  console.log(`Admin/Gérant accounts active: ${seedActive} (set SEED_ADMIN_ACTIVE=true to seed them pre-activated)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
