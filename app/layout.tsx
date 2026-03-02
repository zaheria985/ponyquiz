import type { Metadata } from "next";
import Providers from "@/components/Providers";
import { ThemeProvider } from "@/components/ThemeProvider";
import Sidebar from "@/components/Sidebar";
import BottomTabs from "@/components/BottomTabs";
import "./globals.css";

export const metadata: Metadata = {
  title: "PonyQuiz",
  description: "An educational quiz app for young horse riders",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <ThemeProvider>
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 min-w-0 px-4 py-6 md:px-8 md:py-8 pb-20 md:pb-8">
                {children}
              </main>
            </div>
            <BottomTabs />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
