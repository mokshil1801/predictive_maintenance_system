import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export default async function ResetPasswordTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ResetPasswordForm tokenOverride={token} />
    </Suspense>
  );
}
