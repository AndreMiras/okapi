import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Okapi | Open MyKids client",
  description: "An unofficial, open-source web client for Kids&Us MyKids.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
