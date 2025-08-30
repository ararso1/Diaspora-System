"use client";

import { SidebarProvider } from "@/components/Layouts/sidebar/sidebar-context";
import { ThemeProvider } from "next-themes";
import I18nProvider from "@/components/I18nProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="light" attribute="class">
      <I18nProvider>
        <SidebarProvider>{children}</SidebarProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
