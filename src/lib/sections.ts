// The sections of the feed. The daily digest must use one of these ids for every item.
// `hue` is used for the section's colour in light and dark themes.
export type SectionId =
  | "claude"
  | "skills"
  | "mcp"
  | "repos"
  | "models"
  | "laravel"
  | "video"
  | "design";

export type Section = {
  id: SectionId;
  name: string;
  hint: string;
  hue: number;
};

export const SECTIONS: Section[] = [
  { id: "claude", name: "Claude و Anthropic", hint: "تحديثات Claude Code والـ API والموديلات", hue: 28 },
  { id: "skills", name: "Skills و Plugins", hint: "skills وplugins وagents جاهزة", hue: 262 },
  { id: "mcp", name: "MCP Servers", hint: "سيرفرات وconnectors جديدة", hue: 190 },
  { id: "repos", name: "ريبوز وأدوات", hint: "أدوات المطورين اللي عليها كلام", hue: 145 },
  { id: "models", name: "موديلات وأخبار", hint: "موديلات جديدة وأخبار الشركات الكبيرة", hue: 220 },
  { id: "laravel", name: "Laravel × AI", hint: "أدوات وباكدجات AI لعالم Laravel وPHP", hue: 0 },
  { id: "video", name: "مونتاج وفيديو", hint: "توليد وتعديل الفيديو والصوت بالـ AI", hue: 320 },
  { id: "design", name: "صور وتصميم", hint: "توليد الصور والتصميم والـ UI بالـ AI", hue: 48 },
];

export const SECTION_BY_ID = Object.fromEntries(SECTIONS.map((s) => [s.id, s])) as Record<
  SectionId,
  Section
>;

export const SECTION_IDS = SECTIONS.map((s) => s.id);
