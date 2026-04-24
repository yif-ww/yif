import { Suspense } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { MembershipApplyForm } from "./_form";

export default async function MembershipApplyPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const isLoggedIn = Boolean(session);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[var(--yif-cream)] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--yif-navy)] border-t-transparent animate-spin" />
        </div>
      }
    >
      <MembershipApplyForm isLoggedIn={isLoggedIn} />
    </Suspense>
  );
}
