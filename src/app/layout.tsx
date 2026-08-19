import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "kumaUI",
  description: "Local-first chat UI for open-source LLMs served by Ollama",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="h-full overflow-hidden">{children}</body>
    </html>
  );
}
