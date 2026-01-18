import { db } from "./firebase"
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from "firebase/firestore"

export interface Category {
  id: string
  name: string
  color?: string
  createdAt: string
}

const CATEGORIES_COLLECTION = "categories"
const PRODUCTS_COLLECTION = "products"

export async function getCategories(): Promise<Category[]> {
  try {
    const querySnapshot = await getDocs(collection(db, CATEGORIES_COLLECTION))
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Category))
  } catch (error) {
    console.error("Error fetching categories:", error)
    throw error
  }
}

export async function addCategory(category: Omit<Category, "id">): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), {
      ...category,
      createdAt: new Date().toISOString(),
    })
    return docRef.id
  } catch (error) {
    console.error("Error adding category:", error)
    throw error
  }
}

export async function updateCategory(id: string, category: Partial<Category>): Promise<void> {
  try {
    const categoryRef = doc(db, CATEGORIES_COLLECTION, id)
    await updateDoc(categoryRef, category)
  } catch (error) {
    console.error("Error updating category:", error)
    throw error
  }
}

export async function deleteCategory(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, CATEGORIES_COLLECTION, id))
  } catch (error) {
    console.error("Error deleting category:", error)
    throw error
  }
}

export async function getCategoryProductCount(categoryName: string): Promise<number> {
  try {
    const q = query(collection(db, PRODUCTS_COLLECTION), where("type", "==", categoryName))
    const querySnapshot = await getDocs(q)
    return querySnapshot.size
  } catch (error) {
    console.error("Error getting category product count:", error)
    return 0
  }
}
