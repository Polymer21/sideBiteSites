import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { BillingStore, BillingUpdate } from "./billing.ts";

type DbError = { code?: string; message?: string } | null;

function assertOk(error: DbError, action: string): void {
  if (error) throw new Error(`${action}: ${error.message ?? error.code ?? "supabase error"}`);
}

export function createBillingStore(url: string, serviceRoleKey: string): BillingStore {
  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return new SupabaseBillingStore(supabase);
}

class SupabaseBillingStore implements BillingStore {
  constructor(private readonly supabase: SupabaseClient) {}

  async claimEvent(id: string, type: string): Promise<"new" | "duplicate"> {
    const { error } = await this.supabase.from("stripe_webhook_events").insert({ id, type, payload: { id, type } });
    if (error?.code === "23505") return "duplicate";
    assertOk(error, "claim webhook event");
    return "new";
  }

  async releaseEvent(id: string): Promise<void> {
    const { error } = await this.supabase.from("stripe_webhook_events").delete().eq("id", id);
    assertOk(error, "release webhook event");
  }

  async apply(update: BillingUpdate): Promise<void> {
    if (update.kind === "customer") {
      const { error } = await this.supabase.from("customers").upsert(update.row, { onConflict: "stripe_customer_id" });
      assertOk(error, "upsert customer");
      return;
    }
    if (update.kind === "subscription") {
      const { error } = await this.supabase
        .from("subscriptions")
        .upsert(update.row, { onConflict: "stripe_subscription_id" });
      assertOk(error, "upsert subscription");
      return;
    }
    if (update.kind === "trial_will_end") {
      const { error } = await this.supabase
        .from("subscriptions")
        .update({ trial_will_end_notified_at: update.at, updated_at: update.at })
        .eq("stripe_subscription_id", update.stripeSubscriptionId);
      assertOk(error, "mark trial ending");
      return;
    }
    const status = update.invoiceStatus === "failed" ? "past_due" : undefined;
    const patch: Record<string, string> = {
      latest_invoice_status: update.invoiceStatus,
      updated_at: new Date().toISOString(),
    };
    if (status) patch.status = status;
    const { error } = await this.supabase
      .from("subscriptions")
      .update(patch)
      .eq("stripe_subscription_id", update.stripeSubscriptionId);
    assertOk(error, "note invoice");
  }
}

export async function customerIdForEmail(url: string, serviceRoleKey: string, email: string): Promise<string | null> {
  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase
    .from("customers")
    .select("stripe_customer_id")
    .eq("email", email)
    .order("updated_at", { ascending: false })
    .limit(1);
  assertOk(error, "lookup customer");
  const row = data?.[0] as { stripe_customer_id?: string } | undefined;
  return row?.stripe_customer_id ?? null;
}
