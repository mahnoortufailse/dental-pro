"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import toast from "react-hot-toast"
import Link from "next/link"

interface MedicalEntry {
  date: string
  notes: string
  findings: string
  treatment: string
  medications: string[]
}

interface AppointmentReport {
  _id: string
  procedures: Array<{ name: string; description: string; tooth: string; status: string }>
  findings: string
  notes: string
  nextVisit: string
  followUpDetails: string
  createdAt: string
}

export default function MedicalRecordsPage() {
  const [records, setRecords] = useState<AppointmentReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
 

  useEffect(() => {
    const token = sessionStorage.getItem("patientToken")
    const patient = sessionStorage.getItem("patient")

    if (!token || !patient) {
      router.push("/patient-login")
      return
    }

    fetchRecords(token, JSON.parse(patient)._id)
  }, [router])

  const fetchRecords = async (token: string, patientId: string) => {
    try {
      const response = await fetch(`/api/appointment-reports?patientId=${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error("Failed to fetch records")

      const data = await response.json()
      setRecords(data.reports || [])
    } catch (error) {
      toast.error("Failed to load medical records")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem("patientToken")
    sessionStorage.removeItem("patient")
    router.push("/patient-login")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/patient-dashboard">
              <Button variant="ghost">← Back</Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Medical Records</h1>
              <p className="text-muted-foreground mt-1">Your appointment reports and findings</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {records.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No medical records found</p>
          </Card>
        ) : (
          <div className="space-y-6">
            {records.map((record) => (
              <Card key={record._id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      Report from {new Date(record.createdAt).toLocaleDateString()}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Next Visit: {record.nextVisit ? new Date(record.nextVisit).toLocaleDateString() : "Not scheduled"}
                    </p>
                  </div>
                </div>

                {/* Procedures */}
                {record.procedures && record.procedures.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-foreground mb-2">Procedures Performed</h4>
                    <div className="space-y-2">
                      {record.procedures.map((proc, idx) => (
                        <div key={idx} className="bg-muted/50 p-3 rounded-lg">
                          <p className="font-medium text-foreground">{proc.name}</p>
                          {proc.tooth && <p className="text-sm text-muted-foreground">Tooth: {proc.tooth}</p>}
                          {proc.description && <p className="text-sm text-muted-foreground">{proc.description}</p>}
                          <p className="text-xs text-muted-foreground mt-1">Status: {proc.status}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Findings */}
                {record.findings && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-foreground mb-2">Findings</h4>
                    <p className="text-muted-foreground">{record.findings}</p>
                  </div>
                )}

                {/* Notes */}
                {record.notes && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-foreground mb-2">Doctor's Notes</h4>
                    <p className="text-muted-foreground">{record.notes}</p>
                  </div>
                )}

                {/* Follow-up */}
                {record.followUpDetails && (
                  <div className="bg-accent/10 p-3 rounded-lg">
                    <h4 className="font-semibold text-foreground mb-2">Follow-up Instructions</h4>
                    <p className="text-muted-foreground">{record.followUpDetails}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
