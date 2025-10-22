"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-context"
import Link from "next/link"
import { FileText, ImageIcon, Calendar, Bluetooth as Tooth } from "lucide-react"
import { PatientSidebar } from "@/components/patient-sidebar"
import { ProtectedRoute } from "@/components/protected-route"

interface DashboardStats {
  totalAppointments: number
  upcomingAppointments: number
  medicalRecords: number
  xrays: number
}

export default function PatientDashboard() {
  const { patient, patientToken } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalAppointments: 0,
    upcomingAppointments: 0,
    medicalRecords: 0,
    xrays: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (patient && patientToken) {
      fetchDashboardStats(patientToken, patient._id)
    }
  }, [patient, patientToken])

  const fetchDashboardStats = async (token: string, patientId: string) => {
    try {
      const [appointmentsRes, recordsRes, imagesRes] = await Promise.all([
        fetch(`/api/appointments?patientId=${patientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/appointment-reports?patientId=${patientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/patient-images?patientId=${patientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      const appointmentsData = appointmentsRes.ok ? await appointmentsRes.json() : { appointments: [] }
      const recordsData = recordsRes.ok ? await recordsRes.json() : { reports: [] }
      const imagesData = imagesRes.ok ? await imagesRes.json() : { images: [] }

      const appointments = appointmentsData.appointments || []
      const upcomingCount = appointments.filter((apt: any) => new Date(apt.date) > new Date()).length

      setStats({
        totalAppointments: appointments.length,
        upcomingAppointments: upcomingCount,
        medicalRecords: recordsData.reports?.length || 0,
        xrays: imagesData.images?.length || 0,
      })
    } catch (error) {
      console.error("Error fetching stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading your dashboard...</p>
      </div>
    )
  }

  if (!patient) {
    return null
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
                <h1 className="dashboard-title">Welcome back, {patient.name}!</h1>
                <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                  Here's your medical records and appointment information
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div className="stat-card">
                <div className="stat-icon bg-gradient-to-br from-primary/20 to-primary/10">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <p className="stat-label">Total Appointments</p>
                <p className="stat-value">{stats.totalAppointments}</p>
              </div>

              <div className="stat-card">
                <div className="stat-icon bg-gradient-to-br from-accent/20 to-accent/10">
                  <Calendar className="w-6 h-6 text-accent" />
                </div>
                <p className="stat-label">Upcoming</p>
                <p className="stat-value">{stats.upcomingAppointments}</p>
              </div>

              <div className="stat-card">
                <div className="stat-icon bg-gradient-to-br from-primary/20 to-primary/10">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <p className="stat-label">Medical Records</p>
                <p className="stat-value">{stats.medicalRecords}</p>
              </div>

              <div className="stat-card">
                <div className="stat-icon bg-gradient-to-br from-accent/20 to-accent/10">
                  <ImageIcon className="w-6 h-6 text-accent" />
                </div>
                <p className="stat-label">X-Rays & Images</p>
                <p className="stat-value">{stats.xrays}</p>
              </div>
            </div>

            {/* Personal Information Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="stat-card lg:col-span-2">
                <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-foreground">Personal Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Full Name</p>
                    <p className="text-foreground font-medium">{patient.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Email</p>
                    <p className="text-foreground font-medium">{patient.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Phone</p>
                    <p className="text-foreground font-medium">{patient.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Date of Birth</p>
                    <p className="text-foreground font-medium">{patient.dob}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-sm text-muted-foreground mb-1">Address</p>
                    <p className="text-foreground font-medium">{patient.address || "Not provided"}</p>
                  </div>
                </div>
              </div>

              {/* Insurance Information */}
              <div className="stat-card">
                <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-foreground">Insurance</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Provider</p>
                    <p className="text-foreground font-medium">{patient.insuranceProvider}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Policy Number</p>
                    <p className="text-foreground font-medium text-sm">{patient.insuranceNumber || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Account Balance</p>
                    <p className="text-lg font-bold text-foreground">${(patient.balance || 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Medical Information */}
            <div className="stat-card mb-8">
              <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-foreground">Medical Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-3">Allergies</p>
                  <div className="flex flex-wrap gap-2">
                    {patient.allergies && patient.allergies.length > 0 ? (
                      patient.allergies.map((allergy, idx) => (
                        <span
                          key={idx}
                          className="bg-destructive/10 text-destructive px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {allergy}
                        </span>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">No allergies recorded</p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-3">Medical Conditions</p>
                  <div className="flex flex-wrap gap-2">
                    {patient.medicalConditions && patient.medicalConditions.length > 0 ? (
                      patient.medicalConditions.map((condition, idx) => (
                        <span key={idx} className="bg-accent/10 text-accent px-3 py-1 rounded-full text-sm font-medium">
                          {condition}
                        </span>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">No conditions recorded</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Medical Records Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Medical Records */}
              <Link href="/patient-dashboard/medical-records">
                <div className="stat-card hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Medical Records</h3>
                      <p className="text-muted-foreground text-sm mt-2">
                        View your appointment reports, findings, and treatment history
                      </p>
                    </div>
                    <FileText className="w-8 h-8 text-primary/40" />
                  </div>
                  <div className="text-primary font-medium text-sm">
                    {stats.medicalRecords} record{stats.medicalRecords !== 1 ? "s" : ""}
                  </div>
                </div>
              </Link>

              {/* X-Rays & Images */}
              <Link href="/patient-dashboard/xrays">
                <div className="stat-card hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">X-Rays & Images</h3>
                      <p className="text-muted-foreground text-sm mt-2">
                        View all your dental x-rays, scans, and imaging records
                      </p>
                    </div>
                    <ImageIcon className="w-8 h-8 text-accent/40" />
                  </div>
                  <div className="text-accent font-medium text-sm">
                    {stats.xrays} image{stats.xrays !== 1 ? "s" : ""}
                  </div>
                </div>
              </Link>

              {/* Appointments */}
              <Link href="/patient-dashboard/appointments">
                <div className="stat-card hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Appointments</h3>
                      <p className="text-muted-foreground text-sm mt-2">
                        View your appointment history and upcoming visits
                      </p>
                    </div>
                    <Calendar className="w-8 h-8 text-primary/40" />
                  </div>
                  <div className="text-primary font-medium text-sm">{stats.upcomingAppointments} upcoming</div>
                </div>
              </Link>

              {/* Tooth Chart */}
              <Link href="/patient-dashboard/tooth-chart">
                <div className="stat-card hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Tooth Chart</h3>
                      <p className="text-muted-foreground text-sm mt-2">View your dental chart and treatment status</p>
                    </div>
                    <Tooth className="w-8 h-8 text-accent/40" />
                  </div>
                  <div className="text-accent font-medium text-sm">View details</div>
                </div>
              </Link>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
