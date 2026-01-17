import type { Product } from './types'
import { db } from './firebase'
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
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
    const now = new Date().toISOString()
    const payload = { ...product, created_at: now, updated_at: now }
    const ref = await addDoc(productsCollection, payload as any)
    return ref.id
  } catch (error) {
    console.error('Error adding product to Firestore:', error)
    return null
  }
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<boolean> {
  try {
    const ref = doc(db, 'products', id)
    await updateDoc(ref, { ...updates, updated_at: new Date().toISOString() } as any)
    return true
  } catch (error) {
    console.error('Error updating product in Firestore:', error)
    return false
  }
}

export async function deleteProduct(id: string): Promise<boolean> {
  try {
    const ref = doc(db, 'products', id)
    await deleteDoc(ref)
    return true
  } catch (error) {
    console.error('Error deleting product from Firestore:', error)
    return false
  }
}
