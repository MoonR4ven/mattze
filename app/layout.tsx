"use client"

import type React from "react"
import { Inter } from "next/font/google"
import { Suspense } from "react"
import { Header } from "@/components/header"
import { CartSidebar } from "@/components/cart-sidebar"
import { AuthProvider } from "@/contexts/auth-context"
import { FilterProvider } from "@/contexts/filter-context"
import { I18nProvider } from "@/contexts/i18n-context"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <title>MaVi Rent - Premium Event Equipment Rental</title>
        <meta name="description" content="Professional event equipment rental services" />
      </head>
      <body className={`font-sans ${inter.variable} min-h-screen flex flex-col bg-[#d9d9d9]`}>
        <I18nProvider>
          <AuthProvider>
            <FilterProvider>
              <Header />
              <main className="flex-1 bg-[#d9d9d9]">
                <Suspense fallback={null}>{children}</Suspense>
              </main>
              <footer className="w-full bg-[#d9d9d9]">
                <div className="w-full border-t border-black" />
                <p className="py-4 text-center text-sm font-medium text-black">
                  MaVi Rent Shop 2026 - Developed by MoonRaven &copy;
                </p>
              </footer>
              <CartSidebar />
            </FilterProvider>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
