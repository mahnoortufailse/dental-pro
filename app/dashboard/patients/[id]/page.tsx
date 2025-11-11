//@ts-nocheck
"use client"

import { useParams } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { Sidebar } from "@/components/sidebar"
import { ToothChart } from "@/components/tooth-chart"
import { PatientImagesSection } from "@/components/patient-images-section"
import { MedicalHistorySection } from "@/components/medical-history-section"
import { AddBillingRequestModal } from "@/components/add-billing-request-modal"
import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { ArrowLeft, Plus } from "lucide-react"
import Link from "next/link"

export default function PatientDetailPage() {
  const params = useParams()
  const patientId = params.id as string
  const { user, token } = useAuth()
  const [patient, setPatient] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [showBillingRequestModal, setShowBillingRequestModal] = useState(false)

  useEffect(() => {
    if (token && patientId) {
      fetchPatient()
    }
  }, [token, patientId])

  const fetchPatient = async () => {
    try {
      const res = await fetch(`/api/patients/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setPatient(data.patient)
      } else {
        toast.error("Failed to fetch patient")
      }
    } catch (error) {
      toast.error("Error fetching patient")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-muted-foreground">Loading patient details...</div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  if (!patient) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen bg-background">
          <Sidebar />
          <main className="flex-1 flex items-center justify-center">
            <div className="text-muted-foreground">Patient not found</div>
          </main>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto md:pt-0 pt-16">
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-4">
                <Link href="/dashboard/patients" className="text-primary hover:text-primary/80 transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{patient.name}</h1>
                  <p className="text-muted-foreground text-sm mt-1">Patient ID: {patient._id}</p>
                </div>
              </div>
              {user?.role === "doctor" && (
                <button
                  onClick={() => setShowBillingRequestModal(true)}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors text-sm font-medium cursor-pointer whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  Add Billing Request
                </button>
              )}
            </div>

            {/* Patient Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Phone</p>
                <p className="text-foreground font-medium">{patient.phone}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Email</p>
                <p className="text-foreground font-medium text-sm">{patient.email}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase">DOB</p>
                <p className="text-foreground font-medium">{patient.dob}</p>
              </div>
              <div className="bg-card border border-border rounded-lg p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Doctor</p>
                <p className="text-foreground font-medium">{patient.assignedDoctorId?.name || "Unassigned"}</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-card border border-border rounded-lg">
              <div className="flex border-b border-border overflow-x-auto">
                {["overview", "medical-history", "tooth-chart", "images"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 font-medium text-sm whitespace-nowrap transition-colors ${
                      activeTab === tab
                        ? "text-primary border-b-2 border-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab === "overview" && "Overview"}
                    {tab === "medical-history" && "Medical History"}
                    {tab === "tooth-chart" && "Tooth Chart"}
                    {tab === "images" && "X-Rays & Images"}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {/* Overview Tab */}
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-foreground mb-3">Patient Information</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase">ID Number</p>
                          <p className="text-foreground">{patient.idNumber || "Not provided"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase">Address</p>
                          <p className="text-foreground">{patient.address || "Not provided"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase">Insurance Provider</p>
                          <p className="text-foreground">{patient.insuranceProvider}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase">Insurance Number</p>
                          <p className="text-foreground">{patient.insuranceNumber || "Not provided"}</p>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-border pt-6">
                      <h3 className="font-semibold text-foreground mb-3">Medical Information</h3>
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase">Allergies</p>
                          <p className="text-foreground">{patient.allergies?.join(", ") || "None"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase">Medical Conditions</p>
                          <p className="text-foreground">{patient.medicalConditions?.join(", ") || "None"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase">Medical History</p>
                          <p className="text-foreground">{patient.medicalHistory || "No history recorded"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Medical History Tab */}
                {activeTab === "medical-history" && (
                  <MedicalHistorySection
                    patientId={patientId}
                    token={token!}
                    isDoctor={user?.role === "doctor"}
                    currentDoctorId={user?._id}
                  />
                )}

                {/* Tooth Chart Tab */}
                {activeTab === "tooth-chart" && (
                  <ToothChart patientId={patientId} token={token!} onSave={fetchPatient} />
                )}

                {/* Images Tab */}
                {activeTab === "images" && (
                  <PatientImagesSection patientId={patientId} token={token!} isDoctor={user?.role === "doctor"} />
                )}
              </div>
            </div>

            {/* Add Billing Request Modal */}
            <AddBillingRequestModal
              isOpen={showBillingRequestModal}
              onClose={() => setShowBillingRequestModal(false)}
              patientId={patientId}
              patientName={patient.name}
              token={token!}
              onSuccess={fetchPatient}
            />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
