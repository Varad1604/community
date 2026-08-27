import type { Metadata } from "next";
import { Geist, Geist_Mono, Bebas_Neue, Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const bebas = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "RajniMemes — Thalaiva's Meme SaaS | En Vazhi Thani Vazhi",
  description: "The world's first Rajnikanth Meme SaaS. Generate, remix & deploy Superstar memes at scale. 10K+ templates, AI punch-dialogues, instant virality.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} ${bebas.variable} ${inter.variable} antialiased`}>
        {children}
        <Script src="https://cdn.jsdelivr.net/gh/IdeavoAI/ideavo-scripts@latest/scripts/ideavo.min.js" />
      </body>
    </html>
  );
}
