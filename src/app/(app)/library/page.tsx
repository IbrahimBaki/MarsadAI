import type { Metadata } from "next";
import { Suspense } from "react";
import { pageTitle } from "@/lib/locale-server";
import { LibraryPage } from "@/components/pages/LibraryPage";

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle((t) => t.library.title) };
}

export default function Library() {
  return (
    <Suspense>
      <LibraryPage />
    </Suspense>
  );
}
