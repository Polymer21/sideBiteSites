# Sidebite

Static marketing site and clickable host-flow mockups for Sidebite. Built with Astro (`output: "static"`) from the Product Design v1 frames. There is no backend, no account system, and no payment processing.

## Pages

| Route | Frame |
| --- | --- |
| `/` | 01 Marketing home, with the 390 layout under 760px |
| `/pricing` | 08 Pricing tiers |
| `/demo/event-type` | 02 Event type |
| `/demo/event-basics` | 03 Event basics |
| `/demo/template` | 04 Template + palette (390 layout included) |
| `/demo/editor` | 05 Editor (390 layout included). Updates the preview in this browser only |
| `/demo/preview` | 06 Preview |
| `/demo/account` | 07 Account creation |
| `/demo/checkout` | 09 Checkout (390 layout included) |
| `/demo/published` | 10 Publish success |
| `/demo/dashboard` | 11 Dashboard |
| `/e/demo` | 12 RSVP guest view |

Auth, checkout, and RSVP controls only move to the next mockup. The editor keeps a draft in `sessionStorage` for the current tab so the preview can update. Nothing is sent to a server.

## Provisional facts

Prices, Milestone’s change-round count and feature list, and the domain live in `src/content/provisional.ts`. The domain value in this build is `sidebitesites.com`.

## Palettes

Every color in the UI is a custom property. Each `data-palette` block declares the same 32 color tokens as `Polymer21/sidebite2026` (`src/styles/tokens.css`).

| `data-palette` | Theme | Page | Accent | Text |
| --- | --- | --- | --- | --- |
| `tripletree` | TripleTee | `#fcfbfa` | `#426849` | `#1a3820` |
| `default` | Default | `#ffffff` | `#2563eb` | `#18181b` |
| `premium` | Premium | `#f4efe6` | `#4f5b43` | `#26221d` |

The root layout sets `data-palette="tripletree"`, so launch pages stay on the green TripleTee look. Default and Premium stay selectable on the template step, which sets `data-palette` on `<html>`.

## Develop

```bash
npm install
npm run build
npm test
npm run preview
```

`vercel.json` points Vercel at the static `dist` output. Do not attach a server adapter.
