import { Suspense } from "react";
import { FeedPage } from "@/components/pages/FeedPage";

export default function Home() {
  return (
    <Suspense>
      <FeedPage />
    </Suspense>
  );
}
