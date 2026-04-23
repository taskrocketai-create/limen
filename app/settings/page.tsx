import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import SettingsClient from "@/components/settings/SettingsClient";
import { PREVIEW_MODE, MOCK_REALTOR_NAME } from "@/utils/preview-data";

export const metadata = { title: "Settings — Limen" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  if (PREVIEW_MODE) {
    return (
      <SettingsClient
        email="sarah@example.com"
        profile={{
          full_name: MOCK_REALTOR_NAME,
          license_number: "NC-291847",
          brokerage: "Coastal Realty Group",
          phone: "(910) 555-0188",
          stripe_subscription_status: "active",
          stripe_customer_id: "cus_preview",
        }}
      />
    );
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, license_number, brokerage, phone, stripe_subscription_status, stripe_customer_id"
    )
    .eq("id", user.id)
    .maybeSingle();

  return (
    <SettingsClient
      email={user.email ?? ""}
      profile={
        profile ?? {
          full_name: "",
          license_number: null,
          brokerage: null,
          phone: null,
          stripe_subscription_status: null,
          stripe_customer_id: null,
        }
      }
    />
  );
}
