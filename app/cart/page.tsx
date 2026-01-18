"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Cart() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to home page
    router.push("/")
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <Card className="p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Redirecting...</h1>
          <p className="text-muted-foreground mb-6">
            Your shopping cart is now accessible via the cart icon in the header.
          </p>
          <Button asChild>
            <Link href="/">Go to Home</Link>
          </Button>
        </Card>
      </div>
    </div>
  )
}
