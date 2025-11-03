import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { SidebarNav } from "@/components/organisms/SidebarNav";
import { Providers } from "./providers";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], weight: ["400", "500", "700"] });

export const metadata: Metadata = {
  title: "FIAP Next Challenge | Code Evaluator",
  description: "Live code quality ranking for the FIAP Next Challenge",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.className} antialiased`}>
        <Providers>
          <div className="flex min-h-screen flex-col bg-night text-neonPink md:flex-row">
            <div className="md:w-72 md:flex-none md:border-r md:border-neonBlue/20 md:bg-night/95">
              <SidebarNav />
            </div>
            <div className="flex-1 overflow-y-auto">{children}</div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
