const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("👑 Creating Master Admin...");

  const role = await prisma.role.findUnique({
    where: { name: "MASTER_ADMIN" },
  });

  if (!role) {
    throw new Error("MASTER_ADMIN role not found. Run seed first.");
  }

  const existing = await prisma.user.findUnique({
    where: { mobileNumber: "9421221314" },
  });

  if (existing) {
    console.log("⚠ Master admin already exists");
    return;
  }

  const admin = await prisma.user.create({
    data: {
      name: "Super Admin",
      mobileNumber: "9421221314",
      roleId: role.id,
    },
  });

  console.log("✅ Master Admin Created:", admin);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
