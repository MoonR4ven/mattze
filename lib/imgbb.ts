const IMGBB_API_KEY = process.env.NEXT_PUBLIC_IMGBB_API_KEY || ""

export const uploadImageToImgBB = async (file: File): Promise<string> => {
  if (!IMGBB_API_KEY) {
    throw new Error("ImgBB API key is not configured")
  }

  try {
    const formData = new FormData()
    formData.append("image", file)

    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
      {
        method: "POST",
        body: formData,
      }
    )

    if (!response.ok) {
      throw new Error("Failed to upload image")
    }

    const data = await response.json()
    return data.data.url
  } catch (error) {
    console.error("Error uploading image:", error)
    throw error
  }
}

export const uploadBase64ToImgBB = async (base64Image: string): Promise<string> => {
  if (!IMGBB_API_KEY) {
    throw new Error("ImgBB API key is not configured")
  }

  try {
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "")

    const formData = new FormData()
    formData.append("image", base64Data)

    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`,
      {
        method: "POST",
        body: formData,
      }
    )

    if (!response.ok) {
      throw new Error("Failed to upload image")
    }

    const data = await response.json()
    return data.data.url
  } catch (error) {
    console.error("Error uploading image:", error)
    throw error
  }
}
