import { money, monthlyPrice, plansCatalog } from "./plans";

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
    a: `Yes. Celebrate includes ${plansCatalog.rounds.celebrate} rounds of changes we make for you. Milestone includes ${plansCatalog.rounds.milestone} change rounds.`,
    mobile: true,
  },
  {
    id: "own-domain",
    q: "Can I use my own domain?",
    a: `Your own web address is on Milestone. Other plans use a ${plansCatalog.domain} link.`,
    mobile: false,
  },
  {
    id: "cost",
    q: "What does it cost?",
    a: `Free is ${money(plansCatalog.prices.free)} for ${plansCatalog.trialDays} days, then ${money(plansCatalog.prices.gather)}/month as Gather. Card required. It renews automatically unless you cancel before day ${plansCatalog.trialDays}. Celebrate is ${monthlyPrice(plansCatalog.prices.celebrate)} and Milestone is ${monthlyPrice(plansCatalog.prices.milestone)}, each with a ${plansCatalog.trialDays}-day trial.`,
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
  tier: "celebrate" as "gather" | "celebrate" | "milestone",
  hidden: ["gallery"] as SectionId[],
  slug: "spooky-soiree",
  hostingUntil: "30 Nov 2026",
  hostingShort: "30 Nov",
};

export const upgradePrompts = [
  {
    n: "1 · Ready to publish",
    title: "Publish with Gather",
    body: "Event page, share link and RSVPs. A card starts the 7-day trial.",
    price: `Gather ${monthlyPrice(plansCatalog.prices.gather)}`,
    primary: "Start Gather trial",
    primaryHref: "/checkout/gather",
  },
  {
    n: "2 · Locked feature",
    title: "Custom colors are on Celebrate",
    body: "Colors, fonts, extra sections, no badge and change requests. Switch plans any time and Stripe prorates the month.",
    extra: "Milestone unlocks the Premium template, your own domain, reminders, guest list download and a page password.",
    price: `Celebrate ${monthlyPrice(plansCatalog.prices.celebrate)}`,
    primary: "Start Celebrate trial",
    primaryHref: "/checkout/celebrate",
  },
  {
    n: "3 · 3rd change round",
    title: "That’s your 3rd change round",
    body: `Milestone includes ${plansCatalog.rounds.milestone} change rounds and the Premium template.`,
    price: `Milestone ${monthlyPrice(plansCatalog.prices.milestone)}`,
    primary: "Start Milestone trial",
    primaryHref: "/checkout/milestone",
  },
  {
    n: "4 · Trial ending",
    title: "Your trial is ending",
    body: "Your card on file is charged when the trial ends. Update the card or cancel in the billing portal.",
    primary: "Manage billing",
    primaryHref: "/checkout/success",
    secondary: "Download guest list",
  },
  {
    n: "5 · Page on hold",
    title: "Bring your page back",
    body: "Your page is on hold because the subscription isn’t active. Start a plan to publish again.",
    primary: "See plans",
    primaryHref: "/pricing",
  },
] as const;
