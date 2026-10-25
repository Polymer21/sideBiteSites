import {
  keepLivePrice,
  money,
  priceDifference,
  provisional,
} from "./provisional";

export const marketingFaq = [
  {
    id: "guests-account",
    q: "Do my guests need an account?",
    a: "No. Guests never sign in. They open your link and RSVP from the page.",
    mobile: true,
  },
  {
    id: "after-publish",
    q: "Can I change things after publishing?",
    a: `Yes. Celebrate includes ${provisional.rounds.celebrate} rounds of changes we make for you. Milestone includes ${provisional.rounds.milestone} change rounds. That count may change.`,
    mobile: true,
  },
  {
    id: "own-domain",
    q: "Can I use my own domain?",
    a: `Your own web address is on Milestone. Other plans use a ${provisional.domain} link. The domain in links is still provisional.`,
    mobile: false,
  },
  {
    id: "cost",
    q: "What does it cost?",
    a: `Free draft ${money(provisional.prices.free)}, Gather ${money(provisional.prices.gather)}, Celebrate ${money(provisional.prices.celebrate)}, Milestone ${money(provisional.prices.milestone)}, one-time per event. Hosting is included until a month after your event. After that, Keep it live is optional: ${keepLivePrice()}.`,
    mobile: true,
  },
] as const;

export const eventTypes = [
  {
    id: "halloween",
    name: "Halloween",
    body: "Costume parties, haunted nights, seasonal bashes.",
    icon: "pumpkin",
    coming: "",
  },
  {
    id: "run",
    name: "Run club",
    body: "Weekly runs, races and social meetups.",
    icon: "calendar",
    coming: "",
  },
  {
    id: "tech",
    name: "Tech meetup",
    body: "Talks, demos and community nights.",
    icon: "calendar",
    coming: "Coming Oct 26",
  },
  {
    id: "nightlife",
    name: "Nightlife",
    body: "Club nights, DJ sets and launches.",
    icon: "clock",
    coming: "Coming Oct 28",
  },
  {
    id: "wedding",
    name: "Wedding",
    body: "Ceremony, reception and weekend plans.",
    icon: "calendar",
    coming: "",
  },
  {
    id: "other",
    name: "Something else",
    body: "Start from a clean layout.",
    icon: "plus",
    coming: "",
  },
] as const;

export const sections = [
  { id: "hero", label: "Hero" },
  { id: "details", label: "Details" },
  { id: "schedule", label: "Schedule" },
  { id: "included", label: "What’s included" },
  { id: "rsvp", label: "RSVP" },
  { id: "gallery", label: "Gallery" },
  { id: "location", label: "Location" },
  { id: "faq", label: "FAQ" },
] as const;

export type SectionId = (typeof sections)[number]["id"];

export const includedItems = [
  {
    n: "01",
    title: "What to expect",
    body: "Costume parade, haunted photo booth and a spooky-snack table.",
  },
  { n: "02", title: "Costumes", body: "Costumes encouraged. Masks welcome." },
  { n: "03", title: "Snacks", body: "Spooky snacks provided. Bring a friend." },
] as const;

export const eventFaqs = [
  { q: "Dress code", a: "Costumes encouraged. Masks welcome." },
  { q: "What to bring", a: "A sweet tooth and a friend." },
  { q: "Age policy", a: "All ages until 9 pm." },
] as const;

export const schedule = [
  { time: "7:00 pm", label: "Doors" },
  { time: "8:00 pm", label: "Costume parade" },
  { time: "9:30 pm", label: "Haunted photo booth" },
] as const;

export const guests = [
  { name: "Maya Chen", email: "maya@example.com", status: "Going", note: "Bringing a plus-one" },
  { name: "Jordan Ruiz", email: "jordan@example.com", status: "Going", note: "Vampire costume" },
  { name: "Sam Patel", email: "sam@example.com", status: "Maybe", note: "—" },
  { name: "Alex Kim", email: "alex@example.com", status: "Can’t go", note: "Next time!" },
] as const;

export const defaultDraft = {
  eventType: "halloween",
  name: "Spooky Soirée",
  tagline: "Costumes mandatory. Candy optional.",
  date: "Sat, 31 Oct",
  dateLong: "Sat, 31 Oct 2026",
  time: "7:00 pm",
  venue: "The Old Mill",
  address: "12 Hollow Lane, Boulder, CO",
  host: "The Hoyts",
  button: "RSVP",
  layout: "halloween" as "halloween" | "premium" | "run",
  palette: "tripletree" as "tripletree" | "default" | "premium",
  tier: "celebrate" as "free" | "gather" | "celebrate" | "milestone",
  hidden: ["gallery"] as SectionId[],
  slug: "spooky-soiree",
  hostingUntil: "30 Nov 2026",
  hostingShort: "30 Nov",
};

export const upgradePrompts = [
  {
    n: "1 · Shared a draft",
    title: "Ready to share? Publish with Gather",
    body: `Event page, share link and RSVPs. Shared drafts show a watermark.`,
    price: `Gather ${money(provisional.prices.gather)}`,
    primary: "Publish with Gather",
    primaryHref: "/demo/checkout?tier=gather",
  },
  {
    n: "2 · Locked feature",
    title: "Custom colors are on Celebrate",
    body: `Colors, fonts, extra sections, no badge and change requests. Pay only the difference: ${priceDifference(provisional.prices.gather, provisional.prices.celebrate)}.`,
    extra: `Milestone unlocks the Premium template, your own domain, reminders, guest list download and a page password.`,
    price: `Celebrate ${money(provisional.prices.celebrate)}`,
    primary: "Upgrade to Celebrate",
    primaryHref: "/demo/checkout?tier=celebrate",
  },
  {
    n: "3 · 3rd change round",
    title: "That’s your 3rd change round",
    body: `Milestone includes ${provisional.rounds.milestone} change rounds* and the Premium template. Pay only the difference: ${priceDifference(provisional.prices.celebrate, provisional.prices.milestone)}.`,
    price: `Milestone ${money(provisional.prices.milestone)}`,
    primary: "Upgrade to Milestone",
    primaryHref: "/demo/checkout?tier=milestone",
  },
  {
    n: "4 · Takedown warning · 7 days and 1 day",
    title: "Your page goes offline in 7 days",
    body: `Keep it live for ${keepLivePrice()}, or download your guest list first. We also warn you by email, text or both.`,
    primary: "Keep it live",
    primaryHref: "/demo/checkout?tier=celebrate",
    secondary: "Download guest list",
  },
  {
    n: "5 · Page on hold",
    title: "Bring your page back",
    body: `Your page is on hold. Restore it any time within 12 months with Keep it live: ${keepLivePrice()}.`,
    primary: "Bring it back",
    primaryHref: "/demo/checkout?tier=celebrate",
  },
] as const;
