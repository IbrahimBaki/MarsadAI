import config from "../../config/sections.json";

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

export type Section = {
  id: SectionId;
  group: string;
  name: string;
  hint: string;
  color: string;
};

export type Group = { id: string; name: string; sections: Section[] };

export const SECTIONS: Section[] = config.sections.map((s) => ({
  id: s.id as SectionId,
  group: s.group,
  name: s.name,
  hint: s.hint,
  color: s.color,
}));

export const SECTION_BY_ID = Object.fromEntries(SECTIONS.map((s) => [s.id, s])) as Record<SectionId, Section>;

export const GROUPS: Group[] = config.groups.map((g) => ({
  ...g,
  sections: SECTIONS.filter((s) => s.group === g.id),
}));

export const KIND_LABEL = config.kinds as Record<string, string>;
export const PRICING_LABEL = config.pricing as Record<string, string>;
