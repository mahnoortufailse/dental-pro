//@ts-nocheck
"use client"
import { ProtectedRoute } from "@/components/protected-route"
import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/components/auth-context"
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal"
import { generateReportPDF } from "@/lib/pdf-generator"
import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { FileText, Eye, Trash2, Download, X, Search, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react"

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

  // Search and pagination state
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

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

  // Filter patients for dropdown
  const filteredPatients = patients.filter((p) => p.name.toLowerCase().includes(patientSearch.toLowerCase()))

  // Filter reports based on search term and patient filter
  const filteredReports = reports.filter((report) => {
    // Apply patient filter
    if (filterPatient && report.patientId?._id !== filterPatient) {
      return false
    }
    
    // Apply search term filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        report.patientId?.name?.toLowerCase().includes(searchLower) ||
        report.doctorId?.name?.toLowerCase().includes(searchLower) ||
        report.procedures?.some((p: any) => p.name.toLowerCase().includes(searchLower)) ||
        report.findings?.toLowerCase().includes(searchLower) ||
        report.notes?.toLowerCase().includes(searchLower)
      )
    }
    
    return true
  })

  // Calculate pagination
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentReports = filteredReports.slice(startIndex, endIndex)

  // Reset to first page when search term or items per page changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, itemsPerPage, filterPatient])

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

            {/* Search and Filters */}
            <div className="bg-card rounded-lg shadow-md border border-border p-4 mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Patient Filter */}
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Search patient..."
                      value={patientSearch}
                      onChange={(e) => {
                        setPatientSearch(e.target.value)
                        setShowPatientDropdown(true)
                      }}
                      onFocus={() => setShowPatientDropdown(true)}
                      className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
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

                  {/* General Search */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search reports..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                    />
                  </div>
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
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors font-medium text-sm disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    {loading ? "Loading..." : "Refresh"}
                  </button>
                </div>
              </div>
            </div>

            {/* Reports List */}
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
                    <span className="text-muted-foreground text-sm">Loading reports...</span>
                  </div>
                </div>
              )}

              {/* Reports Content */}
              {!loading && (
                <>
                  <div className="grid grid-cols-1 gap-4 p-4 sm:p-6">
                    {currentReports.length === 0 ? (
                      <div className="bg-muted/40 rounded-lg p-8 text-center">
                        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <p className="text-muted-foreground">
                          {searchTerm || filterPatient ? "No reports found matching your criteria" : "No reports found"}
                        </p>
                      </div>
                    ) : (
                      currentReports.map((report) => (
                        <div
                          key={report._id}
                          className="bg-background rounded-lg border border-border p-4 sm:p-6 hover:shadow-lg transition-shadow"
                        >
                          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-semibold text-foreground truncate">
                                {report.patientId?.name || "Unknown Patient"}
                              </h3>
                              <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                                <span>Doctor: {report.doctorId?.name || "Unknown"}</span>
                                <span>Date: {new Date(report.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                                <span className="font-medium">Procedures:</span>{" "}
                                {report.procedures?.map((p: any) => p.name).join(", ") || "N/A"}
                              </p>
                            </div>
                            <div className="flex gap-2 flex-wrap sm:flex-nowrap">
                              <button
                                onClick={() => handleViewReport(report)}
                                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-3 sm:px-4 py-2 rounded-lg transition-colors font-medium text-sm cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                                <span className="hidden sm:inline">View</span>
                              </button>
                              <button
                                onClick={() => handleDownloadReport(report)}
                                className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-accent-foreground px-3 sm:px-4 py-2 rounded-lg transition-colors font-medium text-sm cursor-pointer"
                              >
                                <Download className="w-4 h-4" />
                                <span className="hidden sm:inline">Download</span>
                              </button>
                              <button
                                onClick={() => {
                                  setReportToDelete(report)
                                  setShowDeleteModal(true)
                                }}
                                className="flex items-center gap-2 bg-destructive hover:bg-destructive/90 px-3 sm:px-4 py-2 rounded-lg transition-colors font-medium text-sm cursor-pointer text-white"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span className="hidden sm:inline">Delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Pagination */}
                  {filteredReports.length > 0 && (
                    <div className="px-4 sm:px-6 py-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-sm text-muted-foreground">
                        Showing <span className="font-medium">{filteredReports.length === 0 ? 0 : startIndex + 1}</span> to{" "}
                        <span className="font-medium">{Math.min(endIndex, filteredReports.length)}</span> of{" "}
                        <span className="font-medium">{filteredReports.length}</span> results
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="p-2 rounded border border-border bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        
                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter(page => 
                              page === 1 || 
                              page === totalPages ||
                              Math.abs(page - currentPage) <= 1
                            )
                            .map((page, index, array) => {
                              const showEllipsis = index < array.length - 1 && array[index + 1] - page > 1;
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
                                  {showEllipsis && (
                                    <span className="px-1 text-muted-foreground">...</span>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                        
                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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

            {/* Report Detail Modal */}
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