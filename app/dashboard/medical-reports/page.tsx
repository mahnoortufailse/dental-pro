//@ts-nocheck
"use client"
import { ProtectedRoute } from "@/components/protected-route"
import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/components/auth-context"
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal"
import { generateReportPDF } from "@/lib/pdf-generator"
import { useState, useEffect, useRef, Suspense } from "react"
import { toast } from "react-hot-toast"
import {
  FileText,
  Eye,
  Trash2,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Edit2,
  Search,
  User,
} from "lucide-react"

function MedicalReportsContent() {
  const { user, token } = useAuth()
  const [reports, setReports] = useState([])
  const [allPatients, setAllPatients] = useState([])
  const [appointmentPatients, setAppointmentPatients] = useState([])
  const [appointments, setAppointments] = useState([])
  const [patientReportStatus, setPatientReportStatus] = useState({})
  const [loading, setLoading] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [filterPatient, setFilterPatient] = useState("")
  const [patients, setPatients] = useState([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [reportToDelete, setReportToDelete] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [patientSearch, setPatientSearch] = useState("") // Only patient search
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)
  const [selectedPatientName, setSelectedPatientName] = useState("")

  const [showEditModal, setShowEditModal] = useState(false)
  const [editingReport, setEditingReport] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [editFormData, setEditFormData] = useState({
    findings: "",
    notes: "",
    followUpDetails: "",
    nextVisitDate: "",
    nextVisitTime: "",
  })

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Refs for click outside detection
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    if (token) {
      fetchReports()
      fetchPatients()
      if (user?.role === "doctor") {
        fetchReportsAndPatients()
      } else {
        fetchReportsAndPatients()
      }
    }
  }, [token, user])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowPatientDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const fetchReportsAndPatients = async () => {
    try {
      const appointmentsRes = await fetch("/api/appointments", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (appointmentsRes.ok) {
        const appointmentsData = await appointmentsRes.json()
        const appointmentsList = appointmentsData.appointments || []
        setAppointments(appointmentsList)

        // Get unique patient IDs from appointments
        const patientIds = [...new Set(appointmentsList.map((apt: any) => apt.patientId))]

        // Fetch all patients to get their full details
        const patientsRes = await fetch("/api/patients", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (patientsRes.ok) {
          const patientsData = await patientsRes.json()
          const allPatientsList = patientsData.patients || []

          if (user?.role === "doctor") {
            const patientsWithAppointments = allPatientsList.filter((p: any) => patientIds.includes(p._id))
            setAppointmentPatients(patientsWithAppointments)
          } else {
            setAppointmentPatients(allPatientsList)
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch reports and patients:", error)
    }
  }

  const fetchReports = async () => {
    setLoading(true)
    try {
      const appointmentsRes = await fetch("/api/appointments", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!appointmentsRes.ok) {
        toast.error("Failed to fetch appointments")
        setLoading(false)
        return
      }

      const appointmentsData = await appointmentsRes.json()
      const appointmentsList = appointmentsData.appointments || []
      setAppointments(appointmentsList)

      const res = await fetch("/api/appointment-reports", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        const allReports = data.reports || []
        setReports(allReports)

        if (user?.role === "doctor") {
          const statusMap: any = {}

          // Get all appointments owned by the current doctor (not cancelled)
          const relevantAppointments = appointmentsList.filter((apt: any) => {
            const isOwner = String(apt.doctorId) === String(user.userId) || String(apt.doctorId) === String(user.id)
            const isOriginalOwner =
              String(apt.originalDoctorId) === String(user.userId) || String(apt.originalDoctorId) === String(user.id)
            const notCancelled = apt.status !== "cancelled" && apt.status !== "no-show"
            return (isOwner || isOriginalOwner) && notCancelled
          })

          // Mark all relevant appointments as pending initially
          relevantAppointments.forEach((apt: any) => {
            const aptId = apt.id || apt._id
            statusMap[aptId] = "pending"
          })

          allReports.forEach((report: any) => {
            const reportAppointmentId = report.appointmentId?._id || report.appointmentId
            if (reportAppointmentId) {
              // Check if this appointment belongs to the current doctor (or they're the original doctor)
              const appointment = relevantAppointments.find((apt: any) => {
                const aptId = apt._id || apt.id
                return String(aptId) === String(reportAppointmentId)
              })

              if (appointment) {
                statusMap[reportAppointmentId] = "created"
              }
            }
          })

          setPatientReportStatus(statusMap)
        }
      } else {
        toast.error("Failed to fetch reports")
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error)
      toast.error("Error fetching reports")
    } finally {
      setLoading(false)
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
        setAllPatients(data.patients || [])
      }
    } catch (error) {
      console.error("Failed to fetch patients:", error)
    }
  }

  const handleViewReport = (report: any) => {
    setSelectedReport(report)
    setShowReportModal(true)
  }

  const handleDeleteReport = async () => {
    if (!reportToDelete) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/appointment-reports/${reportToDelete._id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        setReports(reports.filter((r) => r._id !== reportToDelete._id))
        toast.success("Report deleted successfully")

        setShowDeleteModal(false)
        setLoading(true)
        setReportToDelete(null)
      } else {
        toast.error("Failed to delete report")
      }
    } catch (error) {
      console.error("Failed to delete report:", error)
      toast.error("Error deleting report")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEditReport = (report: any) => {
    setEditingReport(report)

    let nextVisitDate = ""
    let nextVisitTime = ""

    if (report.nextVisit) {
      const dateObj = new Date(report.nextVisit)
      nextVisitDate = dateObj.toISOString().split("T")[0]
      nextVisitTime = dateObj.toTimeString().slice(0, 5)
    }

    setEditFormData({
      findings: report.findings || "",
      notes: report.notes || "",
      followUpDetails: report.followUpDetails || "",
      nextVisitDate,
      nextVisitTime,
    })
    setShowEditModal(true)
  }

  const handleSaveEditReport = async () => {
    if (!editingReport) return

    setIsSaving(true)
    try {
      let nextVisitDateTime = null
      if (editFormData.nextVisitDate && editFormData.nextVisitTime) {
        try {
          const combinedDateTime = `${editFormData.nextVisitDate}T${editFormData.nextVisitTime}:00`
          nextVisitDateTime = new Date(combinedDateTime)
        } catch (error) {
          console.error("Error parsing datetime:", error)
          nextVisitDateTime = new Date(editFormData.nextVisitDate)
        }
      } else if (editFormData.nextVisitDate) {
        nextVisitDateTime = new Date(editFormData.nextVisitDate)
      }

      const res = await fetch(`/api/appointment-reports/${editingReport._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          findings: editFormData.findings,
          notes: editFormData.notes,
          followUpDetails: editFormData.followUpDetails,
          nextVisitDate: editFormData.nextVisitDate || null,
          nextVisitTime: editFormData.nextVisitTime || null,
        }),
      })

      if (res.ok) {
        const updatedReport = await res.json()
        setReports(reports.map((r) => (r._id === updatedReport._id ? updatedReport : r)))
        toast.success("Report updated successfully")
        setShowEditModal(false)
        setEditingReport(null)
      } else {
        toast.error("Failed to update report")
      }
    } catch (error) {
      console.error("Failed to update report:", error)
      toast.error("Error updating report")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownloadReport = (report: any) => {
    try {
      generateReportPDF(report)
      toast.success("Report downloaded successfully")
    } catch (error) {
      console.error("Failed to generate PDF:", error)
      toast.error("Failed to download report")
    }
  }

  // Handle patient selection from dropdown
  const handlePatientSelect = (patient: any) => {
    if (patient) {
      setFilterPatient(patient._id)
      setSelectedPatientName(patient.name)
      setPatientSearch(patient.name)
    } else {
      // Clear selection
      setFilterPatient("")
      setSelectedPatientName("")
      setPatientSearch("")
    }
    setShowPatientDropdown(false)
  }

  // Handle clear filter
  const handleClearFilter = () => {
    setFilterPatient("")
    setSelectedPatientName("")
    setPatientSearch("")
    setShowPatientDropdown(false)
  }

  // Filter patients for dropdown based on search
  const filteredPatients = allPatients.filter((p) => p.name.toLowerCase().includes(patientSearch.toLowerCase()))

  const getDisplayData = () => {
    if (user?.role === "doctor") {
      const patientMap: any = {}
      appointmentPatients.forEach((p: any) => {
        patientMap[p._id] = p
      })

      return Object.entries(patientReportStatus).map(([appointmentId, status]: [string, any]) => {
        const report = reports.find((r) => r.appointmentId?._id === appointmentId)

        const appointment = appointments.find((a: any) => {
          const aId = a._id || a.id
          return aId === appointmentId || aId?.toString() === appointmentId
        })

        let patientInfo = null
        if (report?.patientId) {
          patientInfo = report.patientId
        } else if (appointment?.patientId && patientMap[appointment.patientId]) {
          patientInfo = patientMap[appointment.patientId]
        }

        return {
          appointmentId,
          reportStatus: status,
          report: report,
          patientInfo: patientInfo,
          appointmentStatus: appointment?.status,
        }
      })
    }
    return reports
  }

  const displayData = getDisplayData()

  // Filter reports based only on patient filter
  const filteredReports = displayData.filter((item: any) => {
    // Apply patient filter only
    if (filterPatient) {
      const itemId = item._id || item.patientInfo?._id || item.appointmentId
      return itemId === filterPatient
    }

    // If no patient filter, show all
    return true
  })

  // Calculate pagination
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentReports = filteredReports.slice(startIndex, endIndex)

  // Reset to first page when search or items per page changes
  useEffect(() => {
    setCurrentPage(1)
  }, [patientSearch, itemsPerPage, filterPatient])

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto md:pt-0 pt-16">
        <div className="p-4 sm:p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {user?.role === "doctor" ? "Patient Medical Reports Status" : "Medical Reports"}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {user?.role === "doctor"
                ? "View all patients and their medical report status"
                : "View and manage appointment reports"}
            </p>
          </div>

          {/* Search and Filters - Patient Search Only */}
          <div className="bg-card rounded-lg shadow-md border border-border p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Patient Search Input with Dropdown */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search patients..."
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value)
                      setShowPatientDropdown(true)
                    }}
                    onFocus={() => setShowPatientDropdown(true)}
                    className="w-fit pl-10 pr-10 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                  />
                  {patientSearch && (
                    <button
                      onClick={handleClearFilter}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}

                  {/* Patient Search Dropdown */}
                  {showPatientDropdown && patientSearch && (
                    <div
                      ref={dropdownRef}
                      className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
                    >
                      {/* Patient Results Section */}
                      {filteredPatients.length > 0 ? (
                        <>
                          <div className="px-4 py-2 bg-muted/50 border-b border-border">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              <span className="text-xs font-semibold text-muted-foreground">
                                PATIENTS ({filteredPatients.length})
                              </span>
                            </div>
                          </div>
                          {filteredPatients.map((p) => (
                            <button
                              key={p._id}
                              type="button"
                              onClick={() => handlePatientSelect(p)}
                              className={`w-full text-left px-4 py-3 hover:bg-muted transition-colors text-sm text-foreground border-b border-border/50 ${
                                filterPatient === p._id ? "bg-primary/10 text-primary" : ""
                              }`}
                            >
                              <div className="font-medium flex items-center gap-2">
                                <User className="w-4 h-4" />
                                {p.name}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1 truncate">
                                {p.idNumber} • {p.email || "No email"}
                              </div>
                            </button>
                          ))}
                        </>
                      ) : (
                        <div className="px-4 py-4 text-center">
                          <User className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">No patients found matching "{patientSearch}"</p>
                        </div>
                      )}

                      {/* Clear Filter Option */}
                      {filterPatient && (
                        <button
                          type="button"
                          onClick={handleClearFilter}
                          className="w-full text-left px-4 py-3 hover:bg-muted transition-colors text-sm text-foreground border-t border-border"
                        >
                          <div className="font-medium flex items-center justify-between">
                            <span>Clear filter</span>
                            <X className="w-4 h-4" />
                          </div>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Help text */}
                {/* <p className="text-xs text-muted-foreground mt-2 ml-1">
                  {filterPatient
                    ? `Filtering by patient: ${selectedPatientName}`
                    : patientSearch
                      ? `Searching patients for: "${patientSearch}"`
                      : "Type to search patients"}
                </p> */}
              </div>

              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2">
                  <label htmlFor="itemsPerPage" className="text-sm text-muted-foreground whitespace-nowrap">
                    Rows:
                  </label>
                  <select
                    id="itemsPerPage"
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="px-2 py-1 bg-input border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary text-foreground text-sm"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </select>
                </div>

                <button
                  onClick={fetchReports}
                  disabled={loading}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 !py-1 rounded-lg transition-colors font-medium text-sm disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                  {loading ? "Loading..." : "Refresh"}
                </button>
              </div>
            </div>
          </div>

          {/* Reports/Patients List */}
          <div className="bg-card rounded-lg shadow-md border border-border overflow-hidden">
            {/* Loading State */}
            {loading && (
              <div className="p-8 text-center">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="flex justify-center items-center gap-2">
                    <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
                    <div
                      className="w-3 h-3 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-3 h-3 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                  <span className="text-muted-foreground text-sm">Loading...</span>
                </div>
              </div>
            )}

            {/* Content */}
            {!loading && (
              <>
                <div className="grid grid-cols-1 gap-4 p-4 sm:p-6">
                  {currentReports.length === 0 ? (
                    <div className="bg-muted/40 rounded-lg p-8 text-center">
                      <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground">
                        {filterPatient ? `No reports found for patient: ${selectedPatientName}` : "No data found"}
                      </p>
                      {filterPatient && (
                        <button onClick={handleClearFilter} className="mt-4 text-primary hover:underline text-sm">
                          Clear patient filter
                        </button>
                      )}
                    </div>
                  ) : user?.role === "doctor" ? (
                    currentReports.map((appointment: any) => (
                      <div
                        key={appointment.appointmentId}
                        className="bg-background rounded-lg border border-border p-4 sm:p-6 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-foreground truncate">
                              {appointment.patientInfo?.name || "Unknown Patient"}
                            </h3>
                            <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                              <span>Email: {appointment.patientInfo?.email || "N/A"}</span>
                              <span>Phone: {appointment.patientInfo?.phone || "N/A"}</span>
                              {appointment.report?.doctorId?.name && (
                                <span>Doctor: {appointment.report.doctorId.name}</span>
                              )}
                            </div>
                            <div className="mt-3">
                              <span
                                className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                  appointment.reportStatus === "created"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                }`}
                              >
                                {appointment.reportStatus === "created" ? "✓ Report Created" : "⏳ Pending Report"}
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                            {appointment.report && (
                              <>
                                <button
                                  onClick={() => handleViewReport(appointment.report)}
                                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-3 sm:px-4 py-2 rounded-lg transition-colors font-medium text-sm cursor-pointer"
                                >
                                  <Eye className="w-4 h-4" />
                                  <span className="hidden sm:inline">View</span>
                                </button>
                                {appointment.appointmentStatus !== "completed" && (
                                  <button
                                    onClick={() => handleEditReport(appointment.report)}
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors font-medium text-sm cursor-pointer"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                    <span className="hidden sm:inline">Edit</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDownloadReport(appointment.report)}
                                  className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-accent-foreground px-3 sm:px-4 py-2 rounded-lg transition-colors font-medium text-sm cursor-pointer"
                                >
                                  <Download className="w-4 h-4" />
                                  <span className="hidden sm:inline">Download</span>
                                </button>
                                {appointment.appointmentStatus !== "completed" && (
                                  <button
                                    onClick={() => {
                                      setReportToDelete(appointment.report)
                                      setShowDeleteModal(true)
                                    }}
                                    className="flex items-center gap-2 bg-destructive hover:bg-destructive/90 px-3 sm:px-4 py-2 rounded-lg transition-colors font-medium text-sm cursor-pointer text-white"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    <span className="hidden sm:inline">Delete</span>
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    // This is the section to be updated with the new report card
                    reports.length > 0 && (
                      <div className="space-y-3">
                        {currentReports.map((report) => (
                          <div
                            key={report._id}
                            className="flex items-center justify-between p-4 bg-card border border-border rounded-lg hover:shadow-md transition-shadow"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <User className="w-4 h-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-foreground">
                                  {report.patientId?.name || "Unknown Patient"}
                                </span>
                                <span
                                  className={`text-xs font-semibold px-2 py-0.5 rounded ${
                                    report.doctorRole === "referred"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {report.doctorRole === "referred" ? "Referred Doctor" : "Original Doctor"}
                                </span>
                              </div>
                              {report.previousReportId && (
                                <p className="text-blue-600 dark:text-blue-400 font-medium text-xs mb-1">
                                  ↳ References previous report from{" "}
                                  {report.previousReportId?.doctorName || "previous doctor"}
                                </p>
                              )}
                              {report.reportStatus && (
                                <p className="mb-1">
                                  <strong>Status:</strong>{" "}
                                  <span
                                    className={`capitalize text-xs font-semibold px-1.5 py-0.5 rounded inline-block ${
                                      report.reportStatus === "submitted"
                                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                        : report.reportStatus === "reviewed"
                                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                                          : report.reportStatus === "approved"
                                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
                                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                                    }`}
                                  >
                                    {report.reportStatus}
                                  </span>
                                </p>
                              )}
                              <div className="text-xs text-muted-foreground space-y-1">
                                <p>
                                  <strong>Doctor:</strong> {report.doctorName || report.doctorId?.name}
                                </p>
                                <p>
                                  <strong>Findings:</strong> {report.findings?.substring(0, 50)}...
                                </p>
                                <p>
                                  <strong>Created:</strong> {new Date(report.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => handleViewReport(report)}
                                className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                                title="View Report"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {String(report.doctorId._id || report.doctorId) === String(user?.userId || user?.id) && (
                                <button
                                  onClick={() => handleEditReport(report)}
                                  className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                                  title="Edit Report"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              )}
                              {String(report.doctorId._id || report.doctorId) === String(user?.userId || user?.id) && (
                                <button
                                  onClick={() => {
                                    setReportToDelete(report)
                                    setShowDeleteModal(true)
                                  }}
                                  className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-red-500"
                                  title="Delete Report"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  generateReportPDF(report)
                                  toast.success("Downloading PDF...")
                                }}
                                className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                                title="Download as PDF"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                    // </CHANGE>
                  )}
                </div>

                {/* Pagination */}
                {filteredReports.length > 0 && (
                  <div className="px-4 sm:px-6 py-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-muted-foreground">
                      Showing <span className="font-medium">{filteredReports.length === 0 ? 0 : startIndex + 1}</span>{" "}
                      to <span className="font-medium">{Math.min(endIndex, filteredReports.length)}</span> of{" "}
                      <span className="font-medium">{filteredReports.length}</span> results
                      {filterPatient && <span className="ml-2 text-primary">• Filtered by: {selectedPatientName}</span>}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded border border-border bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                          .map((page, index, array) => {
                            const showEllipsis = index < array.length - 1 && array[index + 1] - page > 1
                            return (
                              <div key={page} className="flex items-center">
                                <button
                                  onClick={() => setCurrentPage(page)}
                                  className={`min-w-[2rem] h-8 px-2 rounded text-sm font-medium transition-colors ${
                                    currentPage === page
                                      ? "bg-primary text-primary-foreground"
                                      : "bg-background text-foreground hover:bg-muted border border-border"
                                  }`}
                                >
                                  {page}
                                </button>
                                {showEllipsis && <span className="px-1 text-muted-foreground">...</span>}
                              </div>
                            )
                          })}
                      </div>

                      <button
                        onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="p-2 rounded border border-border bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* View Report Modal */}
          {showReportModal && selectedReport && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50 animate-in fade-in duration-200">
              <div className="bg-card rounded-xl shadow-2xl border border-border w-full max-w-3xl max-h-[95vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="flex justify-between items-start p-6 sm:p-8 border-b border-border sticky top-0 bg-gradient-to-r from-card to-muted/30">
                  <div className="min-w-0 pr-4">
                    <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Medical Report</h2>
                    <p className="text-sm text-muted-foreground mt-2">
                      Generated on{" "}
                      {new Date(selectedReport.createdAt).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-2 hover:bg-muted rounded-lg flex-shrink-0"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>

                <div className="p-6 sm:p-8 space-y-6 sm:space-y-8">
                  {/* Patient Info */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-50/50 dark:from-blue-950/20 dark:to-blue-950/10 rounded-xl p-5 sm:p-6 border border-blue-200 dark:border-blue-800">
                    <h3 className="font-bold text-foreground mb-4 text-base sm:text-lg flex items-center gap-2">
                      <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
                      Patient Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                      <div>
                        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Full Name</p>
                        <p className="text-foreground font-semibold mt-2 text-sm sm:text-base truncate">
                          {selectedReport.patientId?.name || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Email</p>
                        <p className="text-foreground font-semibold mt-2 text-sm sm:text-base truncate">
                          {selectedReport.patientId?.email || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Phone</p>
                        <p className="text-foreground font-semibold mt-2 text-sm sm:text-base truncate">
                          {selectedReport.patientId?.phone || "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Doctor Info */}
                  <div className="bg-gradient-to-br from-green-50 to-green-50/50 dark:from-green-950/20 dark:to-green-950/10 rounded-xl p-5 sm:p-6 border border-green-200 dark:border-green-800">
                    <h3 className="font-bold text-foreground mb-4 text-base sm:text-lg flex items-center gap-2">
                      <span className="w-1 h-6 bg-green-600 rounded-full"></span>
                      Attending Physician
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      <div>
                        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Name</p>
                        <p className="text-foreground font-semibold mt-2 text-sm sm:text-base truncate">
                          {selectedReport.doctorId?.name || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Specialty</p>
                        <p className="text-foreground font-semibold mt-2 text-sm sm:text-base truncate">
                          {selectedReport.doctorId?.specialty || "General Dentistry"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Report Details */}
                  <div className="space-y-5">
                    <h3 className="font-bold text-foreground text-base sm:text-lg flex items-center gap-2">
                      <span className="w-1 h-6 bg-primary rounded-full"></span>
                      Clinical Findings
                    </h3>

                    {selectedReport.procedures && selectedReport.procedures.length > 0 && (
                      <div className="bg-muted/40 rounded-xl p-5 sm:p-6 border border-border">
                        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide mb-3">
                          Procedures Performed
                        </p>
                        <ul className="text-foreground space-y-2">
                          {selectedReport.procedures.map((p: any, idx: number) => (
                            <li key={idx} className="flex items-start gap-3 text-sm sm:text-base">
                              <span className="text-primary font-bold flex-shrink-0 mt-0.5">✓</span>
                              <span className="break-words font-medium">{p.name}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedReport.findings && (
                      <div className="bg-muted/40 rounded-xl p-5 sm:p-6 border border-border">
                        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide mb-3">
                          Clinical Findings
                        </p>
                        <p className="text-foreground text-sm sm:text-base whitespace-pre-wrap break-words leading-relaxed">
                          {selectedReport.findings}
                        </p>
                      </div>
                    )}

                    {selectedReport.notes && (
                      <div className="bg-muted/40 rounded-xl p-5 sm:p-6 border border-border">
                        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide mb-3">
                          Additional Notes
                        </p>
                        <p className="text-foreground text-sm sm:text-base whitespace-pre-wrap break-words leading-relaxed">
                          {selectedReport.notes}
                        </p>
                      </div>
                    )}

                    {selectedReport.nextVisit && (
                      <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-5 sm:p-6 border border-amber-200 dark:border-amber-800">
                        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide mb-2">
                          Recommended Next Visit
                        </p>
                        <p className="text-foreground font-semibold text-sm sm:text-base">
                          {new Date(selectedReport.nextVisit).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                          {selectedReport.nextVisitTime && (
                            <>
                              <span className="text-muted-foreground mx-2">•</span>
                              <span className="text-foreground font-semibold">
                                {new Date(`2000-01-01T${selectedReport.nextVisitTime}`).toLocaleTimeString("en-US", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                    )}

                    {selectedReport.followUpDetails && (
                      <div className="bg-purple-50 dark:bg-purple-950/20 rounded-xl p-5 sm:p-6 border border-purple-200 dark:border-purple-800">
                        <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide mb-3">
                          Follow-up Instructions
                        </p>
                        <p className="text-foreground text-sm sm:text-base whitespace-pre-wrap break-words leading-relaxed">
                          {selectedReport.followUpDetails}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex flex-col xs:flex-row gap-3 p-6 sm:p-8 border-t border-border bg-muted/30">
                  <button
                    onClick={() => handleDownloadReport(selectedReport)}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-3 rounded-lg transition-colors font-semibold cursor-pointer text-sm sm:text-base"
                  >
                    <Download className="w-4 h-4" />
                    Download Report
                  </button>
                  <button
                    onClick={() => setShowReportModal(false)}
                    className="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground px-4 py-3 rounded-lg transition-colors font-semibold cursor-pointer text-sm sm:text-base"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Report Modal */}
          {showEditModal && editingReport && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50 animate-in fade-in duration-200">
              <div className="bg-card rounded-xl shadow-2xl border border-border w-full max-w-2xl max-h-[95vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="flex justify-between items-start p-6 sm:p-8 border-b border-border sticky top-0 bg-gradient-to-r from-card to-muted/30">
                  <div className="min-w-0 pr-4">
                    <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Edit Medical Report</h2>
                    <p className="text-sm text-muted-foreground mt-2">
                      Update report details for {editingReport.patientId?.name}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowEditModal(false)
                      setEditingReport(null)
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-2 hover:bg-muted rounded-lg flex-shrink-0"
                  >
                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                  {/* Findings */}
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Clinical Findings</label>
                    <textarea
                      value={editFormData.findings}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          findings: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm min-h-[120px]"
                      placeholder="Enter clinical findings..."
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Additional Notes</label>
                    <textarea
                      value={editFormData.notes}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          notes: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm min-h-[120px]"
                      placeholder="Enter additional notes..."
                    />
                  </div>

                  {/* Follow-up Details */}
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-2">Follow-up Instructions</label>
                    <textarea
                      value={editFormData.followUpDetails}
                      onChange={(e) =>
                        setEditFormData({
                          ...editFormData,
                          followUpDetails: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm min-h-[100px]"
                      placeholder="Enter follow-up instructions..."
                    />
                  </div>

                  {/* Next Visit Date and Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">Next Visit Date</label>
                      <input
                        type="date"
                        value={editFormData.nextVisitDate}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            nextVisitDate: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2">Next Visit Time</label>
                      <input
                        type="time"
                        value={editFormData.nextVisitTime}
                        onChange={(e) =>
                          setEditFormData({
                            ...editFormData,
                            nextVisitTime: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex flex-col xs:flex-row gap-3 p-6 sm:p-8 border-t border-border bg-muted/30">
                  <button
                    onClick={handleSaveEditReport}
                    disabled={isSaving}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-3 rounded-lg transition-colors font-semibold cursor-pointer text-sm sm:text-base disabled:opacity-50"
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={() => {
                      setShowEditModal(false)
                      setEditingReport(null)
                    }}
                    className="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground px-4 py-3 rounded-lg transition-colors font-semibold cursor-pointer text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Confirm Delete Modal */}
          <ConfirmDeleteModal
            isOpen={showDeleteModal}
            title="Delete Medical Report"
            description="Are you sure you want to delete this medical report? This action cannot be undone."
            itemName={reportToDelete ? `Report for ${reportToDelete.patientId?.name}` : undefined}
            onConfirm={handleDeleteReport}
            onCancel={() => {
              setShowDeleteModal(false)
              setReportToDelete(null)
            }}
            isLoading={isDeleting}
          />
        </div>
      </main>
    </div>
  )
}

export default function MedicalReportsPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={null}>
        <MedicalReportsContent />
      </Suspense>
    </ProtectedRoute>
  )
}
