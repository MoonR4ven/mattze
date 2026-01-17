import { NextResponse } from "next/server"

export async function GET() {
  const apiKey = process.env.BILLBEE_API_KEY
  const username = process.env.BILLBEE_USERNAME
  const password = process.env.BILLBEE_PASSWORD

  console.log("🔑 Testing Billbee credentials...")
  console.log("API Key:", apiKey?.substring(0, 10) + "...")
  console.log("Username:", username)

  if (!apiKey || !username || !password) {
    return NextResponse.json({
      success: false,
      error: "Missing Billbee credentials in environment variables",
    })
  }

  try {
    const credentials = Buffer.from(`${username}:${password}`).toString("base64")
    
    console.log("📡 Testing Billbee API with different auth methods...")

    // Method 1: API Key only
    const headers1 = {
      "X-Billbee-Api-Key": apiKey,
      "Content-Type": "application/json",
    }

    console.log("🔑 Test 1: API Key only")
    const test1 = await fetch(
      "https://app.billbee.io/api/v1/products?page=1&pageSize=1",
      { method: "GET", headers: headers1 }
    )
    console.log("Status:", test1.status)

    // Method 2: Basic Auth + API Key
    const headers2 = {
      Authorization: `Basic ${credentials}`,
      "X-Billbee-Api-Key": apiKey,
      "Content-Type": "application/json",
    }

    console.log("🔑 Test 2: Basic Auth + API Key")
    const test2 = await fetch(
      "https://app.billbee.io/api/v1/products?page=1&pageSize=1",
      { method: "GET", headers: headers2 }
    )
    console.log("Status:", test2.status)

    // Method 3: API Key as username, empty password
    const credentials3 = Buffer.from(`${apiKey}:`).toString("base64")
    const headers3 = {
      Authorization: `Basic ${credentials3}`,
      "Content-Type": "application/json",
    }

    console.log("🔑 Test 3: API Key as Basic Auth username")
    const test3 = await fetch(
      "https://app.billbee.io/api/v1/products?page=1&pageSize=1",
      { method: "GET", headers: headers3 }
    )
    console.log("Status:", test3.status)

    // Check which method worked
    let workingMethod = null
    let productsData = null

    if (test1.ok) {
      workingMethod = "API Key only"
      productsData = await test1.json()
    } else if (test2.ok) {
      workingMethod = "Basic Auth + API Key"
      productsData = await test2.json()
    } else if (test3.ok) {
      workingMethod = "API Key as Basic Auth"
      productsData = await test3.json()
    }

    if (!workingMethod) {
      const error1 = await test1.text()
      const error2 = await test2.text()
      const error3 = await test3.text()
      
      return NextResponse.json({
        success: false,
        message: "All authentication methods failed",
        results: {
          method1_apiKeyOnly: { status: test1.status, error: error1.substring(0, 200) },
          method2_basicAndKey: { status: test2.status, error: error2.substring(0, 200) },
          method3_keyAsBasic: { status: test3.status, error: error3.substring(0, 200) },
        },
        suggestion: "Check: 1) API is enabled in Billbee settings, 2) Your plan includes API access, 3) API key is copied correctly without spaces",
      })
    }

    return NextResponse.json({
      success: true,
      message: `✅ Billbee API working with: ${workingMethod}`,
      workingAuthMethod: workingMethod,
      productsFound: productsData?.Data?.length || 0,
      sampleProduct: productsData?.Data?.[0]?.Title || "None",
    })
  } catch (error) {
    console.error("❌ Billbee test error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      message: "Failed to connect to Billbee API",
    })
  }
}
