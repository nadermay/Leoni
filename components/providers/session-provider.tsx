"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <div suppressHydrationWarning>{children}</div>
    </NextAuthSessionProvider>
  );
}
