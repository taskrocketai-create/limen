import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import NewListingForm from "@/components/listings/NewListingForm";

export const metadata = { title: "New listing — Limen" };

export default async function NewListingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <NewListingForm />;
}
