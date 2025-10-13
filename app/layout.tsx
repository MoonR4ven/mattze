"use client"

import type React from "react"
import { Inter } from "next/font/google"
import { Suspense } from "react"
import { Header } from "@/components/header"
import { CartSidebar } from "@/components/cart-sidebar"
import { FloatingCartButton } from "@/components/floating-cart-button"
import { AuthProvider } from "@/contexts/auth-context"
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
      <body className={`font-sans ${inter.variable}`}>
        <AuthProvider>
          <Header />
          <Suspense fallback={null}>{children}</Suspense>
          <CartSidebar />
          <FloatingCartButton />
        </AuthProvider>
      </body>
    </html>
  )
}
