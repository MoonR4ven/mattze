import { NextResponse } from "next/server"
import Stripe from "stripe"
import { finalizeSuccessfulPayment } from "@/app/api/confirm-payment/route"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy_key_for_build", {
  apiVersion: "2024-06-20",
})

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error("Missing STRIPE_WEBHOOK_SECRET")
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
  }

  const signature = request.headers.get("stripe-signature")
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
  }

  try {
    const payload = await request.text()
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      const result = await finalizeSuccessfulPayment(paymentIntent.id)

      if (!result.success) {
        console.error("Stripe webhook finalization failed:", {
          paymentIntentId: paymentIntent.id,
          error: result.error,
        })
        return NextResponse.json({ error: "Failed to finalize payment" }, { status: 500 })
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Error handling Stripe webhook:", error)
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 })
  }
}
