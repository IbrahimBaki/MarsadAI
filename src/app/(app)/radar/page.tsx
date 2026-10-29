import type { Metadata } from "next";
import { Suspense } from "react";
import { APP } from "@/lib/config";
import { RadarPage } from "@/components/pages/RadarPage";

export const metadata: Metadata = { title: `الرادار | ${APP.name}` };

export default function Radar() {
  return (
    <Suspense>
      <RadarPage />
    </Suspense>
  );
}
