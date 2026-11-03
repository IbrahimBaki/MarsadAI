// Focus mode: while the AI Champs research is the priority, the app opens on the
// research hub and the news sections are hidden from the menu (their routes still work).
// Set NEXT_PUBLIC_MARSAD_FOCUS=off on Vercel to bring the full app back.
export const FOCUS = process.env.NEXT_PUBLIC_MARSAD_FOCUS !== "off";
export const FOCUS_HOME = "/research";
