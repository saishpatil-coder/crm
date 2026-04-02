const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function backfillSlugs() {
  const tenants = await prisma.tenant.findMany({ where: { slug: null } });
  console.log(`Found ${tenants.length} tenants without slugs. Backfilling...`);

  for (const tenant of tenants) {
    const baseSlug = tenant.candidateName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      + "-" + tenant.createdAt.getFullYear();

    let slug = baseSlug;
    let attempt = 0;
    while (await prisma.tenant.findUnique({ where: { slug } })) {
      attempt++;
      slug = `${baseSlug}-${attempt}`;
    }

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { slug },
    });
    console.log(`  ✅ ${tenant.candidateName} → ${slug}`);
  }

  console.log("Done!");
}

backfillSlugs().catch(console.error).finally(() => prisma.$disconnect());
