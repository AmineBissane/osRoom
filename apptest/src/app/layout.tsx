"use client"

import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Navbar } from "@/components/navbar"
import { Sidebar } from "@/components/sidebar"
import { Providers } from "@/components/providers"
import { usePathname } from "next/navigation"

const inter = Inter({ subsets: ["latin"] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isLoginPage = pathname === "/login"

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <ThemeProvider>
            <main className="min-h-screen">
              {!isLoginPage ? (
              <div className="flex min-h-screen">
                <aside className="w-64 bg-muted/50 hidden md:block">
                  <Sidebar />
                </aside>
                <div className="flex-1 flex flex-col">
                  <Navbar />
                  <div className="flex-1">
                    {children}
                  </div>
                </div>
              </div>
              ) : (
                children
              )}
            </main>
            <Toaster />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  )
}
