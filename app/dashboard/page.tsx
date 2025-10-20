//@ts-nocheck
"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/components/auth-context"
import { useEffect, useState } from "react"
import { Users, Calendar, TrendingUp, AlertCircle } from "lucide-react"

export default function DashboardPage() {
  const { user, token } = useAuth()
  const [stats, setStats] = useState({ appointments: 0, patients: 0, lowStock: 0, revenue: 0 })
  const [appointments, setAppointments] = useState([])

  useEffect(() => {
    if (token) {
      fetchDashboardData()
    }
  }, [token])

  const fetchDashboardData = async () => {
    try {
      const [appointmentsRes, patientsRes, inventoryRes, billingRes] = await Promise.allSettled([
        fetch("/api/appointments", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/patients", { headers: { Authorization: `Bearer ${token}` } }),
        fetch("/api/inventory", { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
        fetch("/api/billing", { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
      ])

      let appointmentCount = 0
      let patientCount = 0
      let lowStockCount = 0
      let totalRevenue = 0

      if (appointmentsRes.status === "fulfilled" && appointmentsRes.value.ok) {
        const data = await appointmentsRes.value.json()
        setAppointments(data.appointments || [])
        appointmentCount = data.appointments?.length || 0
      }

      if (patientsRes.status === "fulfilled" && patientsRes.value.ok) {
        const data = await patientsRes.value.json()
        patientCount = data.patients?.length || 0
      }

      if (inventoryRes?.status === "fulfilled" && inventoryRes.value?.ok) {
        const data = await inventoryRes.value.json()
        lowStockCount = data.inventory?.filter((item: any) => item.quantity < item.minStock).length || 0
      }

      if (billingRes?.status === "fulfilled" && billingRes.value?.ok) {
        const data = await billingRes.value.json()
        totalRevenue = data.billing?.reduce((sum: number, b: any) => sum + b.totalAmount, 0) || 0
      }

      setStats({
        appointments: appointmentCount,
        patients: patientCount,
        lowStock: lowStockCount,
        revenue: totalRevenue,
      })
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    }
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            <div className="dashboard-header">
              <div>
                <h1 className="dashboard-title">Welcome back, {user?.name}!</h1>
                <p className="text-muted-foreground mt-1">Here's what's happening at your clinic today</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="stat-card">
                <div className="stat-icon bg-gradient-to-br from-primary/20 to-primary/10">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <p className="stat-label">Today's Appointments</p>
                <p className="stat-value">{stats.appointments}</p>
              </div>

              <div className="stat-card">
                <div className="stat-icon bg-gradient-to-br from-accent/20 to-accent/10">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <p className="stat-label">Active Patients</p>
                <p className="stat-value">{stats.patients}</p>
              </div>

              {user?.role !== "doctor" && (
                <>
                  <div className="stat-card">
                    <div className="stat-icon bg-gradient-to-br from-destructive/20 to-destructive/10">
                      <AlertCircle className="w-6 h-6 text-destructive" />
                    </div>
                    <p className="stat-label">Low Stock Items</p>
                    <p className="stat-value">{stats.lowStock}</p>
                  </div>

                  <div className="stat-card">
                    <div className="stat-icon bg-gradient-to-br from-secondary/20 to-secondary/10">
                      <TrendingUp className="w-6 h-6 text-secondary" />
                    </div>
                    <p className="stat-label">Total Revenue</p>
                    <p className="stat-value">${stats.revenue.toFixed(0)}</p>
                  </div>
                </>
              )}
            </div>

            <div className="stat-card">
              <h2 className="text-xl font-bold mb-6 text-foreground">Today's Schedule</h2>
              {appointments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Time</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Patient</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Doctor</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Type</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {appointments.slice(0, 5).map((apt) => (
                        <tr key={apt.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-4">{apt.time}</td>
                          <td className="py-3 px-4 font-medium">{apt.patientName}</td>
                          <td className="py-3 px-4">{apt.doctorName}</td>
                          <td className="py-3 px-4">{apt.type}</td>
                          <td className="py-3 px-4">
                            <span className="px-3 py-1 bg-accent/20 text-accent rounded-full text-xs font-semibold">
                              {apt.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No appointments scheduled for today</p>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
