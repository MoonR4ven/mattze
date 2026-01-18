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
      <body className={`font-sans ${inter.variable} bg-[#d9d9d9]`}>
        <I18nProvider>
          <AuthProvider>
            <FilterProvider>
              <Header />
              <main className="flex-1 bg-[#d9d9d9]">
                <Suspense fallback={null}>{children}</Suspense>
              </main>
              <CartSidebar />
            </FilterProvider>
          </AuthProvider>
        </I18nProvider>
      </body>
    </html>
  )
}
