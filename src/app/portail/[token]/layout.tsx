import { Cormorant_Garamond } from "next/font/google";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-portal-serif",
});

export default function PortailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${cormorant.variable} min-h-screen bg-[#FAFAF9] font-sans antialiased`}
    >
      {children}
    </div>
  );
}
