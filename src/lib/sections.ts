import config from "../../config/sections.json";
import type { Locale } from "./i18n";

export type SectionId =
  | "claude"
  | "agents"
  | "skills"
  | "mcp"
  | "llm"
  | "backend"
  | "laravel"
  | "frontend"
  | "data"
  | "architecture"
  | "testing"
  | "devops"
  | "security"
  | "automation"
  | "devtools"
  | "video"
  | "design";

type L10n = { en: string; ar: string };

export type Section = {
  id: SectionId;
  group: string;
  name: string;
  /** Name without the "& …" / "و …" tail, for tight spots like card headers. */
  short: string;
  hint: string;
  color: string;
};

export type Group = { id: string; name: string; sections: Section[] };

/** Language-independent facts about a section (id, group, colour). */
export const SECTION_META = Object.fromEntries(
  config.sections.map((s) => [s.id, { id: s.id as SectionId, group: s.group, color: s.color }]),
) as Record<SectionId, { id: SectionId; group: string; color: string }>;

export type Taxonomy = {
  SECTIONS: Section[];
  SECTION_BY_ID: Record<SectionId, Section>;
  GROUPS: Group[];
  KIND_LABEL: Record<string, string>;
  PRICING_LABEL: Record<string, string>;
};

function build(locale: Locale): Taxonomy {
  const SECTIONS: Section[] = config.sections.map((s) => {
    const name = (s.name as L10n)[locale];
    return {
      id: s.id as SectionId,
      group: s.group,
      name,
      short: name.split(locale === "ar" ? " و " : " & ")[0],
      hint: (s.hint as L10n)[locale],
      color: s.color,
    };
  });
  const pick = (o: Record<string, L10n>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v[locale]]));
  return {
    SECTIONS,
    SECTION_BY_ID: Object.fromEntries(SECTIONS.map((s) => [s.id, s])) as Record<SectionId, Section>,
    GROUPS: config.groups.map((g) => ({
      id: g.id,
      name: (g.name as L10n)[locale],
      sections: SECTIONS.filter((s) => s.group === g.id),
    })),
    KIND_LABEL: pick(config.kinds as Record<string, L10n>),
    PRICING_LABEL: pick(config.pricing as Record<string, L10n>),
  };
}

const TAXONOMY: Record<Locale, Taxonomy> = { en: build("en"), ar: build("ar") };

export const taxonomy = (locale: Locale) => TAXONOMY[locale];
