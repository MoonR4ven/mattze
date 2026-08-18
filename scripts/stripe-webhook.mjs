import dotenv from "dotenv"
import Stripe from "stripe"

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

function getStripeClient() {
  return new Stripe(requireEnv("STRIPE_SECRET_KEY"), {
    apiVersion: "2024-06-20",
  })
}

function normalizeBaseUrl(input) {
  return input.replace(/\/$/, "")
}

async function probeWebhookUrl(url) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: "{}",
    redirect: "manual",
  })

  const body = await response.text()

  return {
    status: response.status,
    location: response.headers.get("location"),
    body: body.slice(0, 400),
  }
}

async function listEndpoints(stripe) {
  const endpoints = await stripe.webhookEndpoints.list({ limit: 100 })
  return endpoints.data.map((endpoint) => ({
    id: endpoint.id,
    url: endpoint.url,
    status: endpoint.status,
    livemode: endpoint.livemode,
    enabledEvents: endpoint.enabled_events,
  }))
}

async function main() {
  const stripe = getStripeClient()
  const ensureBaseUrl = getArgValue("--ensure", positionalArgs[0])
  const shouldJson = hasFlag("--json")
  const endpoints = await listEndpoints(stripe)

  if (!ensureBaseUrl) {
    const output = { endpoints }
    console.log(shouldJson ? JSON.stringify(output, null, 2) : JSON.stringify(output, null, 2))
    return
  }

  const webhookUrl = `${normalizeBaseUrl(ensureBaseUrl)}/api/stripe/webhook`
  const probe = await probeWebhookUrl(webhookUrl)
  const matchingEndpoint = endpoints.find((endpoint) => endpoint.url === webhookUrl)

  if (matchingEndpoint) {
    console.log(JSON.stringify({
      message: "Webhook endpoint already exists.",
      endpoint: matchingEndpoint,
      probe,
    }, null, 2))
    return
  }

  const routeLooksValid = probe.status === 400 || probe.status === 405 || probe.status === 500
  if (!routeLooksValid) {
    console.error(JSON.stringify({
      message: "Refusing to create Stripe webhook because the target URL does not behave like the app webhook route.",
      webhookUrl,
      probe,
    }, null, 2))
    process.exit(1)
  }

  const endpoint = await stripe.webhookEndpoints.create({
    url: webhookUrl,
    enabled_events: ["payment_intent.succeeded"],
  })

  console.log(JSON.stringify({
    message: "Created Stripe webhook endpoint. Store the returned signing secret in deployment as STRIPE_WEBHOOK_SECRET before enabling production use.",
    endpoint: {
      id: endpoint.id,
      url: endpoint.url,
      status: endpoint.status,
      livemode: endpoint.livemode,
      enabledEvents: endpoint.enabled_events,
      secret: endpoint.secret,
    },
    probe,
  }, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})