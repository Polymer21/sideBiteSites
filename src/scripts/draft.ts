import { defaultDraft, sections, type SectionId } from "../content/copy";

export type Draft = typeof defaultDraft;

const KEY = "sidebite-draft";

export function readDraft(): Draft {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return { ...defaultDraft, hidden: [] };
    const parsed = JSON.parse(raw) as Partial<Draft>;
    return { ...defaultDraft, ...parsed, hidden: parsed.hidden ?? [] };
  } catch {
    return { ...defaultDraft, hidden: [] };
  }
}

export function writeDraft(partial: Partial<Draft>): Draft {
  const next = { ...readDraft(), ...partial };
  sessionStorage.setItem(KEY, JSON.stringify(next));
  document.documentElement.dataset.palette = next.palette;
  return next;
}

export function applyDraft(root: ParentNode = document): void {
  const draft = readDraft();
  document.documentElement.dataset.palette = draft.palette;
  const text: Record<string, string> = {
    name: draft.name,
    tagline: draft.tagline,
    date: draft.date,
    time: draft.time,
    venue: draft.venue,
    address: draft.address,
    host: draft.host,
    button: draft.button,
  };
  root.querySelectorAll<HTMLElement>("[data-field]").forEach((node) => {
    if (node.closest("[data-frozen]")) return;
    const key = node.dataset.field;
    if (!key || text[key] == null) return;
    if (node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) {
      if (document.activeElement !== node) node.value = text[key];
    } else {
      node.textContent = text[key];
    }
  });
  root.querySelectorAll<HTMLElement>("[data-event-root]").forEach((node) => {
    if (node.closest("[data-frozen]")) return;
    node.dataset.layout = draft.layout;
    node.classList.remove("layout-halloween", "layout-premium", "layout-run");
    node.classList.add(`layout-${draft.layout}`);
  });
  root.querySelectorAll<HTMLElement>("[data-section]").forEach((node) => {
    if (node.closest("[data-frozen]")) return;
    const id = node.dataset.section as SectionId;
    node.hidden = draft.hidden.includes(id);
  });
  root.querySelectorAll<HTMLElement>("[data-tier-price]").forEach((node) => {
    node.textContent = draft.tier;
  });
}

export function sectionList(): { id: SectionId; label: string }[] {
  return sections.map((section) => ({ id: section.id, label: section.label }));
}

const boot = () => applyDraft();
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
