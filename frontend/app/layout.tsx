import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tripboard | Collaborative Travel Planner",
  description: "A bilingual collaborative itinerary board for AI place suggestions and drag-and-drop scheduling.",
  applicationName: "Tripboard",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tripboard"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
