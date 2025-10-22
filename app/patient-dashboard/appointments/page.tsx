"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import toast from "react-hot-toast"
import { useAuth } from "@/components/auth-context"
import { PatientSidebar } from "@/components/patient-sidebar"
import { ProtectedRoute } from "@/components/protected-route"

interface Appointment {
  _id: string
  date: string
  time: string
  type: string
  status: string
  doctorName: string
  notes?: string
}

export default function AppointmentsPage() {
  const { patient, patientToken } = useAuth()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (patient && patientToken) {
      fetchAppointments(patientToken, patient._id)
    }
  }, [patient, patientToken])

  const fetchAppointments = async (token: string, patientId: string) => {
    try {
      const response = await fetch(`/api/appointments?patientId=${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error("Failed to fetch appointments")

      const data = await response.json()
      setAppointments(data.appointments || [])
    } catch (error) {
      toast.error("Failed to load appointments")
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

  const upcomingAppointments = appointments.filter((apt) => new Date(apt.date) > new Date())
  const pastAppointments = appointments.filter((apt) => new Date(apt.date) <= new Date())

  return (
    <ProtectedRoute patientOnly={true}>
      <div className="flex h-screen bg-background">
        <PatientSidebar />
        <main className="flex-1 overflow-auto lg:ml-0">
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="dashboard-header mb-8">
              <div>
                <h1 className="dashboard-title">Appointments</h1>
                <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                  Your appointment history and upcoming visits
                </p>
              </div>
            </div>

            {/* Upcoming Appointments */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-foreground mb-4">Upcoming Appointments</h2>
              {upcomingAppointments.length === 0 ? (
                <Card className="p-6 text-center">
                  <p className="text-muted-foreground">No upcoming appointments</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {upcomingAppointments.map((apt) => (
                    <Card key={apt._id} className="p-6 border-l-4 border-l-primary">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-foreground">{apt.type}</h3>
                          <p className="text-muted-foreground mt-1">
                            {new Date(apt.date).toLocaleDateString()} at {apt.time}
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">Doctor: {apt.doctorName}</p>
                        </div>
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                          {apt.status}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Past Appointments */}
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">Past Appointments</h2>
              {pastAppointments.length === 0 ? (
                <Card className="p-6 text-center">
                  <p className="text-muted-foreground">No past appointments</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {pastAppointments.map((apt) => (
                    <Card key={apt._id} className="p-6 opacity-75">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-foreground">{apt.type}</h3>
                          <p className="text-muted-foreground mt-1">
                            {new Date(apt.date).toLocaleDateString()} at {apt.time}
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">Doctor: {apt.doctorName}</p>
                        </div>
                        <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-sm font-medium">
                          {apt.status}
                        </span>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
