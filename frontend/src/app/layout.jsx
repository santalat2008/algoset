import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "AlgoSet - Algoritmlar va Dasturlash Platformasi",
  description: "Interaktiv darslar, amaliy masalalar va real dasturlash musobaqalari platformasi.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="uz">
      <body className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 antialiased flex flex-col transition-colors">
        <Navbar />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
