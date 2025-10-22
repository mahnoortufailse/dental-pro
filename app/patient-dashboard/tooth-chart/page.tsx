"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-context"
import { PatientSidebar } from "@/components/patient-sidebar"
import { ProtectedRoute } from "@/components/protected-route"

interface ToothChartData {
  _id: string
  teeth: Record<string, any>
  overallNotes: string
  lastReview: string
}

export default function ToothChartPage() {
  const { patient, patientToken } = useAuth()
  const [toothChart, setToothChart] = useState<ToothChartData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    if (patient && patientToken) {
      fetchToothChart(patientToken, patient._id)
    }
  }, [patient, patientToken])

  const fetchToothChart = async (token: string, patientId: string) => {
    try {
      const response = await fetch(`/api/tooth-chart?patientId=${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error("Failed to fetch tooth chart")

      const data = await response.json()
      setToothChart(data.toothChart || null)
    } catch (error) {
      console.error("[v0] Error fetching tooth chart:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <ProtectedRoute patientOnly={true}>
      <div className="flex h-screen bg-background">
        <PatientSidebar />
        <main className="flex-1 overflow-auto lg:ml-0">
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="dashboard-header mb-8">
              <div>
                <h1 className="dashboard-title">Tooth Chart</h1>
                <p className="text-muted-foreground mt-1 text-sm sm:text-base">Your dental treatment status</p>
              </div>
            </div>

            {/* Content */}
            {!toothChart ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">No tooth chart data available yet</p>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Tooth Chart Visualization */}
                <Card className="p-6">
                  <h2 className="text-xl font-bold text-foreground mb-6">Dental Chart</h2>
                  <div className="bg-muted/50 p-8 rounded-lg">
                    <div className="grid grid-cols-8 gap-2 mb-8">
                      {/* Upper teeth */}
                      {Array.from({ length: 16 }).map((_, i) => {
                        const toothNum = i + 1
                        const toothData = toothChart.teeth?.[toothNum] || {}
                        const status = toothData.status || "healthy"
                        const statusColors: Record<string, string> = {
                          healthy: "bg-green-100 border-green-300 text-green-700",
                          treated: "bg-blue-100 border-blue-300 text-blue-700",
                          cavity: "bg-red-100 border-red-300 text-red-700",
                          missing: "bg-gray-100 border-gray-300 text-gray-700",
                          pending: "bg-yellow-100 border-yellow-300 text-yellow-700",
                        }

                        return (
                          <div
                            key={toothNum}
                            className={`p-3 border-2 rounded-lg text-center font-semibold text-sm ${statusColors[status] || statusColors.healthy}`}
                          >
                            {toothNum}
                          </div>
                        )
                      })}
                    </div>

                    {/* Legend */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                        <span className="text-muted-foreground">Healthy</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
                        <span className="text-muted-foreground">Treated</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
                        <span className="text-muted-foreground">Cavity</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
                        <span className="text-muted-foreground">Missing</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
                        <span className="text-muted-foreground">Pending</span>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Overall Notes */}
                {toothChart.overallNotes && (
                  <Card className="p-6">
                    <h3 className="text-lg font-bold text-foreground mb-3">Overall Notes</h3>
                    <p className="text-muted-foreground">{toothChart.overallNotes}</p>
                  </Card>
                )}

                {/* Last Review */}
                {toothChart.lastReview && (
                  <Card className="p-6 bg-accent/5">
                    <p className="text-sm text-muted-foreground">Last Review</p>
                    <p className="text-foreground font-medium mt-1">
                      {new Date(toothChart.lastReview).toLocaleDateString()}
                    </p>
                  </Card>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
