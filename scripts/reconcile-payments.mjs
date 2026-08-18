import dotenv from "dotenv"
import Stripe from "stripe"
import { cert, getApps, initializeApp } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"

dotenv.config({ path: ".env.local" })
dotenv.config({ path: ".env" })

const positionalArgs = process.argv.slice(2).filter((arg) => !arg.startsWith("--"))

function getArgValue(flag, fallback = undefined) {
  const index = process.argv.indexOf(flag)
  if (index === -1 || index === process.argv.length - 1) {
    return fallback
  }

  return process.argv[index + 1]
}

function hasFlag(flag) {
  return process.argv.includes(flag)
}

function requireEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function initializeFirebaseAdmin() {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId: requireEnv("FIREBASE_PROJECT_ID"),
        clientEmail: requireEnv("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
        privateKey: requireEnv("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY").replace(/\\n/g, "\n"),
      }),
    })
  }

  return getFirestore()
}

function getStripeClient() {
  return new Stripe(requireEnv("STRIPE_SECRET_KEY"), {
    apiVersion: "2024-06-20",
  })
}

function normalizeBaseUrl(input) {
  return (input || "http://localhost:3000").replace(/\/$/, "")
}

async function fetchCandidateIntents(stripe, explicitPaymentIntentId, limit) {
  if (explicitPaymentIntentId) {
    return [await stripe.paymentIntents.retrieve(explicitPaymentIntentId)]
  }

  const result = await stripe.paymentIntents.list({ limit })
  return result.data.filter((paymentIntent) => paymentIntent.status === "succeeded")
}

async function inspectCandidate(db, paymentIntent) {
  const tempOrderId = paymentIntent.metadata?.tempOrderId || null
  const orderDoc = await db.collection("orders").doc(paymentIntent.id).get()
  const tempOrderDoc = tempOrderId ? await db.collection("temp_orders").doc(tempOrderId).get() : null

  return {
    paymentIntentId: paymentIntent.id,
    status: paymentIntent.status,
    createdAt: new Date(paymentIntent.created * 1000).toISOString(),
    amount: paymentIntent.amount / 100,
    currency: paymentIntent.currency,
    paymentMethodType: paymentIntent.payment_method_types?.[0] || null,
    customerEmail: paymentIntent.metadata?.customerEmail || paymentIntent.receipt_email || null,
    tempOrderId,
    orderExists: orderDoc.exists,
    tempOrderExists: Boolean(tempOrderDoc?.exists),
    itemCount: paymentIntent.metadata?.itemCount || null,
  }
}

async function replayFinalization(baseUrl, paymentIntentId) {
  const response = await fetch(`${baseUrl}/api/confirm-payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentIntentId }),
  })

  const text = await response.text()
  let parsedBody = null

  try {
    parsedBody = JSON.parse(text)
  } catch {
    parsedBody = text
  }

  return {
    ok: response.ok,
    status: response.status,
    body: parsedBody,
  }
}

async function main() {
  const stripe = getStripeClient()
  const db = initializeFirebaseAdmin()
  const paymentIntentId = getArgValue("--payment-intent", positionalArgs[0])
  const limit = Number.parseInt(getArgValue("--limit", "25"), 10)
  const dryRun = hasFlag("--dry-run")
  const baseUrl = normalizeBaseUrl(getArgValue("--base-url", "http://localhost:3000"))

  const paymentIntents = await fetchCandidateIntents(stripe, paymentIntentId, Number.isFinite(limit) ? limit : 25)
  const inspections = []

  for (const intent of paymentIntents) {
    const inspection = await inspectCandidate(db, intent)
    if (!inspection.orderExists && inspection.tempOrderId) {
      inspections.push(inspection)
    }
  }

  if (inspections.length === 0) {
    console.log(JSON.stringify({
      message: "No orphaned succeeded payment intents found.",
    }, null, 2))
    return
  }

  if (dryRun) {
    console.log(JSON.stringify({
      mode: "dry-run",
      candidates: inspections,
    }, null, 2))
    return
  }

  const results = []

  for (const inspection of inspections) {
    const replayResult = await replayFinalization(baseUrl, inspection.paymentIntentId)
    const orderDoc = await db.collection("orders").doc(inspection.paymentIntentId).get()
    const bookingSnapshot = await db.collection("bookings").where("orderId", "==", inspection.paymentIntentId).get()
    const tempOrderDoc = inspection.tempOrderId
      ? await db.collection("temp_orders").doc(inspection.tempOrderId).get()
      : null

    results.push({
      paymentIntentId: inspection.paymentIntentId,
      replayStatus: replayResult.status,
      replayOk: replayResult.ok,
      replayBody: replayResult.body,
      orderExistsAfterReplay: orderDoc.exists,
      bookingCountAfterReplay: bookingSnapshot.size,
      tempOrderExistsAfterReplay: Boolean(tempOrderDoc?.exists),
    })
  }

  console.log(JSON.stringify({
    mode: "replay",
    baseUrl,
    results,
  }, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : error)
  process.exit(1)
})