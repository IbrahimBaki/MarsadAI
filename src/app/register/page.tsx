import type { Metadata } from "next";
import { signupEnabled } from "@/lib/auth";
import { pageTitle } from "@/lib/locale-server";
import { AuthView } from "../login/LoginForm";

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle((t) => t.register.title) };
}

export default function RegisterPage() {
  return <AuthView mode="register" signup={signupEnabled()} />;
}
