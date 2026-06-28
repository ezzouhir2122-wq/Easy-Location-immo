import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Easy Location IMMO",
  description: "Plateforme de gestion de locations immobilières",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
