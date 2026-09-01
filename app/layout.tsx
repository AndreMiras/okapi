import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "mykids | Family hub",
  description: "A calmer way to stay close to your child's school day.",
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
