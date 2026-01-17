/**
 * imgBB integration for image uploads
 * Get your API key at: https://imgbb.com/api/upload
 */

const IMGBB_API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY

export async function uploadToImgBB(file: File): Promise<string | null> {
  if (!IMGBB_API_KEY) {
    console.error('❌ IMGBB_API_KEY not found in environment variables')
    return null
  }

  try {
    const formData = new FormData()
    formData.append('image', file)
    formData.append('key', IMGBB_API_KEY)

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`imgBB API error: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.success) {
      console.log('✅ Image uploaded to imgBB:', data.data.url)
      return data.data.url
    } else {
      console.error('❌ imgBB upload failed:', data.error)
      return null
    }
  } catch (error) {
    console.error('❌ Error uploading to imgBB:', error)
    return null
  }
}

export function getImgBBThumbnail(url: string): string {
  // imgBB provides a .th extension for thumbnails
  return url.replace(/\.([a-z]+)$/, '.th.$1')
}
