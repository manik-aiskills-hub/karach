import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import Toolbar from "@/components/Toolbar";
import { PreferencesProvider } from "@/components/PreferencesProvider";

export const metadata: Metadata = {
  title: "Kharch — Finance App",
  description: "Track accounts, budgets, transactions, loans, and split expenses.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-body">
        <PreferencesProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 px-8 py-10 md:px-12">
              <Toolbar />
              {children}
            </main>
          </div>
        </PreferencesProvider>
      </body>
    </html>
  );
}
