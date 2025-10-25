"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import toast from "react-hot-toast"
import Image from "next/image"
import { useAuth } from "@/components/auth-context"
import { PatientSidebar } from "@/components/patient-sidebar"
import { ProtectedRoute } from "@/components/protected-route"
import { XrayDisplayViewer } from "@/components/xray-display-viewer"
import { FileText } from "lucide-react" // Added import for FileText

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

  const getImageTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      xray: "X-Ray",
      photo: "Photo",
      scan: "Scan",
    }
    return labels[type] || type
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
                <h1 className="dashboard-title sm:text-3xl text-2xl">X-Rays & Images</h1>
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
                {images.map((image) => {
                  const isPdf = image.imageUrl?.toLowerCase().includes(".pdf")
                  return (
                    <Card
                      key={image._id}
                      className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer !py-0"
                      onClick={() => setSelectedImage(image)}
                    >
                      <div className="relative w-full h-48 bg-muted flex items-center justify-center">
                        {isPdf ? (
                          <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-muted to-muted/50">
                            <FileText className="w-12 h-12 text-destructive/50 mb-2" />
                            <p className="text-xs text-muted-foreground font-medium">PDF Document</p>
                          </div>
                        ) : (
                          <Image
                            src={image.imageUrl || "/placeholder.svg"}
                            alt={image.title}
                            fill
                            className="object-cover"
                          />
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
                  )
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Image Viewer Modal */}
      {selectedImage && (
        <XrayDisplayViewer
          imageUrl={selectedImage.imageUrl}
          title={selectedImage.title || "Document"}
          type={selectedImage.type}
          description={selectedImage.description}
          notes={selectedImage.notes}
          uploadedAt={selectedImage.uploadedAt}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </ProtectedRoute>
  )
}
