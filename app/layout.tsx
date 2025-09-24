import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Suspense } from "react"
import { Header } from "@/components/header"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "RentEasy - Premium Event Rentals",
  description: "Book premium event equipment and party supplies with easy scheduling",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`font-sans ${inter.variable}`}>
        <Header />
        <Suspense fallback={null}>{children}</Suspense>
      </body>
    </html>
  )
}
