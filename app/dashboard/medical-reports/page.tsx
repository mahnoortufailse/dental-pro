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
              {user?.role !== "doctor" && (
                <div className="flex-1">
                  <label className="block text-sm font-medium text-foreground mb-2">Filter by Patient</label>
                  <select
                    value={filterPatient}
                    onChange={(e) => setFilterPatient(e.target.value)}
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm cursor-pointer"
                  >
                    <option value="">All Patients</option>
                    {patients.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
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
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                <div className="bg-card rounded-lg shadow-xl border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                  {/* Modal Header */}
                  <div className="flex justify-between items-start p-6 border-b border-border sticky top-0 bg-card">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">Medical Report</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(selectedReport.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowReportModal(false)}
                      className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-2 hover:bg-muted rounded-lg"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Patient Info */}
                    <div className="bg-muted/50 rounded-lg p-4 border border-border">
                      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        Patient Information
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs font-medium uppercase">Name</p>
                          <p className="text-foreground font-medium mt-1">{selectedReport.patientId?.name || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs font-medium uppercase">Email</p>
                          <p className="text-foreground font-medium mt-1">{selectedReport.patientId?.email || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs font-medium uppercase">Phone</p>
                          <p className="text-foreground font-medium mt-1">{selectedReport.patientId?.phone || "N/A"}</p>
                        </div>
                      </div>
                    </div>

                    {/* Doctor Info */}
                    <div className="bg-muted/50 rounded-lg p-4 border border-border">
                      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <div className="w-2 h-2 bg-accent rounded-full" />
                        Doctor Information
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground text-xs font-medium uppercase">Name</p>
                          <p className="text-foreground font-medium mt-1">{selectedReport.doctorId?.name || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs font-medium uppercase">Specialty</p>
                          <p className="text-foreground font-medium mt-1">
                            {selectedReport.doctorId?.specialty || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Report Details */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        Report Details
                      </h3>

                      <div className="bg-muted/50 rounded-lg p-4 border border-border">
                        <p className="text-muted-foreground text-xs font-medium uppercase mb-2">Procedures</p>
                        <ul className="text-foreground space-y-2">
                          {selectedReport.procedures?.map((p: any, idx: number) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <span className="text-primary font-bold">•</span>
                              <span>{p.name}</span>
                            </li>
                          )) || <li className="text-muted-foreground text-sm">N/A</li>}
                        </ul>
                      </div>

                      <div className="bg-muted/50 rounded-lg p-4 border border-border">
                        <p className="text-muted-foreground text-xs font-medium uppercase mb-2">Findings</p>
                        <p className="text-foreground text-sm whitespace-pre-wrap">
                          {selectedReport.findings || "N/A"}
                        </p>
                      </div>

                      <div className="bg-muted/50 rounded-lg p-4 border border-border">
                        <p className="text-muted-foreground text-xs font-medium uppercase mb-2">Notes</p>
                        <p className="text-foreground text-sm whitespace-pre-wrap">{selectedReport.notes || "N/A"}</p>
                      </div>

                      {selectedReport.nextVisit && (
                        <div className="bg-muted/50 rounded-lg p-4 border border-border">
                          <p className="text-muted-foreground text-xs font-medium uppercase mb-2">Next Visit</p>
                          <p className="text-foreground text-sm">
                            {new Date(selectedReport.nextVisit).toLocaleDateString()}
                          </p>
                        </div>
                      )}

                      {selectedReport.followUpDetails && (
                        <div className="bg-muted/50 rounded-lg p-4 border border-border">
                          <p className="text-muted-foreground text-xs font-medium uppercase mb-2">Follow-up Details</p>
                          <p className="text-foreground text-sm whitespace-pre-wrap">
                            {selectedReport.followUpDetails}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="flex gap-2 p-6 border-t border-border bg-muted/30">
                    <button
                      onClick={() => handleDownloadReport(selectedReport)}
                      className="flex-1 flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-accent-foreground px-4 py-2 rounded-lg transition-colors font-medium cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                    <button
                      onClick={() => setShowReportModal(false)}
                      className="flex-1 bg-muted hover:bg-muted/80 text-muted-foreground px-4 py-2 rounded-lg transition-colors font-medium cursor-pointer"
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
