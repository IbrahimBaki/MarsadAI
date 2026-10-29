import type { Metadata } from "next";
import { Suspense } from "react";
import { pageTitle } from "@/lib/locale-server";
import { RadarPage } from "@/components/pages/RadarPage";

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle((t) => t.radar.title) };
}

export default function Radar() {
  return (
    <Suspense>
      <RadarPage />
    </Suspense>
  );
}
