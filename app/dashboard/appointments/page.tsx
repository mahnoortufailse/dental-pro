//@ts-nocheck
"use client"

import type React from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/components/auth-context"
import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { ChevronLeft, ChevronRight, Plus, FileText } from "lucide-react"

export default function AppointmentsPage() {
  const { user, token } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [showReportForm, setShowReportForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    patientId: "",
    patientName: "",
    doctorId: "",
    doctorName: "",
    date: "",
    time: "",
    type: "Consultation",
    chair: "",
    duration: 30,
  })
  const [reportData, setReportData] = useState({
    procedures: [],
    findings: "",
    notes: "",
    nextVisit: "",
    followUpDetails: "",
  })
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [reportErrors, setReportErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (token) {
      fetchAppointments()
      if (user?.role !== "doctor") {
        fetchPatients()
        fetchDoctors()
      }
    }
  }, [token, user])

  const fetchAppointments = async () => {
    try {
      const res = await fetch("/api/appointments", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setAppointments(data.appointments || [])
      }
    } catch (error) {
      console.error("Failed to fetch appointments:", error)
      toast.error("Failed to fetch appointments")
    }
  }

  const fetchPatients = async () => {
    try {
      const res = await fetch("/api/patients", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setPatients(data.patients || [])
      }
    } catch (error) {
      console.error("Failed to fetch patients:", error)
      toast.error("Failed to fetch patients")
    }
  }

  const fetchDoctors = async () => {
    try {
      const res = await fetch("/api/users?role=doctor", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setDoctors(data.users || [])
      }
    } catch (error) {
      console.error("Failed to fetch doctors:", error)
      toast.error("Failed to fetch doctors")
    }
  }

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0]
    return appointments.filter((apt) => apt.date === dateStr)
  }

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const handleDateClick = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    const dateStr = date.toISOString().split("T")[0]
    setSelectedDate(dateStr)
    setFormData({
      ...formData,
      date: dateStr,
    })
  }

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!window.confirm("Are you sure you want to delete this appointment?")) return

    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        setAppointments(appointments.filter((a) => a._id !== appointmentId && a.id !== appointmentId))
        toast.success("Appointment deleted successfully")
      } else {
        toast.error("Failed to delete appointment")
      }
    } catch (error) {
      console.error("Failed to delete appointment:", error)
      toast.error("Error deleting appointment")
    }
  }

  const handleEditAppointment = (appointment: any) => {
    setEditingId(appointment._id || appointment.id)
    setFormData({
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      doctorId: appointment.doctorId,
      doctorName: appointment.doctorName,
      date: appointment.date,
      time: appointment.time,
      type: appointment.type,
      chair: appointment.chair,
      duration: appointment.duration,
    })
    setShowForm(true)
  }

  const validateAppointmentForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.patientId.trim()) {
      errors.patientId = "Patient is required"
    }
    if (!formData.doctorId.trim()) {
      errors.doctorId = "Doctor is required"
    }
    if (!formData.date.trim()) {
      errors.date = "Date is required"
    } else {
      const selectedDate = new Date(formData.date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (selectedDate < today) {
        errors.date = "Cannot schedule appointments in the past"
      }
    }
    if (!formData.time.trim()) {
      errors.time = "Time is required"
    }
    if (!formData.chair.trim()) {
      errors.chair = "Chair number is required"
    }
    if (formData.duration <= 0) {
      errors.duration = "Duration must be greater than 0"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateAppointmentForm()) {
      toast.error("Please fix the errors in the form")
      return
    }

    try {
      const method = editingId ? "PUT" : "POST"
      const url = editingId ? `/api/appointments/${editingId}` : "/api/appointments"

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        const data = await res.json()
        if (editingId) {
          setAppointments(appointments.map((a) => (a._id === editingId || a.id === editingId ? data.appointment : a)))
          toast.success("Appointment updated successfully")
          setEditingId(null)
        } else {
          setAppointments([...appointments, data.appointment])
          toast.success("Appointment scheduled successfully")
        }
        setShowForm(false)
        setFormErrors({})
        setFormData({
          patientId: "",
          patientName: "",
          doctorId: "",
          doctorName: "",
          date: "",
          time: "",
          type: "Consultation",
          chair: "",
          duration: 30,
        })
      } else {
        const errorData = await res.json()
        toast.error(errorData.error || "Failed to save appointment")
      }
    } catch (error) {
      console.error("Failed to add appointment:", error)
      toast.error("Error saving appointment")
    }
  }

  const validateReportForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!reportData.procedures || reportData.procedures.length === 0) {
      errors.procedures = "At least one procedure is required"
    }
    if (!reportData.findings.trim()) {
      errors.findings = "Findings are required"
    }
    if (!reportData.notes.trim()) {
      errors.notes = "Notes are required"
    }

    setReportErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAppointment) return

    if (!validateReportForm()) {
      toast.error("Please fix the errors in the form")
      return
    }

    try {
      const proceduresArray = Array.isArray(reportData.procedures)
        ? reportData.procedures.filter((p) => p && p.trim())
        : reportData.procedures
            .split("\n")
            .map((p) => p.trim())
            .filter(Boolean)

      const res = await fetch("/api/appointment-reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          appointmentId: selectedAppointment._id || selectedAppointment.id,
          patientId: selectedAppointment.patientId,
          procedures: proceduresArray,
          findings: reportData.findings.trim(),
          notes: reportData.notes.trim(),
          nextVisit: reportData.nextVisit || null,
          followUpDetails: reportData.followUpDetails || "",
        }),
      })

      const responseData = await res.json()

      if (res.ok) {
        toast.success("Report created successfully")
        setShowReportForm(false)
        setReportErrors({})
        setReportData({
          procedures: [],
          findings: "",
          notes: "",
          nextVisit: "",
          followUpDetails: "",
        })
        setSelectedAppointment(null)
      } else {
        console.error("[v0] Report creation error:", responseData)
        toast.error(responseData.error || "Failed to create report")
      }
    } catch (error) {
      console.error("[v0] Failed to create report:", error)
      toast.error("Error creating report")
    }
  }

  const daysInMonth = getDaysInMonth(currentDate)
  const firstDay = getFirstDayOfMonth(currentDate)
  const monthName = currentDate.toLocaleString("default", { month: "long", year: "numeric" })

  const calendarDays = []
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i)
  }

  const selectedDateAppointments = selectedDate ? appointments.filter((apt) => apt.date === selectedDate) : []

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto md:pt-0 pt-16">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Appointments Calendar</h1>
              <p className="text-muted-foreground text-sm mt-1">View and manage appointments by date</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar */}
              <div className="lg:col-span-2">
                <div className="bg-card rounded-lg shadow-md border border-border p-6">
                  <div className="flex items-center justify-between mb-6">
                    <button onClick={handlePreviousMonth} className="p-2 hover:bg-muted rounded-lg transition-colors">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-xl font-bold text-foreground">{monthName}</h2>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-muted rounded-lg transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                      <div key={day} className="text-center font-semibold text-muted-foreground text-sm py-2">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((day, idx) => {
                      const dayAppointments = day
                        ? getAppointmentsForDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))
                        : []
                      const dateStr = day
                        ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split("T")[0]
                        : null
                      const isSelected = dateStr === selectedDate

                      return (
                        <div
                          key={idx}
                          onClick={() => day && handleDateClick(day)}
                          className={`aspect-square p-2 rounded-lg border-2 transition-colors cursor-pointer ${
                            isSelected
                              ? "border-accent bg-accent/20"
                              : day
                                ? dayAppointments.length > 0
                                  ? "border-primary bg-primary/10"
                                  : "border-border hover:border-primary"
                                : "border-transparent"
                          }`}
                        >
                          {day && (
                            <div className="h-full flex flex-col">
                              <span className="font-semibold text-sm text-foreground">{day}</span>
                              {dayAppointments.length > 0 && (
                                <div className="text-xs text-primary font-medium mt-1">
                                  {dayAppointments.length} apt{dayAppointments.length > 1 ? "s" : ""}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {user?.role !== "doctor" && (
                  <button
                    onClick={() => {
                      setEditingId(null)
                      setShowForm(!showForm)
                      setFormErrors({})
                    }}
                    className="w-full flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    New Appointment
                  </button>
                )}

                {selectedDate && (
                  <div className="bg-card rounded-lg shadow-md border border-border p-6">
                    <h3 className="font-bold text-foreground mb-4">
                      Appointments for {new Date(selectedDate).toLocaleDateString()}
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {selectedDateAppointments.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No appointments on this date</p>
                      ) : (
                        selectedDateAppointments.map((apt) => (
                          <div key={apt._id || apt.id} className="p-3 bg-muted rounded-lg">
                            <p className="font-medium text-foreground text-sm">{apt.patientName}</p>
                            <p className="text-xs text-muted-foreground">
                              {apt.time} - {apt.type}
                            </p>
                            <p className="text-xs text-muted-foreground">Chair: {apt.chair}</p>
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {user?.role !== "doctor" && (
                                <>
                                  <button
                                    onClick={() => handleEditAppointment(apt)}
                                    className="text-xs text-primary hover:underline"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAppointment(apt._id || apt.id)}
                                    className="text-xs text-destructive hover:underline"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                              {user?.role === "doctor" && (
                                <button
                                  onClick={() => {
                                    setSelectedAppointment(apt)
                                    setShowReportForm(true)
                                    setReportErrors({})
                                  }}
                                  className="text-xs text-primary hover:underline flex items-center gap-1"
                                >
                                  <FileText className="w-3 h-3" />
                                  Report
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Upcoming Appointments */}
                <div className="bg-card rounded-lg shadow-md border border-border p-6">
                  <h3 className="font-bold text-foreground mb-4">Upcoming Appointments</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {appointments.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No appointments scheduled</p>
                    ) : (
                      appointments.slice(0, 5).map((apt) => (
                        <div key={apt._id || apt.id} className="p-3 bg-muted rounded-lg">
                          <p className="font-medium text-foreground text-sm">{apt.patientName}</p>
                          <p className="text-xs text-muted-foreground">
                            {apt.date} at {apt.time}
                          </p>
                          <p className="text-xs text-muted-foreground">{apt.type}</p>
                          {user?.role === "doctor" && (
                            <button
                              onClick={() => {
                                setSelectedAppointment(apt)
                                setShowReportForm(true)
                                setReportErrors({})
                              }}
                              className="mt-2 text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3" />
                              Create Report
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Appointment Form Modal */}
            {showForm && user?.role !== "doctor" && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-card rounded-lg shadow-lg border border-border p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                  <h2 className="text-xl font-bold mb-4 text-foreground">
                    {editingId ? "Edit Appointment" : "Schedule Appointment"}
                  </h2>
                  <form onSubmit={handleAddAppointment} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Patient *</label>
                      <select
                        value={formData.patientId}
                        onChange={(e) => {
                          const patient = patients.find((p) => p._id === e.target.value)
                          setFormData({
                            ...formData,
                            patientId: e.target.value,
                            patientName: patient?.name || "",
                          })
                          setFormErrors({ ...formErrors, patientId: "" })
                        }}
                        className={`w-full px-4 py-2 bg-input border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm ${
                          formErrors.patientId ? "border-destructive" : "border-border"
                        }`}
                      >
                        <option value="">Select Patient</option>
                        {patients.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      {formErrors.patientId && <p className="text-xs text-destructive mt-1">{formErrors.patientId}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Doctor *</label>
                      <select
                        value={formData.doctorId}
                        onChange={(e) => {
                          const doctor = doctors.find((d) => d.id === e.target.value)
                          setFormData({
                            ...formData,
                            doctorId: e.target.value,
                            doctorName: doctor?.name || "",
                          })
                          setFormErrors({ ...formErrors, doctorId: "" })
                        }}
                        className={`w-full px-4 py-2 bg-input border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm ${
                          formErrors.doctorId ? "border-destructive" : "border-border"
                        }`}
                      >
                        <option value="">Select Doctor</option>
                        {doctors.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                      {formErrors.doctorId && <p className="text-xs text-destructive mt-1">{formErrors.doctorId}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Date *</label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => {
                          setFormData({ ...formData, date: e.target.value })
                          setFormErrors({ ...formErrors, date: "" })
                        }}
                        className={`w-full px-4 py-2 bg-input border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm ${
                          formErrors.date ? "border-destructive" : "border-border"
                        }`}
                      />
                      {formErrors.date && <p className="text-xs text-destructive mt-1">{formErrors.date}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Time *</label>
                      <input
                        type="time"
                        value={formData.time}
                        onChange={(e) => {
                          setFormData({ ...formData, time: e.target.value })
                          setFormErrors({ ...formErrors, time: "" })
                        }}
                        className={`w-full px-4 py-2 bg-input border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm ${
                          formErrors.time ? "border-destructive" : "border-border"
                        }`}
                      />
                      {formErrors.time && <p className="text-xs text-destructive mt-1">{formErrors.time}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Type</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                      >
                        <option value="Consultation">Consultation</option>
                        <option value="Cleaning">Cleaning</option>
                        <option value="Filling">Filling</option>
                        <option value="Root Canal">Root Canal</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Chair *</label>
                      <input
                        type="text"
                        placeholder="Chair (e.g., Chair 1)"
                        value={formData.chair}
                        onChange={(e) => {
                          setFormData({ ...formData, chair: e.target.value })
                          setFormErrors({ ...formErrors, chair: "" })
                        }}
                        className={`w-full px-4 py-2 bg-input border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm ${
                          formErrors.chair ? "border-destructive" : "border-border"
                        }`}
                      />
                      {formErrors.chair && <p className="text-xs text-destructive mt-1">{formErrors.chair}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Duration (minutes)</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: Number.parseInt(e.target.value) })}
                        className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                      />
                      {formErrors.duration && <p className="text-xs text-destructive mt-1">{formErrors.duration}</p>}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground px-4 py-2 rounded-lg transition-colors font-medium text-sm"
                      >
                        {editingId ? "Update" : "Schedule"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForm(false)
                          setEditingId(null)
                          setFormErrors({})
                        }}
                        className="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground px-4 py-2 rounded-lg transition-colors font-medium text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Report Form Modal */}
            {showReportForm && user?.role === "doctor" && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-card rounded-lg shadow-lg border border-border p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                  <h2 className="text-xl font-bold mb-4 text-foreground">Create Appointment Report</h2>
                  <form onSubmit={handleCreateReport} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Procedures *</label>
                      <textarea
                        placeholder="List procedures performed (one per line)..."
                        value={reportData.procedures.join("\n")}
                        onChange={(e) => {
                          setReportData({
                            ...reportData,
                            procedures: e.target.value.split("\n").filter(Boolean),
                          })
                          setReportErrors({ ...reportErrors, procedures: "" })
                        }}
                        className={`w-full px-4 py-2 bg-input border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm ${
                          reportErrors.procedures ? "border-destructive" : "border-border"
                        }`}
                        rows={3}
                      />
                      {reportErrors.procedures && (
                        <p className="text-xs text-destructive mt-1">{reportErrors.procedures}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Findings *</label>
                      <textarea
                        placeholder="Clinical findings..."
                        value={reportData.findings}
                        onChange={(e) => {
                          setReportData({ ...reportData, findings: e.target.value })
                          setReportErrors({ ...reportErrors, findings: "" })
                        }}
                        className={`w-full px-4 py-2 bg-input border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm ${
                          reportErrors.findings ? "border-destructive" : "border-border"
                        }`}
                        rows={3}
                      />
                      {reportErrors.findings && (
                        <p className="text-xs text-destructive mt-1">{reportErrors.findings}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Notes *</label>
                      <textarea
                        placeholder="Additional notes..."
                        value={reportData.notes}
                        onChange={(e) => {
                          setReportData({ ...reportData, notes: e.target.value })
                          setReportErrors({ ...reportErrors, notes: "" })
                        }}
                        className={`w-full px-4 py-2 bg-input border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm ${
                          reportErrors.notes ? "border-destructive" : "border-border"
                        }`}
                        rows={2}
                      />
                      {reportErrors.notes && <p className="text-xs text-destructive mt-1">{reportErrors.notes}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Next Visit</label>
                      <input
                        type="date"
                        value={reportData.nextVisit}
                        onChange={(e) => setReportData({ ...reportData, nextVisit: e.target.value })}
                        className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Follow-up Details</label>
                      <textarea
                        placeholder="Follow-up details..."
                        value={reportData.followUpDetails}
                        onChange={(e) => setReportData({ ...reportData, followUpDetails: e.target.value })}
                        className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm"
                        rows={2}
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground px-4 py-2 rounded-lg transition-colors font-medium text-sm"
                      >
                        Create Report
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowReportForm(false)
                          setReportErrors({})
                          setSelectedAppointment(null)
                        }}
                        className="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground px-4 py-2 rounded-lg transition-colors font-medium text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
