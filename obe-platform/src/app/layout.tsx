import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { SidebarProvider } from "@/components/providers/SidebarProvider";
import { StoreProvider } from "@/lib/store";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "OBE Platform - AI-Powered Outcome Based Education",
  description:
    "Modern AI-powered dashboard for Outcome-Based Education. Create curriculum with Course Outcomes (CO), Program Outcomes (PO), and Bloom's Taxonomy integration.",
  keywords: [
    "OBE",
    "Outcome Based Education",
    "Course Outcomes",
    "Program Outcomes",
    "Bloom's Taxonomy",
    "Curriculum Design",
    "AI Education",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          <StoreProvider>
            <SidebarProvider>
              <TooltipProvider delay={200}>
                {children}
              </TooltipProvider>
            </SidebarProvider>
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
