//@ts-check
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import toast from "react-hot-toast"
import Link from "next/link"

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
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  

  useEffect(() => {
    const token = sessionStorage.getItem("patientToken")
    const patient = sessionStorage.getItem("patient")

    if (!token || !patient) {
      router.push("/patient-login")
      return
    }

    fetchAppointments(token, JSON.parse(patient)._id)
  }, [router])

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

  const upcomingAppointments = appointments.filter((apt) => new Date(apt.date) > new Date())
  const pastAppointments = appointments.filter((apt) => new Date(apt.date) <= new Date())

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
              <h1 className="text-3xl font-bold text-foreground">Appointments</h1>
              <p className="text-muted-foreground mt-1">Your appointment history</p>
            </div>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upcoming Appointments */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">Upcoming Appointments</h2>
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
          <h2 className="text-2xl font-bold text-foreground mb-4">Past Appointments</h2>
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
    </div>
  )
}
