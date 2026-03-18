import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Portal RRHH | AVA Selección",
    template: "%s | AVA Selección RRHH",
  },
  description:
    "Portal interno de Recursos Humanos de AVA Selección — Consultor de Producto Gastronómico",
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
  },
  // No indexar por motores de búsqueda (datos personales internos)
  other: {
    "X-Robots-Tag": "noindex, nofollow",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="robots" content="noindex, nofollow, noarchive" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
