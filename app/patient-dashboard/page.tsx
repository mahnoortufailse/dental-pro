"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-context"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { FileText, ImageIcon, Calendar, Bluetooth as Tooth } from "lucide-react"

interface DashboardStats {
  totalAppointments: number
  upcomingAppointments: number
  medicalRecords: number
  xrays: number
}

export default function PatientDashboardPage() {
  const { patient, patientToken } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalAppointments: 0,
    upcomingAppointments: 0,
    medicalRecords: 0,
    xrays: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
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
      toast({ description: "Failed to load dashboard data.", variant: "destructive" })
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

  if (!patient) return null

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Welcome back, {patient.name}!
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          Here's your medical records and appointment information.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/patient-dashboard/medical-records">
          <div className="stat-card hover:shadow-lg transition cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">Medical Records</h3>
                <p className="text-muted-foreground text-sm mt-2">
                  View your reports and treatment history.
                </p>
              </div>
              <FileText className="w-8 h-8 text-primary/40" />
            </div>
          </div>
        </Link>

        <Link href="/patient-dashboard/xrays">
          <div className="stat-card hover:shadow-lg transition cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">X-Rays & Images</h3>
                <p className="text-muted-foreground text-sm mt-2">
                  View your dental x-rays and imaging records.
                </p>
              </div>
              <ImageIcon className="w-8 h-8 text-accent/40" />
            </div>
          </div>
        </Link>

        <Link href="/patient-dashboard/appointments">
          <div className="stat-card hover:shadow-lg transition cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">Appointments</h3>
                <p className="text-muted-foreground text-sm mt-2">
                  View your appointment history and upcoming visits.
                </p>
              </div>
              <Calendar className="w-8 h-8 text-primary/40" />
            </div>
          </div>
        </Link>

        <Link href="/patient-dashboard/tooth-chart">
          <div className="stat-card hover:shadow-lg transition cursor-pointer">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">Tooth Chart</h3>
                <p className="text-muted-foreground text-sm mt-2">
                  View your dental chart and treatment status.
                </p>
              </div>
              <Tooth className="w-8 h-8 text-accent/40" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
