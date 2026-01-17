"use client"

import { useState } from "react"
import { uploadToImgBB } from "@/lib/imgbb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, Loader2, X } from "lucide-react"

interface ImageUploadProps {
  onImageUploaded: (url: string) => void
  currentImage?: string
}

export function ImageUpload({ onImageUploaded, currentImage }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file")
      return
    }

    // Validate file size (max 32MB for imgBB)
    if (file.size > 32 * 1024 * 1024) {
      setError("Image must be less than 32MB")
      return
    }

    setError(null)
    setIsUploading(true)

    try {
      // Show preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Upload to imgBB
      const imageUrl = await uploadToImgBB(file)
      if (imageUrl) {
        onImageUploaded(imageUrl)
        setPreview(imageUrl)
      } else {
        setError("Failed to upload image")
      }
    } catch (err) {
      console.error("Upload error:", err)
      setError("Error uploading image")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Input
          type="file"
          accept="image/*"
          disabled={isUploading}
          onChange={handleFileChange}
          className="flex-1"
        />
        {isUploading && <Loader2 className="h-5 w-5 animate-spin" />}
      </div>

      {preview && (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Preview"
            className="h-32 w-32 object-cover rounded-md border border-input"
          />
          <button
            onClick={() => {
              setPreview(null)
              setError(null)
            }}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
