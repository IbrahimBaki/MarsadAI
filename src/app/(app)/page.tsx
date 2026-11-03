import { Suspense } from "react";
import { FeedPage } from "@/components/pages/FeedPage";

// In focus mode next.config.ts redirects "/" to the research hub; ?v=fav / ?v=seen still land here.
export default function Home() {
  return (
    <Suspense>
      <FeedPage />
    </Suspense>
  );
}
