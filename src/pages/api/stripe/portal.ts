import type { APIRoute } from "astro";
import Stripe from "stripe";
import { customerIdForEmail } from "../../../lib/billing-store.ts";
import {
  idOf,
  messageResponse,
  normalizeEmail,
  paymentsNotConfiguredResponse,
  readPortalConfig,
  readRequestFields,
  readSupabaseConfig,
} from "../../../lib/billing.ts";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const config = readPortalConfig();
    if (!config) return paymentsNotConfiguredResponse(request);

    const fields = await readRequestFields(request);
    const stripe = new Stripe(config.stripeSecretKey);
    const customerId = await resolveCustomer(stripe, fields);
    if (customerId === "unconfigured") return paymentsNotConfiguredResponse(request);
    if (!customerId) {
      return messageResponse(
        request,
        400,
        "No subscription found",
        "Open billing from the checkout confirmation, or use the email on the subscription.",
      );
    }

    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${config.siteUrl}/pricing`,
    });
    return Response.redirect(portal.url, 303);
  } catch (error) {
    console.error("stripe portal failed", error instanceof Error ? error.message : "unknown");
    return messageResponse(request, 500, "Billing portal unavailable", "The billing portal could not be opened.");
  }
};

async function resolveCustomer(stripe: Stripe, fields: Record<string, string>): Promise<string | null | "unconfigured"> {
  const sessionId = fields.session_id?.trim();
  if (sessionId && !sessionId.includes("{")) {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    return idOf(session.customer);
  }
  const email = normalizeEmail(fields.email);
  if (email === "invalid" || !email) return null;
  const supabase = readSupabaseConfig();
  if (!supabase) return "unconfigured";
  return customerIdForEmail(supabase.url, supabase.serviceRoleKey, email);
}
