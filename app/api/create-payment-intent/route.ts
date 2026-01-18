import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { db } from "@/lib/firebase"
import { addDoc, collection } from "firebase/firestore"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy_key_for_build", {
  apiVersion: "2024-06-20",
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, currency = "eur", customerInfo, items, locale = "en" } = body

    console.log("💰 Creating payment intent for amount:", amount, "cents (", amount / 100, "euros )")

    // Store order items in Firebase to avoid Stripe metadata size limits
    const tempOrderRef = await addDoc(collection(db, "temp_orders"), {
      items,
      customerInfo,
      amount,
      currency,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
    })

    // Create payment intent (amount is already in cents from frontend)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Already in cents, no need to multiply again
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        customerAddress: customerInfo.address || "",
        customerCity: customerInfo.city || "",
        customerPostalCode: customerInfo.postalCode || "",
        customerCountry: customerInfo.country || "NL",
        itemCount: items.length.toString(),
        tempOrderId: tempOrderRef.id, // Reference to Firebase temp order
        locale: locale,
      },
      receipt_email: customerInfo.email,
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    })
  } catch (error) {
    console.error("Error creating payment intent:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
