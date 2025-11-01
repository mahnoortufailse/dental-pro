//@ts-nocheck
"use client"

import type React from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/components/auth-context"
import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { Plus, Loader2 } from "lucide-react"
import { AppointmentActionModal } from "@/components/appointment-action-modal"
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal"
import { SearchableDropdown } from "@/components/searchable-dropdown"
import { AppointmentsTableView } from "@/components/appointments-table-view"
import { useRouter } from "next/navigation"
import { StatCard } from "@/components/appointment-stats-card"
import { Calendar, Clock, CheckCircle2, XCircle } from "lucide-react"

export default function AppointmentsTablePage() {
  const { user, token } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [showReportForm, setShowReportForm] = useState(false)
  const [appointmentActionModal, setAppointmentActionModal] = useState<{
    isOpen: boolean
    action: "close" | "cancel" | null
    appointmentId: string | null
  }>({
    isOpen: false,
    action: null,
    appointmentId: null,
  })
  const [formData, setFormData] = useState({
    patientId: "",
    patientName: "",
    doctorId: "",
    doctorName: "",
    date: "",
    time: "",
    type: "Consultation",
    roomNumber: "",
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
  const [loading, setLoading] = useState({
    appointments: false,
    patients: false,
    doctors: false,
    addAppointment: false,
    updateAppointment: false,
    deleteAppointment: false,
    cancelAppointment: false,
    completeAppointment: false,
    createReport: false,
  })
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [appointmentToDelete, setAppointmentToDelete] = useState<any>(null)
  const router = useRouter()

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
    setLoading((prev) => ({ ...prev, appointments: true }))
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
    } finally {
      setLoading((prev) => ({ ...prev, appointments: false }))
    }
  }

  const fetchPatients = async () => {
    setLoading((prev) => ({ ...prev, patients: true }))
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
    } finally {
      setLoading((prev) => ({ ...prev, patients: false }))
    }
  }

  const fetchDoctors = async () => {
    setLoading((prev) => ({ ...prev, doctors: true }))
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
    } finally {
      setLoading((prev) => ({ ...prev, doctors: false }))
    }
  }

  const getSelectedPatient = () => {
    return formData.patientId ? patients.find((p) => p._id === formData.patientId) : null
  }

  const getSelectedDoctor = () => {
    return formData.doctorId ? doctors.find((d) => d.id === formData.doctorId) : null
  }

  const handlePatientSelect = (patient: any) => {
    if (patient) {
      setFormData({
        ...formData,
        patientId: patient._id,
        patientName: patient.name,
      })
      setFormErrors({ ...formErrors, patientId: "" })
    } else {
      setFormData({
        ...formData,
        patientId: "",
        patientName: "",
      })
    }
  }

  const handleDoctorSelect = (doctor: any) => {
    if (doctor) {
      setFormData({
        ...formData,
        doctorId: doctor.id,
        doctorName: doctor.name,
      })
      setFormErrors({ ...formErrors, doctorId: "" })
    } else {
      setFormData({
        ...formData,
        doctorId: "",
        doctorName: "",
      })
    }
  }

  const handleDeleteAppointment = async (appointmentId: string) => {
    setLoading((prev) => ({ ...prev, deleteAppointment: true }))
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
    } finally {
      setLoading((prev) => ({ ...prev, deleteAppointment: false }))
    }
  }

  const handleCancelAppointment = async (appointmentId: string) => {
    setLoading((prev) => ({ ...prev, cancelAppointment: true }))
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "cancelled" }),
      })

      if (res.ok) {
        const data = await res.json()
        setAppointments(
          appointments.map((a) => (a._id === appointmentId || a.id === appointmentId ? data.appointment : a)),
        )
        toast.success("Appointment cancelled successfully")
        setAppointmentActionModal({ isOpen: false, action: null, appointmentId: null })
      } else {
        const errorData = await res.json()
        toast.error(errorData.error || "Failed to cancel appointment")
      }
    } catch (error) {
      console.error("Failed to cancel appointment:", error)
      toast.error("Error cancelling appointment")
    } finally {
      setLoading((prev) => ({ ...prev, cancelAppointment: false }))
    }
  }

  const handleCompleteAppointment = async (appointmentId: string) => {
    setLoading((prev) => ({ ...prev, completeAppointment: true }))
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: "completed" }),
      })

      if (res.ok) {
        const data = await res.json()
        setAppointments(
          appointments.map((a) => (a._id === appointmentId || a.id === appointmentId ? data.appointment : a)),
        )
        toast.success("Appointment marked as completed")
        setAppointmentActionModal({ isOpen: false, action: null, appointmentId: null })
      } else {
        const errorData = await res.json()
        toast.error(errorData.error || "Failed to complete appointment")
      }
    } catch (error) {
      console.error("Failed to complete appointment:", error)
      toast.error("Error completing appointment")
    } finally {
      setLoading((prev) => ({ ...prev, completeAppointment: false }))
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
      roomNumber: appointment.roomNumber,
      duration: appointment.duration && !isNaN(appointment.duration) ? appointment.duration : 30,
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
    if (!formData.roomNumber.trim()) {
      errors.roomNumber = "Room Number is required"
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

    const timeConflict = appointments.some((apt) => {
      if (editingId && (apt._id === editingId || apt.id === editingId)) {
        return false
      }
      if (apt.status === "cancelled" || apt.status === "closed" || apt.status === "completed") {
        return false
      }

      if (apt.doctorId !== formData.doctorId || apt.date !== formData.date) {
        return false
      }

      const aptStartMin = timeToMinutes(apt.time)
      const aptDuration = apt.duration || 30
      const aptEndMin = aptStartMin + aptDuration

      const newStartMin = timeToMinutes(formData.time)
      const newDuration = formData.duration || 30
      const newEndMin = newStartMin + newDuration

      return newStartMin < aptEndMin && aptStartMin < newEndMin
    })

    if (timeConflict) {
      const conflictingApt = appointments.find((apt) => {
        if (editingId && (apt._id === editingId || apt.id === editingId)) {
          return false
        }
        if (apt.status === "cancelled" || apt.status === "closed" || apt.status === "completed") {
          return false
        }
        if (apt.doctorId !== formData.doctorId || apt.date !== formData.date) {
          return false
        }

        const aptStartMin = timeToMinutes(apt.time)
        const aptDuration = apt.duration || 30
        const aptEndMin = aptStartMin + aptDuration

        const newStartMin = timeToMinutes(formData.time)
        const newDuration = formData.duration || 30
        const newEndMin = newStartMin + newDuration

        return newStartMin < aptEndMin && aptStartMin < newEndMin
      })

      if (conflictingApt) {
        const aptStartMin = timeToMinutes(conflictingApt.time)
        const aptDuration = conflictingApt.duration || 30
        const aptEndMin = aptStartMin + aptDuration

        const aptEndHours = Math.floor(aptEndMin / 60)
        const aptEndMins = aptEndMin % 60
        const aptEndTime = `${String(aptEndHours).padStart(2, "0")}:${String(aptEndMins).padStart(2, "0")}`

        const newStartMin = timeToMinutes(formData.time)
        const newDuration = formData.duration || 30
        const newEndMin = newStartMin + newDuration

        const newEndHours = Math.floor(newEndMin / 60)
        const newEndMins = newEndMin % 60
        const newEndTime = `${String(newEndHours).padStart(2, "0")}:${String(newEndMins).padStart(2, "0")}`

        toast.error(
          `Doctor ${formData.doctorName} has another appointment from ${conflictingApt.time} to ${aptEndTime} on ${formData.date}. Please choose a different time.`,
        )
      }
      return
    }
    
    const loadingKey = editingId ? "updateAppointment" : "addAppointment"
    setLoading((prev) => ({ ...prev, [loadingKey]: true }))

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
          roomNumber: "",
          duration: 30,
        })
      } else {
        const errorData = await res.json()
        if (res.status === 409) {
          toast.error(errorData.error || "Time slot is already booked for this doctor")
        } else {
          toast.error(errorData.error || "Failed to save appointment")
        }
      }
    } catch (error) {
      console.error("Failed to add appointment:", error)
      toast.error("Error saving appointment")
    } finally {
      setLoading((prev) => ({ ...prev, [loadingKey]: false }))
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

    setLoading((prev) => ({ ...prev, createReport: true }))
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
    } finally {
      setLoading((prev) => ({ ...prev, createReport: false }))
    }
  }

  const totalAppointments = appointments.length
  const confirmedAppointments = appointments.filter((apt) => apt.status === "confirmed").length
  const completedAppointments = appointments.filter((apt) => apt.status === "completed").length
  const cancelledAppointments = appointments.filter((apt) => apt.status === "cancelled").length

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto md:pt-0 pt-16">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Appointments Table</h1>
                <p className="text-muted-foreground text-sm mt-1">View and manage all appointments</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatCard label="Total Appointments" value={totalAppointments} icon={<Calendar className="w-6 h-6" />} />
              <StatCard
                label="Confirmed"
                value={confirmedAppointments}
                icon={<Clock className="w-6 h-6" />}
                variant="default"
              />
              <StatCard
                label="Completed"
                value={completedAppointments}
                icon={<CheckCircle2 className="w-6 h-6" />}
                variant="success"
              />
              <StatCard
                label="Cancelled"
                value={cancelledAppointments}
                icon={<XCircle className="w-6 h-6" />}
                variant="error"
              />
            </div>

            <div className="space-y-4">
              {user?.role !== "doctor" && (
                <button
                  onClick={() => {
                    setEditingId(null)
                    setShowForm(!showForm)
                    setFormErrors({})
                  }}
                  disabled={loading.appointments || loading.patients || loading.doctors}
                  className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground px-4 py-2 rounded-lg transition-colors font-medium cursor-pointer disabled:cursor-not-allowed"
                >
                  {loading.appointments || loading.patients || loading.doctors ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  New Appointment
                </button>
              )}
              <AppointmentsTableView
                appointments={appointments}
                userRole={user?.role || ""}
                loading={loading}
                onEdit={handleEditAppointment}
                onDelete={(apt) => {
                  setAppointmentToDelete(apt)
                  setShowDeleteModal(true)
                }}
                onCreateReport={(apt) => {
                  setSelectedAppointment(apt)
                  setShowReportForm(true)
                  setReportErrors({})
                }}
                onClose={(appointmentId) =>
                  setAppointmentActionModal({
                    isOpen: true,
                    action: "close",
                    appointmentId,
                  })
                }
                onCancel={(appointmentId) =>
                  setAppointmentActionModal({
                    isOpen: true,
                    action: "cancel",
                    appointmentId,
                  })
                }
              />
            </div>

            {showForm && user?.role !== "doctor" && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-card rounded-lg shadow-lg border border-border p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
                  <h2 className="text-xl font-bold mb-4 text-foreground">
                    {editingId ? "Edit Appointment" : "Schedule Appointment"}
                  </h2>
                  <form onSubmit={handleAddAppointment} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Patient *</label>
                      <SearchableDropdown
                        items={patients.map((p) => ({ ...p, id: p._id }))}
                        selectedItem={getSelectedPatient()}
                        onSelect={handlePatientSelect}
                        placeholder="Select Patient..."
                        searchPlaceholder="Search patients..."
                        disabled={loading.addAppointment || loading.updateAppointment}
                        error={formErrors.patientId}
                        required={true}
                        clearable={true}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Doctor *</label>
                      <SearchableDropdown
                        items={doctors}
                        selectedItem={getSelectedDoctor()}
                        onSelect={handleDoctorSelect}
                        placeholder="Select Doctor..."
                        searchPlaceholder="Search doctors..."
                        disabled={loading.addAppointment || loading.updateAppointment}
                        error={formErrors.doctorId}
                        required={true}
                        clearable={true}
                      />
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
                        disabled={loading.addAppointment || loading.updateAppointment}
                        className={`w-full px-4 py-2 bg-input border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm cursor-pointer disabled:cursor-not-allowed ${
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
                        disabled={loading.addAppointment || loading.updateAppointment}
                        className={`w-full px-4 py-2 bg-input border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm cursor-pointer disabled:cursor-not-allowed ${
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
                        disabled={loading.addAppointment || loading.updateAppointment}
                        className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm cursor-pointer disabled:cursor-not-allowed"
                      >
                        <option value="Consultation">Consultation</option>
                        <option value="Cleaning">Cleaning</option>
                        <option value="Filling">Filling</option>
                        <option value="Root Canal">Root Canal</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Room Number *</label>
                      <input
                        type="text"
                        placeholder="Room Number (e.g., Room 1)"
                        value={formData.roomNumber}
                        onChange={(e) => {
                          setFormData({ ...formData, roomNumber: e.target.value })
                          setFormErrors({ ...formErrors, roomNumber: "" })
                        }}
                        disabled={loading.addAppointment || loading.updateAppointment}
                        className={`w-full px-4 py-2 bg-input border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm cursor-pointer disabled:cursor-not-allowed ${
                          formErrors.roomNumber ? "border-destructive" : "border-border"
                        }`}
                      />
                      {formErrors.roomNumber && (
                        <p className="text-xs text-destructive mt-1">{formErrors.roomNumber}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Duration (minutes)</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.duration || 30}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            duration: Number.parseInt(e.target.value) || 30,
                          })
                        }
                        disabled={loading.addAppointment || loading.updateAppointment}
                        className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm cursor-pointer disabled:cursor-not-allowed"
                      />
                      {formErrors.duration && <p className="text-xs text-destructive mt-1">{formErrors.duration}</p>}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={loading.addAppointment || loading.updateAppointment}
                        className="flex-1 flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-accent-foreground px-4 py-2 rounded-lg transition-colors font-medium text-sm disabled:cursor-not-allowed cursor-pointer"
                      >
                        {(loading.addAppointment || loading.updateAppointment) && (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                        {editingId ? "Update" : "Schedule"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowForm(false)
                          setEditingId(null)
                          setFormErrors({})
                        }}
                        disabled={loading.addAppointment || loading.updateAppointment}
                        className="flex-1 bg-muted hover:bg-muted/80 disabled:bg-muted/50 text-muted-foreground px-4 py-2 rounded-lg transition-colors font-medium text-sm cursor-pointer disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

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
                        disabled={loading.createReport}
                        className={`w-full px-4 py-2 bg-input border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm cursor-pointer disabled:cursor-not-allowed ${
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
                          setReportData({
                            ...reportData,
                            findings: e.target.value,
                          })
                          setReportErrors({ ...reportErrors, findings: "" })
                        }}
                        disabled={loading.createReport}
                        className={`w-full px-4 py-2 bg-input border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm cursor-pointer disabled:cursor-not-allowed ${
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
                          setReportData({
                            ...reportData,
                            notes: e.target.value,
                          })
                          setReportErrors({ ...reportErrors, notes: "" })
                        }}
                        disabled={loading.createReport}
                        className={`w-full px-4 py-2 bg-input border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm cursor-pointer disabled:cursor-not-allowed ${
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
                        onChange={(e) =>
                          setReportData({
                            ...reportData,
                            nextVisit: e.target.value,
                          })
                        }
                        disabled={loading.createReport}
                        className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm cursor-pointer disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">Follow-up Details</label>
                      <textarea
                        placeholder="Follow-up details..."
                        value={reportData.followUpDetails}
                        onChange={(e) =>
                          setReportData({
                            ...reportData,
                            followUpDetails: e.target.value,
                          })
                        }
                        disabled={loading.createReport}
                        className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm cursor-pointer disabled:cursor-not-allowed"
                        rows={2}
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={loading.createReport}
                        className="flex-1 flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-accent-foreground px-4 py-2 rounded-lg transition-colors font-medium text-sm disabled:cursor-not-allowed cursor-pointer"
                      >
                        {loading.createReport && <Loader2 className="w-4 h-4 animate-spin" />}
                        {loading.createReport ? "Creating..." : "Create Report"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowReportForm(false)
                          setReportErrors({})
                          setSelectedAppointment(null)
                        }}
                        disabled={loading.createReport}
                        className="flex-1 bg-muted hover:bg-muted/80 disabled:bg-muted/50 text-muted-foreground px-4 py-2 rounded-lg transition-colors font-medium text-sm cursor-pointer disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <AppointmentActionModal
              isOpen={appointmentActionModal.isOpen}
              action={appointmentActionModal.action}
              appointmentPatientName={
                appointments.find((a) => (a._id || a.id) === appointmentActionModal.appointmentId)?.patientName
              }
              onConfirm={() => {
                if (appointmentActionModal.action === "close") {
                  handleCompleteAppointment(appointmentActionModal.appointmentId!)
                } else if (appointmentActionModal.action === "cancel") {
                  handleCancelAppointment(appointmentActionModal.appointmentId!)
                }
              }}
              onCancel={() =>
                setAppointmentActionModal({
                  isOpen: false,
                  action: null,
                  appointmentId: null,
                })
              }
              isLoading={loading.completeAppointment || loading.cancelAppointment}
            />

            <ConfirmDeleteModal
              isOpen={showDeleteModal}
              title="Delete Appointment"
              description="Are you sure you want to delete this appointment? This action cannot be undone."
              itemName={
                appointmentToDelete ? `${appointmentToDelete.patientName} - ${appointmentToDelete.date}` : undefined
              }
              onConfirm={() => {
                handleDeleteAppointment(appointmentToDelete._id || appointmentToDelete.id)
                setShowDeleteModal(false)
                setAppointmentToDelete(null)
              }}
              onCancel={() => {
                setShowDeleteModal(false)
                setAppointmentToDelete(null)
              }}
              isLoading={loading.deleteAppointment}
            />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}

// Helper function to convert time string to minutes
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}
