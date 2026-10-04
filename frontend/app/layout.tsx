import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MDTranslate AI",
  description: "Smart Markdown translation to Arabic with preserved structure"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
