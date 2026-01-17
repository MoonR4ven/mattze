import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy_key_for_build", {
  apiVersion: "2024-06-20",
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, currency = "eur", customerInfo, items } = body

    console.log("💰 Creating payment intent for amount:", amount, "cents (", amount / 100, "euros )")

    // Create payment intent (amount is already in cents from frontend)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // Already in cents, no need to multiply again
      currency,
      metadata: {
        customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        customerAddress: customerInfo.address || "",
        customerCity: customerInfo.city || "",
        customerPostalCode: customerInfo.postalCode || "",
        customerCountry: customerInfo.country || "NL",
        itemCount: items.length.toString(),
        orderItems: JSON.stringify(
          items.map((item: any) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            numberOfDays: item.numberOfDays || 1,
            selectedDate: item.selectedDate,
            selectedTime: item.selectedTime,
          })),
        ),
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
