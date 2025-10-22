"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { Upload, Trash2, Eye, X } from "lucide-react"
import { ConfirmDeleteModal } from "./confirm-delete-modal"

interface PatientImage {
  _id: string
  type: "xray" | "photo" | "scan"
  title: string
  description: string
  imageUrl: string
  uploadedBy: { name: string }
  uploadedAt: string
  notes: string
}

interface PatientImagesSectionProps {
  patientId: string
  token: string
  isDoctor: boolean
}

export function PatientImagesSection({ patientId, token, isDoctor }: PatientImagesSectionProps) {
  const [images, setImages] = useState<PatientImage[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [selectedImage, setSelectedImage] = useState<PatientImage | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [imageToDelete, setImageToDelete] = useState<PatientImage | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formData, setFormData] = useState({
    type: "xray" as "xray" | "photo" | "scan",
    title: "",
    description: "",
    imageUrl: "",
    notes: "",
  })

  useEffect(() => {
    fetchImages()
  }, [patientId])

  const fetchImages = async () => {
    try {
      const res = await fetch(`/api/patient-images?patientId=${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setImages(data.images || [])
      }
    } catch (error) {
      console.error("Error fetching images:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.imageUrl) {
      toast.error("Please provide an image URL")
      return
    }

    setUploading(true)
    try {
      const res = await fetch("/api/patient-images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientId,
          ...formData,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setImages([data.image, ...images])
        toast.success("Image uploaded successfully")
        setShowUploadForm(false)
        setFormData({
          type: "xray",
          title: "",
          description: "",
          imageUrl: "",
          notes: "",
        })
      } else {
        const error = await res.json()
        toast.error(error.error || "Failed to upload image")
      }
    } catch (error) {
      toast.error("Error uploading image")
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteImage = async () => {
    if (!imageToDelete) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/patient-images/${imageToDelete._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        setImages(images.filter((img) => img._id !== imageToDelete._id))
        toast.success("Image deleted successfully")
        setShowDeleteModal(false)
        setImageToDelete(null)
      } else {
        const error = await res.json()
        toast.error(error.error || "Failed to delete image")
      }
    } catch (error) {
      toast.error("Error deleting image")
    } finally {
      setIsDeleting(false)
    }
  }

  const getImageTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      xray: "X-Ray",
      photo: "Photo",
      scan: "Scan",
    }
    return labels[type] || type
  }

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading images...</div>
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      {isDoctor && (
        <div>
          <button
            onClick={() => setShowUploadForm(!showUploadForm)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors text-sm font-medium cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            {showUploadForm ? "Cancel" : "Upload Image"}
          </button>

          {showUploadForm && (
            <div className="mt-4 bg-card border border-border rounded-lg p-4 space-y-4 shadow-md">
              <h3 className="font-semibold text-foreground">Upload X-Ray or Image</h3>
              <form onSubmit={handleImageUpload} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">Type *</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm cursor-pointer"
                    >
                      <option value="xray">X-Ray</option>
                      <option value="photo">Photo</option>
                      <option value="scan">Scan</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground block mb-2">Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Panoramic X-Ray"
                      className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm cursor-text"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Image URL *</label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm cursor-text"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the image..."
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm cursor-text"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground block mb-2">Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Add clinical notes..."
                    className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm cursor-text"
                    rows={2}
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full bg-accent hover:bg-accent/90 disabled:opacity-50 text-accent-foreground px-4 py-2 rounded-lg transition-colors text-sm font-medium cursor-pointer"
                >
                  {uploading ? "Uploading..." : "Upload Image"}
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Images Grid */}
      <div>
        <h3 className="font-semibold text-foreground mb-4">
          {images.length === 0 ? "No images uploaded" : `Images (${images.length})`}
        </h3>

        {images.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image) => (
              <div
                key={image._id}
                className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
              >
                <div className="aspect-square bg-muted overflow-hidden relative">
                  <img
                    src={image.imageUrl || "/placeholder.svg"}
                    alt={image.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      e.currentTarget.src = "/medical-image.jpg"
                    }}
                  />
                </div>
                <div className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="font-medium text-foreground text-sm">{image.title || "Untitled"}</p>
                      <p className="text-xs text-muted-foreground">{getImageTypeLabel(image.type)}</p>
                    </div>
                  </div>
                  {image.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{image.description}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Uploaded by {image.uploadedBy?.name} on {new Date(image.uploadedAt).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setSelectedImage(image)}
                      className="flex-1 flex items-center justify-center gap-1 bg-primary hover:bg-primary/90 text-primary-foreground px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      View
                    </button>
                    {isDoctor && (
                      <button
                        onClick={() => {
                          setImageToDelete(image)
                          setShowDeleteModal(true)
                        }}
                        className="flex-1 flex items-center justify-center gap-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Viewer Modal - Enhanced Design */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-card rounded-lg shadow-xl border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-card">
              <h3 className="font-semibold text-foreground">{selectedImage.title || "Image"}</h3>
              <button
                onClick={() => setSelectedImage(null)}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-2 hover:bg-muted rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4">
              <img
                src={selectedImage.imageUrl || "/placeholder.svg"}
                alt={selectedImage.title}
                className="w-full rounded-lg border border-border"
                onError={(e) => {
                  e.currentTarget.src = "/medical-image.jpg"
                }}
              />
              <div className="space-y-3">
                <div className="bg-muted/50 rounded-lg p-3 border border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Type</p>
                  <p className="text-foreground text-sm mt-1">{getImageTypeLabel(selectedImage.type)}</p>
                </div>
                {selectedImage.description && (
                  <div className="bg-muted/50 rounded-lg p-3 border border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Description</p>
                    <p className="text-foreground text-sm mt-1">{selectedImage.description}</p>
                  </div>
                )}
                {selectedImage.notes && (
                  <div className="bg-muted/50 rounded-lg p-3 border border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Clinical Notes</p>
                    <p className="text-foreground text-sm mt-1">{selectedImage.notes}</p>
                  </div>
                )}
                <div className="bg-muted/50 rounded-lg p-3 border border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Uploaded By</p>
                  <p className="text-foreground text-sm mt-1">
                    {selectedImage.uploadedBy?.name} on {new Date(selectedImage.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border bg-muted/30">
              <button
                onClick={() => setSelectedImage(null)}
                className="w-full bg-muted hover:bg-muted/80 text-muted-foreground px-4 py-2 rounded-lg transition-colors font-medium cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        title="Delete Image"
        description="Are you sure you want to delete this image? This action cannot be undone."
        itemName={imageToDelete?.title || "Untitled Image"}
        onConfirm={handleDeleteImage}
        onCancel={() => {
          setShowDeleteModal(false)
          setImageToDelete(null)
        }}
        isLoading={isDeleting}
      />
    </div>
  )
}
