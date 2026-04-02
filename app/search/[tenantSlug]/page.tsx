import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import PublicSearchClient from "./SearchClient";

interface Props {
  params: Promise<{ tenantSlug: string }>;
}

// ─── SEO: Dynamic Metadata ──────────────────────────────────────
export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug: params.tenantSlug },
    select: { candidateName: true, partyName: true, constituencyName: true, candidatePhotoUrl: true },
  });

  if (!tenant) return { title: "Not Found" };

  const title = `${tenant.candidateName} - Voter Assistance Portal`;
  const description = `Find your polling station, serial number, and booth details for ${tenant.constituencyName}. Powered by ${tenant.candidateName}'s campaign.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: tenant.candidatePhotoUrl ? [tenant.candidatePhotoUrl] : [],
    },
  };
}

// ─── Server Component: Fetch Tenant & Render ────────────────────
export default async function PublicSearchPage(props: Props) {
  const params = await props.params;
  const tenant = await prisma.tenant.findUnique({
    where: { slug: params.tenantSlug },
    select: {
      candidateName: true,
      partyName: true,
      partyLogoUrl: true,
      candidatePhotoUrl: true,
      constituencyName: true,
      slug: true,
    },
  });

  if (!tenant) return notFound();

  return <PublicSearchClient tenant={tenant} />;
}
