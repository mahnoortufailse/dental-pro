//@ts-nocheck
"use client"

import type React from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/components/auth-context"
import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { ChevronLeft, ChevronRight, Plus, FileText, X, CheckCircle, Loader2, AlertCircle } from "lucide-react"
import { AppointmentActionModal } from "@/components/appointment-action-modal"
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal"
import { SearchableDropdown } from "@/components/searchable-dropdown"
import { useRouter } from "next/navigation"
import { StatCard } from "@/components/appointment-stats-card"
import { Calendar, Clock, CheckCircle2, XCircle } from "lucide-react"
import { PatientReferralModal } from "@/components/patient-referral-modal"
import { ReferAppointmentModal } from "@/components/refer-appointment-modal"

export default function AppointmentsPage() {
  const { user, token } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [showReportForm, setShowReportForm] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [appointmentReports, setAppointmentReports] = useState<Record<string, boolean>>({})
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
    checkingReports: false,
  })
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [appointmentToDelete, setAppointmentToDelete] = useState<any>(null)
  const router = useRouter()

  const [showReferralModal, setShowReferralModal] = useState(false)

  const [showReferModal, setShowReferModal] = useState(false)
  const [selectedAppointmentForReferral, setSelectedAppointmentForReferral] = useState<any>(null)

  useEffect(() => {
    if (token) {
      fetchAppointments()
      fetchPatients()
      if (user?.role !== "doctor") {
        fetchDoctors()
      }
    }
  }, [token, user])

  useEffect(() => {
    if (appointments.length > 0 && user?.role === "doctor") {
      checkAppointmentReports()
    }
  }, [appointments, user])

  const checkAppointmentReports = async () => {
    setLoading((prev) => ({ ...prev, checkingReports: true }))
    try {
      const reportChecks: Record<string, boolean> = {}

      for (const apt of appointments) {
        const res = await fetch(`/api/appointment-reports?appointmentId=${apt._id || apt.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          // Report exists if there are any reports for this appointment, regardless of which doctor created it
          reportChecks[apt._id || apt.id] = data.reports && data.reports.length > 0
        }
      }

      setAppointmentReports(reportChecks)
    } catch (error) {
      console.error("Failed to check appointment reports:", error)
    } finally {
      setLoading((prev) => ({ ...prev, checkingReports: false }))
    }
  }

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

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = formatDateToLocalString(date)
    return appointments.filter((apt) => apt.date === dateStr)
  }

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const formatDateToLocalString = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  // Then update the functions:
  const handleDateClick = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    const dateStr = formatDateToLocalString(date)

    setSelectedDate(dateStr)
    setFormData({
      ...formData,
      date: dateStr,
    })
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
        const errorData = await res.json()
        toast.error(errorData.error || "Failed to delete appointment")
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
        body: JSON.JSON.stringify({ status: "closed" }),
      })

      if (res.ok) {
        const data = await res.json()
        setAppointments(
          appointments.map((a) => (a._id === appointmentId || a.id === appointmentId ? data.appointment : a)),
        )
        toast.success("Appointment closed successfully")
        setAppointmentActionModal({ isOpen: false, action: null, appointmentId: null })
        checkAppointmentReports()
      } else {
        const errorData = await res.json()
        toast.error(errorData.error || "Failed to close appointment")
      }
    } catch (error) {
      console.error("Failed to close appointment:", error)
      toast.error("Error closing appointment")
    } finally {
      setLoading((prev) => ({ ...prev, completeAppointment: false }))
    }
  }

  const currentUserId = user?.userId || user?.id

  const handleEditAppointment = (appointment: any) => {
    if (user?.role === "doctor" && String(appointment.doctorId) !== String(currentUserId)) {
      toast.error("You can only edit your own appointments")
      return
    }

    setEditingId(appointment._id || appointment.id)
    const doctorId = user?.role === "doctor" ? user.userId : appointment.doctorId
    const doctorName = user?.role === "doctor" ? user.name : appointment.doctorName

    setFormData({
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      doctorId: doctorId,
      doctorName: doctorName,
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

    // Only validate doctorId if user is not a doctor
    if (user?.role !== "doctor" && (!formData.doctorId || !String(formData.doctorId).trim())) {
      errors.doctorId = "Doctor is required"
    }

    if (!formData.date || !formData.date.trim()) {
      errors.date = "Date is required"
    } else {
      const selectedDate = new Date(formData.date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (selectedDate < today) {
        errors.date = "Cannot schedule appointments in the past"
      }
    }
    if (!formData.time || !formData.time.trim()) {
      errors.time = "Time is required"
    }
    if (!formData.roomNumber || !formData.roomNumber.trim()) {
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

    const finalDoctorId = user?.role === "doctor" ? String(user?.id) : String(formData.doctorId)
    const finalDoctorName = user?.role === "doctor" ? String(user?.name) : String(formData.doctorName)

    if (user?.role !== "doctor" && (!finalDoctorId || !String(finalDoctorId).trim())) {
      toast.error("Doctor is required")
      setFormErrors({ ...formErrors, doctorId: "Doctor is required" })
      return
    }

    if (!finalDoctorId) {
      toast.error("Doctor information is missing. Please try logging in again.")
      return
    }

    const submissionData = {
      patientId: formData.patientId,
      patientName: formData.patientName,
      doctorId: finalDoctorId,
      doctorName: finalDoctorName,
      date: formData.date,
      time: formData.time,
      type: formData.type,
      roomNumber: formData.roomNumber,
      duration: formData.duration || 30,
    }

    const timeConflict = appointments.some((apt) => {
      if (editingId && (apt._id === editingId || apt.id === editingId)) {
        return false
      }
      if (apt.status === "cancelled" || apt.status === "closed" || apt.status === "completed") {
        return false
      }

      if (apt.doctorId !== submissionData.doctorId || apt.date !== submissionData.date) {
        return false
      }

      const aptStartMin = timeToMinutes(apt.time)
      const aptDuration = apt.duration || 30
      const aptEndMin = aptStartMin + aptDuration

      const newStartMin = timeToMinutes(submissionData.time)
      const newDuration = submissionData.duration || 30
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
        if (apt.doctorId !== submissionData.doctorId || apt.date !== submissionData.date) {
          return false
        }

        const aptStartMin = timeToMinutes(apt.time)
        const aptDuration = apt.duration || 30
        const aptEndMin = aptStartMin + aptDuration

        const newStartMin = timeToMinutes(submissionData.time)
        const newDuration = submissionData.duration || 30
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

        const newStartMin = timeToMinutes(submissionData.time)
        const newDuration = submissionData.duration || 30
        const newEndMin = newStartMin + newDuration

        const newEndHours = Math.floor(newEndMin / 60)
        const newEndMins = newEndMin % 60
        const newEndTime = `${String(newEndHours).padStart(2, "0")}:${String(newEndMins).padStart(2, "0")}`

        toast.error(
          `Doctor ${submissionData.doctorName} has another appointment from ${conflictingApt.time} to ${aptEndTime} on ${submissionData.date}. Please choose a different time.`,
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
        body: JSON.stringify(submissionData),
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
          doctorId: user?.role === "doctor" ? user.userId : "", // Keep original logic here as it's for form reset
          doctorName: user?.role === "doctor" ? user.name : "", // Keep original logic here as it's for form reset
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
        checkAppointmentReports()
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "confirmed":
        return "bg-blue-100 text-blue-800"
      case "closed":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  const totalAppointments = appointments.length
  const confirmedAppointments = appointments.filter((apt) => apt.status === "confirmed").length
  const completedAppointments = appointments.filter((apt) => apt.status === "completed").length
  const cancelledAppointments = appointments.filter((apt) => apt.status === "cancelled").length

  // Added handler for referral modal
  const handleOpenReferModal = (appointment: any) => {
    if (appointment.isReferred && String(appointment.originalDoctorId) !== String(currentUserId)) {
      toast.error("This appointment is currently referred to another doctor and cannot be referred again by you.")
      return
    }

    setSelectedAppointmentForReferral(appointment)
    setShowReferModal(true)
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto md:pt-0 pt-16">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-8 flex flex-col sm:flex-col lg:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Appointments Calendar</h1>
                <p className="text-muted-foreground text-sm mt-1">View and manage appointments</p>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-card rounded-lg shadow-md border border-border p-6">
                  <div className="flex items-center justify-between mb-6">
                    <button
                      onClick={handlePreviousMonth}
                      disabled={loading.appointments}
                      className="p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-xl font-bold text-foreground">{monthName}</h2>
                    <button
                      onClick={handleNextMonth}
                      disabled={loading.appointments}
                      className="p-2 hover:bg-muted rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
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
                        ? formatDateToLocalString(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))
                        : null
                      const isSelected = dateStr === selectedDate

                      return (
                        <div
                          key={idx}
                          onClick={() => day && !loading.appointments && handleDateClick(day)}
                          className={`aspect-square p-2 rounded-lg border-2 transition-colors ${
                            day && !loading.appointments ? "cursor-pointer" : "cursor-not-allowed"
                          } ${
                            isSelected
                              ? "border-accent bg-accent/20"
                              : day
                                ? dayAppointments.length > 0
                                  ? "border-primary bg-primary/10"
                                  : "border-border hover:border-primary"
                                : "border-transparent"
                          } ${loading.appointments ? "opacity-50" : ""}`}
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

              <div className="space-y-6">
                <button
                  onClick={() => {
                    setEditingId(null)
                    setShowForm(!showForm)
                    setFormErrors({})
                    // Initialize formData for a new appointment, respecting user role
                    setFormData({
                      patientId: "",
                      patientName: "",
                      doctorId: user?.role === "doctor" ? user.userId : "",
                      doctorName: user?.role === "doctor" ? user.name : "",
                      date: "",
                      time: "",
                      type: "Consultation",
                      roomNumber: "",
                      duration: 30,
                    })
                  }}
                  disabled={loading.appointments || loading.patients || loading.doctors}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground px-4 py-2 rounded-lg transition-colors font-medium cursor-pointer disabled:cursor-not-allowed"
                >
                  {loading.appointments || loading.patients || loading.doctors ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  New Appointment
                </button>

                {user?.role === "doctor" && (
                  <button
                    onClick={() => setShowReferralModal(true)}
                    disabled={loading.appointments}
                    className="w-full flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/90 disabled:bg-secondary/50 text-secondary-foreground px-4 py-2 rounded-lg transition-colors font-medium cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4" />
                    Refer Unassigned Patient
                  </button>
                )}

                {selectedDate && (
                  <div className="bg-card rounded-lg shadow-md border border-border p-6">
                    <h3 className="font-bold text-foreground mb-4">
                      Appointments for {formatDateDisplay(selectedDate)}
                    </h3>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {loading.appointments ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : selectedDateAppointments.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No appointments on this date</p>
                      ) : (
                        selectedDateAppointments.map((apt) => {
                          const hasReport = appointmentReports[apt._id || apt.id]
                          const canClose = hasReport || apt.status === "closed"

                          const isOriginalDoctorWithReferral =
                            user?.role === "doctor" &&
                            String(apt.originalDoctorId) === String(currentUserId) &&
                            apt.isReferred === true

                          const isReferredDoctor =
                            user?.role === "doctor" &&
                            String(apt.doctorId) === String(currentUserId) &&
                            apt.isReferred === true

                          const canReferAppointment =
                            user?.role === "doctor" && !apt.isReferred && String(apt.doctorId) === String(currentUserId)

                          return (
                            <div key={apt._id || apt.id} className="p-3 bg-muted rounded-lg">
                              <div className="flex justify-between items-start gap-2 mb-2">
                                <p className="font-medium text-foreground text-sm">{apt.patientName} <br/>
                                {apt.isReferred && (
                                    <span className="text-xs rounded bg-purple-100 text-purple-800">
                                      {String(apt.originalDoctorId) === String(currentUserId)
                                        ? `Referred to ${apt.doctorName}`
                                        : "Referred In"}
                                    </span>
                                  )}</p>
                                <div className="flex flex-col gap-1">
                                  <span className={`text-xs px-2 py-1 rounded text-end ${getStatusColor(apt.status)}`}>
                                    {apt.status}
                                  </span>
                                 
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {apt.time} - {apt.type}
                              </p>
                              <p className="text-xs text-muted-foreground">Room: {apt.roomNumber}</p>
                              {user?.role === "doctor" && apt.status !== "cancelled" && apt.status !== "closed" && (
                                <div className="flex items-center gap-1 mt-1">
                                  {hasReport ? (
                                    <span className="text-xs text-green-600 flex items-center gap-1">
                                      <CheckCircle className="w-3 h-3" />
                                      Report created
                                    </span>
                                  ) : (
                                    <span className="text-xs text-amber-600 flex items-center gap-1">
                                      <AlertCircle className="w-3 h-3" />
                                      No report yet
                                    </span>
                                  )}
                                </div>
                              )}
                              <div className="flex gap-2 mt-2 flex-wrap">
                                {apt.status !== "completed" &&
                                  apt.status !== "closed" &&
                                  user?.role !== "doctor" &&
                                  apt.doctorId !== user.userId && (
                                    <button
                                      onClick={() => handleEditAppointment(apt)}
                                      disabled={
                                        loading.addAppointment || loading.updateAppointment || loading.deleteAppointment
                                      }
                                      className="text-xs text-primary hover:underline disabled:text-primary/50 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                      Edit
                                    </button>
                                  )}
                                {user?.role !== "doctor" && (
                                  <>
                                    {" "}
                                    <button
                                      onClick={() => {
                                        setAppointmentToDelete(apt)
                                        setShowDeleteModal(true)
                                      }}
                                      disabled={loading.deleteAppointment}
                                      className="text-xs text-destructive hover:underline disabled:text-destructive/50 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                      Delete
                                    </button>
                                  </>
                                )}
                                {user?.role !== "doctor" && (
                                  <button
                                    onClick={() => router.push(`/dashboard/appointments/${apt._id || apt.id}`)}
                                    disabled={loading.appointments}
                                    className="text-xs text-primary hover:underline disabled:text-primary/50 disabled:cursor-not-allowed cursor-pointer"
                                  >
                                    View Details
                                  </button>
                                )}

                                {user?.role === "doctor" && apt.status !== "cancelled" && apt.status !== "closed" && (
                                  <>
                                    {!isOriginalDoctorWithReferral && (
                                      <>
                                        {hasReport ? (
                                          <button
                                            onClick={() => router.push("/dashboard/medical-reports")}
                                            disabled={loading.createReport}
                                            className="text-xs text-primary hover:underline disabled:text-primary/50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                                          >
                                            <FileText className="w-3 h-3" />
                                            View Report
                                          </button>
                                        ) : (
                                          <button
                                            onClick={() => {
                                              setSelectedAppointment(apt)
                                              setShowReportForm(true)
                                              setReportErrors({})
                                            }}
                                            disabled={loading.createReport}
                                            className="text-xs text-primary hover:underline disabled:text-primary/50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                                          >
                                            <FileText className="w-3 h-3" />
                                            Create Report
                                          </button>
                                        )}
                                      </>
                                    )}

                                    {canReferAppointment && (
                                      <button
                                        onClick={() => handleOpenReferModal(apt)}
                                        disabled={loading.completeAppointment}
                                        className="text-xs text-accent hover:underline disabled:text-accent/50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                                      >
                                        <FileText className="w-3 h-3" />
                                        Refer to Doctor
                                      </button>
                                    )}

                                    {!isOriginalDoctorWithReferral && !isReferredDoctor && (
                                      <>
                                        <button
                                          onClick={() => {
                                            if (!canClose) {
                                              toast.error(
                                                "You cannot close this appointment. Please create a medical report first.",
                                              )
                                              return
                                            }
                                            setAppointmentActionModal({
                                              isOpen: true,
                                              action: "close",
                                              appointmentId: apt._id || apt.id,
                                            })
                                          }}
                                          disabled={loading.completeAppointment || !canClose}
                                          className={`text-xs hover:underline disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 ${
                                            canClose
                                              ? "text-green-600 disabled:text-green-600/50"
                                              : "text-muted-foreground"
                                          }`}
                                          title={
                                            !canClose ? "Create a medical report before closing" : "Close appointment"
                                          }
                                        >
                                          <CheckCircle className="w-3 h-3" />
                                          Close
                                        </button>

                                        <button
                                          onClick={() =>
                                            setAppointmentActionModal({
                                              isOpen: true,
                                              action: "cancel",
                                              appointmentId: apt._id || apt.id,
                                            })
                                          }
                                          disabled={loading.cancelAppointment}
                                          className="text-xs text-destructive hover:underline disabled:text-destructive/50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                                        >
                                          <X className="w-3 h-3" />
                                          Cancel
                                        </button>
                                      </>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-card rounded-lg shadow-md border border-border p-6">
                  <h3 className="font-bold text-foreground mb-4">Upcoming Appointments</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {loading.appointments ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : appointments.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No appointments scheduled</p>
                    ) : (
                      appointments.slice(0, 5).map((apt) => {
                        const hasReport = appointmentReports[apt._id || apt.id]
                        const canClose = hasReport || apt.status === "closed"

                        const isOriginalDoctorWithReferral =
                          user?.role === "doctor" &&
                          String(apt.originalDoctorId) === String(currentUserId) &&
                          apt.isReferred === true

                        const isReferredDoctor =
                          user?.role === "doctor" &&
                          String(apt.doctorId) === String(currentUserId) &&
                          apt.isReferred === true

                        const canReferAppointment =
                          user?.role === "doctor" && !apt.isReferred && String(apt.doctorId) === String(currentUserId)

                        return (
                          <div key={apt._id || apt.id} className="p-3 bg-muted rounded-lg">
                            <div className="flex justify-between items-start gap-2 mb-1">
                              <p className="font-medium text-foreground text-sm">{apt.patientName} <br/>
                                {apt.isReferred && (
                                    <span className="text-xs rounded bg-purple-100 text-purple-800">
                                      {String(apt.originalDoctorId) === String(currentUserId)
                                        ? `Referred to ${apt.doctorName}`
                                        : "Referred In"}
                                    </span>
                                  )}</p>
                              <div className="flex flex-col gap-1">
                                <span className={`text-xs px-2 py-1 rounded ${getStatusColor(apt.status)}`}>
                                  {apt.status}
                                </span>
                               
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {apt.date} at {apt.time}
                            </p>
                            <p className="text-xs text-muted-foreground">{apt.type}</p>
                            {user?.role === "doctor" && apt.status !== "cancelled" && apt.status !== "closed" && (
                              <div className="flex items-center gap-1 mt-1">
                                {hasReport ? (
                                  <span className="text-xs text-green-600 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    Report created
                                  </span>
                                ) : (
                                  <span className="text-xs text-amber-600 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    No report yet
                                  </span>
                                )}
                              </div>
                            )}
                            <div className="flex gap-2 mt-2 flex-wrap">
                              {apt.status !== "completed" && apt.status !== "closed" && user?.role !== "doctor" && (
                                <button
                                  onClick={() => handleEditAppointment(apt)}
                                  disabled={
                                    loading.addAppointment || loading.updateAppointment || loading.deleteAppointment
                                  }
                                  className="text-xs text-primary hover:underline disabled:text-primary/50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                  Edit
                                </button>
                              )}
                              {user?.role !== "doctor" && (
                                <>
                                  <button
                                    onClick={() => {
                                      setAppointmentToDelete(apt)
                                      setShowDeleteModal(true)
                                    }}
                                    disabled={loading.deleteAppointment}
                                    className="text-xs text-destructive hover:underline disabled:text-destructive/50 disabled:cursor-not-allowed cursor-pointer"
                                  >
                                    Delete
                                  </button>
                                  <button
                                    onClick={() => router.push(`/dashboard/appointments/${apt._id || apt.id}`)}
                                    disabled={loading.appointments}
                                    className="text-xs text-primary hover:underline disabled:text-primary/50 disabled:cursor-not-allowed cursor-pointer"
                                  >
                                    View Details
                                  </button>
                                </>
                              )}

                              {user?.role === "doctor" &&
                                apt.status !== "cancelled" &&
                                apt.status !== "completed" &&
                                apt.status !== "closed" && (
                                  <>
                                    {!isOriginalDoctorWithReferral && (
                                      <>
                                        {hasReport ? (
                                          <button
                                            onClick={() => router.push("/dashboard/medical-reports")}
                                            disabled={loading.createReport}
                                            className="text-xs text-primary hover:underline disabled:text-primary/50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                                          >
                                            <FileText className="w-3 h-3" />
                                            View Report
                                          </button>
                                        ) : (
                                          <button
                                            onClick={() => {
                                              setSelectedAppointment(apt)
                                              setShowReportForm(true)
                                              setReportErrors({})
                                            }}
                                            disabled={loading.createReport}
                                            className="text-xs text-primary hover:underline disabled:text-primary/50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                                          >
                                            <FileText className="w-3 h-3" />
                                            Create Report
                                          </button>
                                        )}
                                      </>
                                    )}

                                    {canReferAppointment && (
                                      <button
                                        onClick={() => handleOpenReferModal(apt)}
                                        disabled={loading.completeAppointment}
                                        className="text-xs text-accent hover:underline disabled:text-accent/50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                                      >
                                        <FileText className="w-3 h-3" />
                                        Refer to Doctor
                                      </button>
                                    )}

                                    {!isOriginalDoctorWithReferral && !isReferredDoctor && (
                                      <>
                                        <button
                                          onClick={() => {
                                            if (!canClose) {
                                              toast.error(
                                                "You cannot close this appointment. Please create a medical report first.",
                                              )
                                              return
                                            }
                                            setAppointmentActionModal({
                                              isOpen: true,
                                              action: "close",
                                              appointmentId: apt._id || apt.id,
                                            })
                                          }}
                                          disabled={loading.completeAppointment || !canClose}
                                          className={`text-xs hover:underline disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 ${
                                            canClose
                                              ? "text-green-600 disabled:text-green-600/50"
                                              : "text-muted-foreground"
                                          }`}
                                          title={
                                            !canClose ? "Create a medical report before closing" : "Close appointment"
                                          }
                                        >
                                          <CheckCircle className="w-3 h-3" />
                                          Close
                                        </button>

                                        <button
                                          onClick={() =>
                                            setAppointmentActionModal({
                                              isOpen: true,
                                              action: "cancel",
                                              appointmentId: apt._id || apt.id,
                                            })
                                          }
                                          disabled={loading.cancelAppointment}
                                          className="text-xs text-destructive hover:underline disabled:text-destructive/50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
                                        >
                                          <X className="w-3 h-3" />
                                          Cancel
                                        </button>
                                      </>
                                    )}
                                  </>
                                )}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            {showForm && (
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

                    {user?.role === "doctor" ? (
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Doctor</label>
                        <input
                          type="text"
                          value={user.name}
                          disabled
                          className="w-full px-4 py-2 bg-muted border border-border rounded-lg text-foreground text-sm cursor-not-allowed"
                        />
                      </div>
                    ) : (
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
                    )}

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

            {/* Referral Form Modal */}
            {showReferralModal && user?.role === "doctor" && (
              <PatientReferralModal
                isOpen={showReferralModal}
                onClose={() => setShowReferralModal(false)}
                onSuccess={() => {
                  // Optionally refresh data if needed
                }}
                token={token}
                doctoName={user?.name || ""}
              />
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

            <PatientReferralModal
              isOpen={showReferralModal}
              onClose={() => setShowReferralModal(false)}
              onSuccess={() => {
                // Optionally refresh data if needed
              }}
              token={token}
              doctoName={user?.name || ""}
            />

            {/* Added Refer Appointment Modal JSX */}
            {showReferModal && selectedAppointmentForReferral && (
              <ReferAppointmentModal
                isOpen={showReferModal}
                onClose={() => {
                  setShowReferModal(false)
                  setSelectedAppointmentForReferral(null)
                }}
                onSuccess={() => {
                  // Refresh appointments after successful referral
                  fetchAppointments()
                }}
                appointmentId={selectedAppointmentForReferral._id || selectedAppointmentForReferral.id}
                patientName={selectedAppointmentForReferral.patientName}
                token={token}
              />
            )}
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

function formatDateDisplay(dateStr: string): string {
  // Parse the date string as local date (YYYY-MM-DD)
  const [year, month, day] = dateStr.split("-").map(Number)
  const date = new Date(year, month - 1, day)

  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}
