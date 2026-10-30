import type { Metadata } from "next";
import { signupEnabled } from "@/lib/auth";
import { pageTitle } from "@/lib/locale-server";
import { AuthView } from "./LoginForm";

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle((t) => t.login.title) };
}

export default function LoginPage() {
  return <AuthView mode="login" signup={signupEnabled()} />;
}
