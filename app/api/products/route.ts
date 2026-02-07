import { type NextRequest, NextResponse } from "next/server"
import * as admin from "firebase-admin"

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    privateKey: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  })
}

const db = admin.firestore()

export async function GET(request: NextRequest) {
  try {
    const snapshot = await db.collection("products").get()
    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))

    console.log(`✅ Fetched ${products.length} products from Firestore`)

    return NextResponse.json({
      success: true,
      data: products,
    })
  } catch (error) {
    console.error("❌ Error fetching products:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const now = new Date().toISOString()
    const docRef = await db.collection("products").add({
      ...body,
      created_at: now,
      updated_at: now,
    })

    return NextResponse.json({ success: true, id: docRef.id })
  } catch (error) {
    console.error("❌ Error creating product:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, updates } = body
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing product id" }, { status: 400 })
    }

    await db.collection("products").doc(id).update({
      ...updates,
      updated_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Error updating product:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing product id" }, { status: 400 })
    }

    await db.collection("products").doc(id).delete()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("❌ Error deleting product:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
