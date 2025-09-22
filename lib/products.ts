import { collection, doc, getDoc, addDoc, updateDoc, deleteDoc } from "firebase/firestore"
import { db } from "./firebase"
import type { Product } from "./types"

const sampleProducts: Product[] = [
  {
    id: "1",
    name: "Professional DJ Setup",
    description: "Complete DJ equipment with speakers, mixer, and microphones for your event",
    type: "Audio Equipment",
    price: 150,
    image: "/placeholder.svg?height=300&width=400&text=DJ+Setup",
    available: true,
  },
  {
    id: "2",
    name: "Wedding Arch Decoration",
    description: "Beautiful floral arch perfect for wedding ceremonies and photo backdrops",
    type: "Decoration",
    price: 200,
    image: "/placeholder.svg?height=300&width=400&text=Wedding+Arch",
    available: true,
  },
  {
    id: "3",
    name: "Round Tables (10 seats)",
    description: "Elegant round tables that seat up to 10 guests, perfect for formal events",
    type: "Furniture",
    price: 25,
    image: "/placeholder.svg?height=300&width=400&text=Round+Table",
    available: true,
  },
  {
    id: "4",
    name: "LED Dance Floor",
    description: "Interactive LED dance floor that responds to music and creates amazing light shows",
    type: "Entertainment",
    price: 300,
    image: "/placeholder.svg?height=300&width=400&text=LED+Dance+Floor",
    available: true,
  },
  {
    id: "5",
    name: "Photo Booth Props",
    description: "Fun collection of props and backdrop for memorable photo opportunities",
    type: "Entertainment",
    price: 75,
    image: "/placeholder.svg?height=300&width=400&text=Photo+Booth",
    available: true,
  },
  {
    id: "6",
    name: "Outdoor Tent (20x30)",
    description: "Large weather-resistant tent perfect for outdoor events and celebrations",
    type: "Shelter",
    price: 400,
    image: "/placeholder.svg?height=300&width=400&text=Event+Tent",
    available: false,
  },
]

export async function getProducts(): Promise<Product[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(sampleProducts), 100) // Simulate async behavior
  })
}

export async function getProduct(id: string): Promise<Product | null> {
  try {
    const docRef = doc(db, "products", id)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Product
    }
    return null
  } catch (error) {
    console.error("Error fetching product:", error)
    return null
  }
}

export async function addProduct(product: Omit<Product, "id">): Promise<string | null> {
  try {
    const docRef = await addDoc(collection(db, "products"), product)
    return docRef.id
  } catch (error) {
    console.error("Error adding product:", error)
    return null
  }
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<boolean> {
  try {
    const docRef = doc(db, "products", id)
    await updateDoc(docRef, updates)
    return true
  } catch (error) {
    console.error("Error updating product:", error)
    return false
  }
}

export async function deleteProduct(id: string): Promise<boolean> {
  try {
    await deleteDoc(doc(db, "products", id))
    return true
  } catch (error) {
    console.error("Error deleting product:", error)
    return false
  }
}
