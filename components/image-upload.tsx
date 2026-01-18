"use client"

import { useState } from "react"
import { uploadToImgBB } from "@/lib/imgbb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, Loader2, X } from "lucide-react"

interface ImageUploadProps {
  onImagesUploaded: (urls: string[]) => void
  currentImages?: string[]
}

export function ImageUpload({ onImagesUploaded, currentImages = [] }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previews, setPreviews] = useState<string[]>(currentImages)
  const [error, setError] = useState<string | null>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    setError(null)
    setIsUploading(true)

    try {
      const uploadedUrls: string[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Validate file type
        if (!file.type.startsWith("image/")) {
          setError(`File ${file.name} is not an image`)
          continue
        }

        // Validate file size (max 32MB for imgBB)
        if (file.size > 32 * 1024 * 1024) {
          setError(`Image ${file.name} must be less than 32MB`)
          continue
        }

        // Upload to imgBB
        const imageUrl = await uploadToImgBB(file)
        if (imageUrl) {
          uploadedUrls.push(imageUrl)
        } else {
          setError(`Failed to upload ${file.name}`)
        }
      }

      const newPreviews = [...previews, ...uploadedUrls]
      setPreviews(newPreviews)
      onImagesUploaded(newPreviews)
    } catch (err) {
      console.error("Upload error:", err)
      setError("Error uploading images")
    } finally {
      setIsUploading(false)
    }
  }

  const removeImage = (index: number) => {
    const newPreviews = previews.filter((_, i) => i !== index)
    setPreviews(newPreviews)
    onImagesUploaded(newPreviews)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Input
          type="file"
          accept="image/*"
          multiple
          disabled={isUploading}
          onChange={handleFileChange}
          className="flex-1"
        />
        {isUploading && <Loader2 className="h-5 w-5 animate-spin" />}
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {previews.map((preview, index) => (
            <div key={index} className="relative group">
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="h-20 w-20 object-cover rounded-md border border-input"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
