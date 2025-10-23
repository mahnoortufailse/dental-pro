"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import toast from "react-hot-toast"
import Image from "next/image"
import { useAuth } from "@/components/auth-context"
import { PatientSidebar } from "@/components/patient-sidebar"
import { ProtectedRoute } from "@/components/protected-route"

interface PatientImage {
  _id: string
  type: "xray" | "photo" | "scan"
  title: string
  description: string
  imageUrl: string
  uploadedAt: string
  notes: string
}

export default function XRaysPage() {
  const { patient, patientToken } = useAuth()
  const [images, setImages] = useState<PatientImage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<PatientImage | null>(null)

  useEffect(() => {
    if (patient && patientToken) {
      fetchImages(patientToken, patient._id)
    }
  }, [patient, patientToken])

  const fetchImages = async (token: string, patientId: string) => {
    try {
      const response = await fetch(`/api/patient-images?patientId=${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error("Failed to fetch images")

      const data = await response.json()
      setImages(data.images || [])
    } catch (error) {
      toast.error("Failed to load x-rays")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <ProtectedRoute patientOnly={true}>
      <div className="flex h-screen bg-background">
       
        <main className="flex-1 lg:ml-0">
          <div className="">
            {/* Header */}
            <div className="dashboard-header mb-8">
              <div>
                <h1 className="dashboard-title">X-Rays & Images</h1>
                <p className="text-muted-foreground mt-1 text-sm sm:text-base">Your dental imaging records</p>
              </div>
            </div>

            {/* Images Grid */}
            {images.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No x-rays or images found</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {images.map((image) => (
                  <Card
                    key={image._id}
                    className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer !py-0"
                    onClick={() => setSelectedImage(image)}
                  >
                    <div className="relative w-full h-48 bg-muted">
                      {image.imageUrl ? (
                        <Image
                          src={image.imageUrl || "/placeholder.svg"}
                          alt={image.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <p className="text-muted-foreground">No image available</p>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-foreground">{image.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(image.uploadedAt).toLocaleDateString()}
                      </p>
                      <span className="inline-block mt-2 px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                        {image.type.toUpperCase()}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedImage(null)}
        >
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-foreground">{selectedImage.title}</h2>
                <Button variant="ghost" onClick={() => setSelectedImage(null)}>
                  ✕
                </Button>
              </div>

              {selectedImage.imageUrl && (
                <div className="relative w-full h-96 bg-muted mb-4">
                  <Image
                    src={selectedImage.imageUrl || "/placeholder.svg"}
                    alt={selectedImage.title}
                    fill
                    className="object-contain"
                  />
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium text-foreground">{selectedImage.type.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium text-foreground">
                    {new Date(selectedImage.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                {selectedImage.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="font-medium text-foreground">{selectedImage.description}</p>
                  </div>
                )}
                {selectedImage.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Notes</p>
                    <p className="font-medium text-foreground">{selectedImage.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}
    </ProtectedRoute>
  )
}
