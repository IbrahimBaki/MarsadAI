import type { Metadata } from "next";
import { pageTitle } from "@/lib/locale-server";
import { LoginView } from "./LoginForm";

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle((t) => t.login.title) };
}

export default function LoginPage() {
  return <LoginView />;
}
