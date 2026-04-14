import { NextResponse } from "next/server";
import { getStripe } from "@/utils/stripe";
import { createAdminClient } from "@/utils/supabase/admin";
import type { SubscriptionStatus } from "@/types/database";
import type Stripe from "stripe";

// Stripe requires the raw body for signature verification
export const runtime = "nodejs";

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus | null {
  const map: Partial<Record<Stripe.Subscription.Status, SubscriptionStatus>> = {
    active: "active",
    trialing: "trialing",
    past_due: "past_due",
    canceled: "canceled",
    incomplete: "incomplete",
  };
  return map[status] ?? null;
}

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const admin = createAdminClient();

  async function updateProfile(customerId: string, subId: string, status: SubscriptionStatus) {
    // Look up user by stripe_customer_id
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .single();

    if (!profile) {
      console.warn("No profile found for stripe customer:", customerId);
      return;
    }

    await admin
      .from("profiles")
      .update({
        stripe_subscription_id: subId,
        stripe_subscription_status: status,
      })
      .eq("id", profile.id);
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const status = mapStripeStatus(sub.status);
      if (status) {
        await updateProfile(sub.customer as string, sub.id, status);
      }
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await updateProfile(sub.customer as string, sub.id, "canceled");
      break;
    }
    default:
      // Unhandled event type — acknowledge receipt
      break;
  }

  return NextResponse.json({ received: true });
}
