import type { Metadata } from "next";
import { Suspense } from "react";
import { APP } from "@/lib/config";
import { LibraryPage } from "@/components/pages/LibraryPage";

export const metadata: Metadata = { title: `الأساسيات | ${APP.name}` };

export default function Library() {
  return (
    <Suspense>
      <LibraryPage />
    </Suspense>
  );
}
