import { notFound } from "next/navigation";
import { createAdminClient } from "@/utils/supabase/admin";
import HomeownerIntakeForm from "@/components/intake/HomeownerIntakeForm";
import { PREVIEW_MODE } from "@/utils/preview-data";

interface IntakePageProps {
  params: { token: string };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function generateMetadata(_props: IntakePageProps) {
  return { title: "Home intake — Limen" };
}

export default async function IntakePage({ params }: IntakePageProps) {
  const { token } = params;

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(token)) notFound();

  // Preview mode — show a demo intake form without hitting the DB
  if (PREVIEW_MODE) {
    return (
      <HomeownerIntakeForm
        token={token}
        address="214 Oleander Drive, Wilmington, NC 28403"
        listingId="preview"
        alreadySubmitted={false}
      />
    );
  }

  const supabase = createAdminClient();

  const { data: listing, error } = await supabase
    .from("listings")
    .select("id, address_line1, address_line2, city, state, zip, status, intake_completed_at")
    .eq("intake_token", token)
    .single();

  if (error || !listing) notFound();

  const alreadySubmitted = !!listing.intake_completed_at;

  const address = [
    listing.address_line1,
    listing.address_line2,
    `${listing.city}, ${listing.state} ${listing.zip}`,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <HomeownerIntakeForm
      token={token}
      address={address}
      listingId={listing.id}
      alreadySubmitted={alreadySubmitted}
    />
  );
}
