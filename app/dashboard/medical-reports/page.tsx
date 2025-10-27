//@ts-nocheck
"use client"
import { ProtectedRoute } from "@/components/protected-route"
import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/components/auth-context"
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal"
import { generateReportPDF } from "@/lib/pdf-generator"
import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { FileText, Eye, Trash2, Download, X } from "lucide-react"

export default function MedicalReportsPage() {
  const { user, token } = useAuth()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [filterPatient, setFilterPatient] = useState("")
  const [patients, setPatients] = useState([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [reportToDelete, setReportToDelete] = useState<any>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [patientSearch, setPatientSearch] = useState("")
  const [showPatientDropdown, setShowPatientDropdown] = useState(false)

  useEffect(() => {
    if (token) {
      fetchReports()
      if (user?.role !== "doctor") {
        fetchPatients()
      }
    }
  }, [token, user])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/appointment-reports", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setReports(data.reports || [])
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

  const handleDownloadReport = (report: any) => {
    try {
      generateReportPDF(report)
      toast.success("Report downloaded successfully")
    } catch (error) {
      console.error("Failed to generate PDF:", error)
      toast.error("Failed to download report")
    }
  }

  const filteredPatients = patients.filter((p) => p.name.toLowerCase().includes(patientSearch.toLowerCase()))

  const filteredReports = filterPatient ? reports.filter((r) => r.patientId?._id === filterPatient) : reports

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto md:pt-0 pt-16">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Medical Reports</h1>
              <p className="text-muted-foreground text-sm mt-1">View and manage appointment reports</p>
            </div>

          {/* Filters */}
<div className="mb-6 flex flex-col sm:flex-row gap-4">
  
    <div className="relative">
      <input
        type="text"
        placeholder="Search patient..."
        value={patientSearch}
        onChange={(e) => {
          setPatientSearch(e.target.value)
          setShowPatientDropdown(true)
        }}
        onFocus={() => setShowPatientDropdown(true)}
        className="w-48 px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm cursor-text"
      />
      {showPatientDropdown && filteredPatients.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
          <button
            type="button"
            onClick={() => {
              setFilterPatient("")
              setPatientSearch("")
              setShowPatientDropdown(false)
            }}
            className="w-full text-left px-4 py-2 hover:bg-muted transition-colors text-sm text-foreground border-b border-border"
          >
            All Patients
          </button>
          {filteredPatients.map((p) => (
            <button
              key={p._id}
              type="button"
              onClick={() => {
                setFilterPatient(p._id)
                setPatientSearch(p.name)
                setShowPatientDropdown(false)
              }}
              className="w-full text-left px-4 py-2 hover:bg-muted transition-colors text-sm text-foreground"
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
 
  <button
    onClick={fetchReports}
    disabled={loading}
    className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors font-medium text-sm disabled:opacity-50 h-fit cursor-pointer"
  >
    {loading ? "Loading..." : "Refresh"}
  </button>
</div>

            {/* Reports List */}
            <div className="grid grid-cols-1 gap-4">
              {filteredReports.length === 0 ? (
                <div className="bg-card rounded-lg shadow-md border border-border p-8 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground">No reports found</p>
                </div>
              ) : (
                filteredReports.map((report) => (
                  <div
                    key={report._id}
                    className="bg-card rounded-lg shadow-md border border-border p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground">
                          {report.patientId?.name || "Unknown Patient"}
                        </h3>
                        <p className="text-sm text-muted-foreground">Doctor: {report.doctorId?.name || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">
                          Date: {new Date(report.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          <span className="font-medium">Procedures:</span>{" "}
                          {report.procedures?.map((p: any) => p.name).join(", ") || "N/A"}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                        <button
                          onClick={() => handleViewReport(report)}
                          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors font-medium text-sm cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button
                          onClick={() => handleDownloadReport(report)}
                          className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-accent-foreground px-4 py-2 rounded-lg transition-colors font-medium text-sm cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </button>
                        <button
                          onClick={() => {
                            setReportToDelete(report)
                            setShowDeleteModal(true)
                          }}
                          className="flex items-center gap-2 bg-destructive hover:bg-destructive/90 px-4 py-2 rounded-lg transition-colors font-medium text-sm cursor-pointer text-white"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Report Detail Modal - Enhanced Design */}
            {showReportModal && selectedReport && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-2 sm:p-4 z-50 animate-in fade-in duration-200">
                <div className="bg-card rounded-xl shadow-2xl border border-border w-full max-w-3xl max-h-[95vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                  {/* Modal Header - Professional */}
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
                    {/* Patient Info - Professional Card */}
                    <div className="bg-gradient-to-br from-blue-50 to-blue-50/50 dark:from-blue-950/20 dark:to-blue-950/10 rounded-xl p-5 sm:p-6 border border-blue-200 dark:border-blue-800">
                      <h3 className="font-bold text-foreground mb-4 text-base sm:text-lg flex items-center gap-2">
                        <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
                        Patient Information
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                        <div>
                          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                            Full Name
                          </p>
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

                    {/* Doctor Info - Professional Card */}
                    <div className="bg-gradient-to-br from-green-50 to-green-50/50 dark:from-green-950/20 dark:to-green-950/10 rounded-xl p-5 sm:p-6 border border-green-200 dark:border-green-800">
                      <h3 className="font-bold text-foreground mb-4 text-base sm:text-lg flex items-center gap-2">
                        <span className="w-1 h-6 bg-green-600 rounded-full"></span>
                        Attending Physician
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">Name</p>
                          <p className="text-foreground font-semibold mt-2 text-sm sm:text-base truncate">
                            Dr. {selectedReport.doctorId?.name || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wide">
                            Specialty
                          </p>
                          <p className="text-foreground font-semibold mt-2 text-sm sm:text-base truncate">
                            {selectedReport.doctorId?.specialty || "General Dentistry"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Report Details - Professional Sections */}
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

                  {/* Modal Footer - Professional */}
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
    </ProtectedRoute>
  )
}
