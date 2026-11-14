import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Crimson_Pro, Marcellus_SC } from "next/font/google";
import { Encabezado } from "@/components/encabezado";
import { Pie } from "@/components/pie";
import "./globals.css";

const marcellus = Marcellus_SC({ variable: "--font-marcellus", weight: "400", subsets: ["latin"] });
const crimson = Crimson_Pro({ variable: "--font-crimson", subsets: ["latin"] });

// Dirección pública del sitio, para que los enlaces compartidos (WhatsApp, Facebook) muestren la vista previa.
const SITIO =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(SITIO),
  openGraph: { type: "website", locale: "es_MX", siteName: "Directorio de proveedores NEC" },
  title: {
    default: "Directorio de proveedores NEC · Texmelucan",
    template: "%s · Directorio NEC",
  },
  description:
    "Proveedores de ropa al mayoreo de San Martín Texmelucan con los que NEC ya trabaja. Temporada oficial de evaluación: febrero 2027.",
  appleWebApp: { title: "Directorio NEC", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = { themeColor: "#020528" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-MX" className={`${marcellus.variable} ${crimson.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col text-[17px] leading-relaxed">
        <Encabezado />
        <main className="flex-1">{children}</main>
        <Pie />
        <Analytics />
      </body>
    </html>
  );
}
