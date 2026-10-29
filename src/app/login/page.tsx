import type { Metadata } from "next";
import { APP } from "@/lib/config";
import { Mark } from "@/components/icons";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: `دخول | ${APP.name}` };

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Mark size={56} />
          <h1 className="mt-4 text-[32px] font-bold leading-10">{APP.name}</h1>
          <p className="mt-1 text-[15px] text-muted">{APP.tagline}</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
