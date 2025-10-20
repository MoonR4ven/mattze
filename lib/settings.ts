import { db } from "./firebase"
import { doc, getDoc, setDoc } from "firebase/firestore"

export interface StoreSettings {
  storeName: string
  storeEmail: string
  storePhone: string
  storeAddress: string
  currency: string
  taxRate: string
  emailNotifications: boolean
  orderNotifications: boolean
  lowStockAlerts: boolean
  customerReviews: boolean
  autoConfirmBookings: boolean
}

const SETTINGS_DOC_ID = "store-settings"

export const getSettings = async (): Promise<StoreSettings> => {
  try {
    const docRef = doc(db, "settings", SETTINGS_DOC_ID)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return docSnap.data() as StoreSettings
    }

    const defaultSettings: StoreSettings = {
      storeName: "Party Rental",
      storeEmail: "info@partyrental.com",
      storePhone: "+43 123 456 789",
      storeAddress: "Vienna, Austria",
      currency: "EUR",
      taxRate: "21",
      emailNotifications: true,
      orderNotifications: true,
      lowStockAlerts: true,
      customerReviews: false,
      autoConfirmBookings: false,
    }

    return defaultSettings
  } catch (error) {
    console.error("Error fetching settings:", error)
    throw error
  }
}

export const updateSettings = async (settings: StoreSettings): Promise<boolean> => {
  try {
    const docRef = doc(db, "settings", SETTINGS_DOC_ID)
    await setDoc(docRef, settings)
    return true
  } catch (error) {
    console.error("Error updating settings:", error)
    return false
  }
}
