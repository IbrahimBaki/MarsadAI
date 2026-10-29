import { Suspense } from "react";
import { DetailPage } from "@/components/pages/DetailPage";

export default function Item() {
  return (
    <Suspense>
      <DetailPage />
    </Suspense>
  );
}
