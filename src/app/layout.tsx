import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css"; // Make sure this line exists

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Last Apply",
  description: "Track your job applications with ease",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}