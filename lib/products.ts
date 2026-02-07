import type { Product } from './types'
import { db } from './firebase'
import {
  collection,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore'

const productsCollection = collection(db, 'products')

export async function getProducts(): Promise<Product[]> {
  try {
    console.log('🔥 Fetching products from API...')
    const response = await fetch('/api/products')
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }
    
    const result = await response.json()
    
    if (result.success) {
      console.log('✅ Products loaded:', result.data)
      return result.data as Product[]
    } else {
      throw new Error(result.error || 'Unknown error')
    }
  } catch (error) {
    console.error('❌ Error fetching products from API:', error)
    return []
  }
}

export async function getProduct(id: string): Promise<Product | null> {
  try {
    const docRef = doc(db, 'products', id)
    const snap = await getDoc(docRef)
    if (!snap.exists()) return null
    const data = snap.data() as any
    return { id: data.id ?? snap.id, ...data } as Product
  } catch (error) {
    console.error('Error fetching product from Firestore:', error)
    return null
  }
}

export async function addProduct(product: Omit<Product, 'id'>): Promise<string | null> {
  try {
    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    })

    const result = await response.json()
    if (response.ok && result.success) {
      return result.id as string
    }
    throw new Error(result.error || "Failed to create product")
  } catch (error) {
    console.error('Error adding product to Firestore:', error)
    return null
  }
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<boolean> {
  try {
    const response = await fetch("/api/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, updates }),
    })
    const result = await response.json()
    return response.ok && result.success
  } catch (error) {
    console.error('Error updating product in Firestore:', error)
    return false
  }
}

export async function deleteProduct(id: string): Promise<boolean> {
  try {
    const response = await fetch("/api/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    const result = await response.json()
    return response.ok && result.success
  } catch (error) {
    console.error('Error deleting product from Firestore:', error)
    return false
  }
}
