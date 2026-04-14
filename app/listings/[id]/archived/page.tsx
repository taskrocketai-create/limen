import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import Logo from "@/components/brand/Logo";
import StatusBadge from "@/components/ui/StatusBadge";

interface ArchivedPageProps {
  params: { id: string };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function generateMetadata(_a: ArchivedPageProps) {
  return { title: "Archived listing — Limen" };
}

export const dynamic = "force-dynamic";

function formatPrice(p: number | null) {
  if (!p) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(p);
}

export default async function ArchivedListingPage({ params }: ArchivedPageProps) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: listing, error } = await supabase
    .from("listings")
    .select(`
      id, address_line1, address_line2, city, state, zip,
      price, bedrooms, bathrooms, sqft, property_type,
      status, mls_number, submitted_at, created_at, updated_at
    `)
    .eq("id", params.id)
    .eq("realtor_id", user.id)
    .single();

  if (error || !listing) notFound();

  // If not actually sold/archived, redirect to active view
  if (listing.status !== "sold" && listing.status !== "archived") {
    redirect(`/listings/${params.id}`);
  }

  const { data: approvedOutput } = await supabase
    .from("ai_outputs")
    .select("listing_description, headline_variants, social_captions, approved_at")
    .eq("listing_id", params.id)
    .eq("approved", true)
    .single();

  const specs = [
    listing.bedrooms != null && `${listing.bedrooms} bd`,
    listing.bathrooms != null && `${listing.bathrooms} ba`,
    listing.sqft != null && `${listing.sqft.toLocaleString()} sqft`,
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-parchment">
      {/* Nav */}
      <header className="bg-ink sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Logo size={28} variant="primary" label="Limen" />
            </Link>
            <span className="font-sans text-stone/60 text-xs hidden sm:block">/</span>
            <Link href="/dashboard" className="font-sans text-xs text-stone hover:text-parchment hidden sm:block transition-colors">
              Dashboard
            </Link>
          </div>
          <StatusBadge status={listing.status} />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <p className="font-sans text-xs text-stone uppercase tracking-widest mb-2">
              {listing.status === "sold" ? "Sold" : "Archived"}
            </p>
            <h1 className="font-display text-4xl sm:text-5xl text-ink">{listing.address_line1}</h1>
            <p className="font-sans text-sm text-stone mt-1">
              {listing.city}, {listing.state} {listing.zip}
            </p>
          </div>
          {listing.price && (
            <div className="text-right">
              <p className="font-sans text-xs text-stone mb-1">Listed at</p>
              <p className="font-display text-4xl text-gilt">{formatPrice(listing.price)}</p>
            </div>
          )}
        </div>

        {/* Specs + MLS row */}
        <div className="flex flex-wrap gap-6 items-center border-y border-stone/10 py-4">
          {specs.map((s) => (
            <div key={s as string} className="text-center">
              <p className="font-display text-2xl text-ink">{(s as string).split(" ")[0]}</p>
              <p className="font-sans text-xs text-stone">{(s as string).split(" ").slice(1).join(" ")}</p>
            </div>
          ))}
          {listing.mls_number && (
            <div>
              <p className="font-sans text-xs text-stone">MLS #</p>
              <p className="font-sans text-sm font-medium text-ink">{listing.mls_number}</p>
            </div>
          )}
          {listing.submitted_at && (
            <div>
              <p className="font-sans text-xs text-stone">Submitted</p>
              <p className="font-sans text-sm text-ink">
                {new Date(listing.submitted_at).toLocaleDateString("en-US", {
                  year: "numeric", month: "long", day: "numeric",
                })}
              </p>
            </div>
          )}
        </div>

        {/* Approved copy — read-only */}
        {approvedOutput ? (
          <div className="space-y-6">
            {approvedOutput.headline_variants && approvedOutput.headline_variants.length > 0 && (
              <div className="space-y-2">
                <p className="font-sans text-xs font-medium text-stone uppercase tracking-widest">Headlines</p>
                {approvedOutput.headline_variants.map((h, i) => (
                  <p key={i} className="font-display text-2xl sm:text-3xl text-ink">{h}</p>
                ))}
              </div>
            )}

            {approvedOutput.listing_description && (
              <div className="space-y-2">
                <p className="font-sans text-xs font-medium text-stone uppercase tracking-widest">Listing description</p>
                <div className="bg-white border border-stone/20 rounded-lg p-6">
                  <p className="font-sans text-sm text-ink leading-relaxed whitespace-pre-wrap">
                    {approvedOutput.listing_description}
                  </p>
                </div>
              </div>
            )}

            {approvedOutput.social_captions && (
              <div className="space-y-3">
                <p className="font-sans text-xs font-medium text-stone uppercase tracking-widest">Social captions</p>
                <div className="grid sm:grid-cols-3 gap-3">
                  {(["instagram", "facebook", "twitter"] as const).map((platform) => {
                    const caption = (approvedOutput.social_captions as Record<string, string>)?.[platform];
                    if (!caption) return null;
                    const labels = { instagram: "Instagram", facebook: "Facebook", twitter: "Twitter" };
                    const icons = { instagram: "IG", facebook: "FB", twitter: "X" };
                    return (
                      <div key={platform} className="bg-white border border-stone/20 rounded-lg p-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-ink text-gilt flex items-center justify-center font-sans text-[9px] font-bold">
                            {icons[platform]}
                          </span>
                          <span className="font-sans text-xs font-medium text-stone">{labels[platform]}</span>
                        </div>
                        <p className="font-sans text-xs text-ink leading-relaxed">{caption}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white border border-stone/20 rounded-lg p-8 text-center">
            <p className="font-display text-xl text-stone">No approved copy on file.</p>
          </div>
        )}

        {/* Back */}
        <div className="pt-4">
          <Link href="/dashboard" className="font-sans text-sm text-gilt hover:underline">
            ← Back to dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
