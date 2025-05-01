import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { TaskProvider } from "@/contexts/task-context";
import { registerServiceWorker } from "./service-worker";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PDCA Task Management",
  description: "A modern task management system using PDCA methodology",
};

// Register service worker
if (typeof window !== "undefined") {
  registerServiceWorker();
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <TaskProvider>{children}</TaskProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
