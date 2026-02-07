import { db } from "./firebase"
import { doc, getDoc, setDoc } from "firebase/firestore"

export interface AppSettings {
  vatRate: number // VAT rate as percentage (e.g., 21 for 21%)
  currency: string
  deliveryOriginAddress: string
  deliveryBaseRadiusKm: number
  deliveryBaseFee: number
  deliveryPerKmFee: number
  assemblyFee: number
  pickupLocations: Array<{
    id: string
    name: string
    address: string
  }>
  pickupSelectionLimit: number
  updatedAt: string
}

const SETTINGS_DOC_ID = "app-settings"

const defaultSettings: AppSettings = {
  vatRate: 21,
  currency: "EUR",
  deliveryOriginAddress: "",
  deliveryBaseRadiusKm: 10,
  deliveryBaseFee: 20,
  deliveryPerKmFee: 1,
  assemblyFee: 0,
  pickupLocations: [],
  pickupSelectionLimit: 2,
  updatedAt: new Date().toISOString(),
}

export async function getSettings(): Promise<AppSettings> {
  try {
    const settingsDoc = await getDoc(doc(db, "settings", SETTINGS_DOC_ID))
    
    if (settingsDoc.exists()) {
      return settingsDoc.data() as AppSettings
    }
    
    // If no settings exist, create default settings
    await setDoc(doc(db, "settings", SETTINGS_DOC_ID), defaultSettings)
    return defaultSettings
  } catch (error) {
    console.error("Error fetching settings:", error)
    return defaultSettings
  }
}

export async function updateSettings(settings: Partial<AppSettings>): Promise<boolean> {
  try {
    const currentSettings = await getSettings()
    const updatedSettings = {
      ...currentSettings,
      ...settings,
      updatedAt: new Date().toISOString(),
    }
    
    await setDoc(doc(db, "settings", SETTINGS_DOC_ID), updatedSettings)
    return true
  } catch (error) {
    console.error("Error updating settings:", error)
    return false
  }
}
