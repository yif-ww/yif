import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your YIF member portal.",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <h1 className="font-display text-4xl font-semibold text-white">
          Member Login
        </h1>
        <p className="mt-3 text-white/60">Coming soon — Phase 11.</p>
      </div>
    </div>
  );
}
