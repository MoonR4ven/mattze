import { NextRequest, NextResponse } from "next/server"

const ORS_BASE_URL = "https://api.openrouteservice.org"

async function geocode(apiKey: string, query: string) {
  const url = `${ORS_BASE_URL}/geocode/search?api_key=${apiKey}&text=${encodeURIComponent(query)}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Geocoding failed: ${response.status}`)
  }
  const data = await response.json()
  const feature = data.features?.[0]
  if (!feature?.geometry?.coordinates) {
    throw new Error("No geocoding results")
  }
  const [lon, lat] = feature.geometry.coordinates
  return { lon, lat }
}

async function getDistanceKm(apiKey: string, origin: { lon: number; lat: number }, destination: { lon: number; lat: number }) {
  const url = `${ORS_BASE_URL}/v2/directions/driving-car?api_key=${apiKey}&start=${origin.lon},${origin.lat}&end=${destination.lon},${destination.lat}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Directions failed: ${response.status}`)
  }
  const data = await response.json()
  const meters = data.features?.[0]?.properties?.segments?.[0]?.distance
  if (!Number.isFinite(meters)) {
    throw new Error("No distance returned")
  }
  return Math.round((meters / 1000) * 10) / 10
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENROUTESERVICE_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Missing OpenRouteService API key" }, { status: 500 })
    }

    const { origin, destination } = await request.json()
    if (!origin || !destination) {
      return NextResponse.json({ error: "Origin and destination are required" }, { status: 400 })
    }

    const originCoords = await geocode(apiKey, origin)
    const destinationCoords = await geocode(apiKey, destination)
    const distanceKm = await getDistanceKm(apiKey, originCoords, destinationCoords)

    return NextResponse.json({ distanceKm })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
