import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Crimson_Pro, Marcellus_SC } from "next/font/google";
import { Encabezado } from "@/components/encabezado";
import { Pie } from "@/components/pie";
import { PERMITIR_INDEXACION, SITIO } from "@/lib/config";
import "./globals.css";

const marcellus = Marcellus_SC({ variable: "--font-marcellus", weight: "400", subsets: ["latin"] });
const crimson = Crimson_Pro({ variable: "--font-crimson", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITIO),
  robots: PERMITIR_INDEXACION ? { index: true, follow: true } : { index: false, follow: false },
  openGraph: { type: "website", locale: "es_MX", siteName: "Directorio de proveedores NEC" },
  title: {
    default: "Directorio de proveedores NEC · Texmelucan",
    template: "%s · Directorio NEC",
  },
  description:
    "Proveedores de ropa y calzado al mayoreo de San Martín Texmelucan con los que NEC ya trabaja. Lugares limitados por categoría.",
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
