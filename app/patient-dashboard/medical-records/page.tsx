//@ts-nocheck
"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import toast from "react-hot-toast"
import { useAuth } from "@/components/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { FileText, AlertCircle, CheckCircle, Clock, Download } from "lucide-react"
import { generateReportPDF } from "@/lib/pdf-generator"

interface AppointmentReport {
  _id: string
  patientId: {
    name: string
    email: string
    phone: string
    dateOfBirth?: string
    address?: string
  }
  doctorId: {
    name: string
    specialty: string
    email?: string
  }
  procedures: Array<{ name: string; description: string; tooth: string; status: string }>
  findings: string
  notes: string
  nextVisit: string
  followUpDetails: string
  createdAt: string
}

interface MedicalHistoryEntry {
  date: string
  notes: string
  findings: string
  treatment: string
  medications: string[]
  doctorId: { name: string; specialty: string }
}

interface MedicalHistory {
  _id: string
  entries: MedicalHistoryEntry[]
}

export default function MedicalRecordsPage() {
  const { patient, patientToken } = useAuth()
  const [records, setRecords] = useState<AppointmentReport[]>([])
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"reports" | "history">("reports")
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  useEffect(() => {
    if (patient && patientToken) {
      fetchAllRecords(patientToken, patient._id)
    }
  }, [patient, patientToken])

  const fetchAllRecords = async (token: string, patientId: string) => {
    try {
      const [reportsRes, historyRes] = await Promise.all([
        fetch(`/api/appointment-reports?patientId=${patientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/medical-history?patientId=${patientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      if (reportsRes.ok) {
        const data = await reportsRes.json()
        setRecords(data.reports || [])
      }

      if (historyRes.ok) {
        const data = await historyRes.json()
        setMedicalHistory(data.history || null)
      }
    } catch (error) {
      console.error("[v0] Error fetching records:", error)
      toast.error("Failed to load medical records")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadReport = async (report: AppointmentReport) => {
    try {
      setDownloadingId(report._id)
      generateReportPDF(report)
      toast.success("Report downloaded successfully")
    } catch (error) {
      console.error("[v0] Error downloading report:", error)
      toast.error("Failed to download report")
    } finally {
      setDownloadingId(null)
    }
  }

  const handleDownloadHistoryEntry = async (entry: MedicalHistoryEntry, index: number) => {
    try {
      setDownloadingId(`history-${index}`)

      // Create a PDF for the medical history entry
      const jsPDF = (await import("jspdf")).jsPDF
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      let yPosition = 20

      // Header
      doc.setFontSize(24)
      doc.setTextColor(33, 150, 243)
      doc.text("DENTAL CARE PRO", pageWidth / 2, yPosition, { align: "center" })
      yPosition += 8

      doc.setFontSize(12)
      doc.setTextColor(100, 100, 100)
      doc.text("MEDICAL HISTORY RECORD", pageWidth / 2, yPosition, { align: "center" })
      yPosition += 10

      // Separator line
      doc.setDrawColor(33, 150, 243)
      doc.setLineWidth(0.5)
      doc.line(20, yPosition, pageWidth - 20, yPosition)
      yPosition += 10

      // Date
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text(`Record Date: ${new Date(entry.date).toLocaleDateString()}`, 20, yPosition)
      yPosition += 10

      // Doctor Information
      doc.setFontSize(12)
      doc.setTextColor(33, 150, 243)
      doc.setFont(undefined, "bold")
      doc.text("DOCTOR INFORMATION", 20, yPosition)
      yPosition += 8

      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      doc.setFont(undefined, "normal")
      doc.text(`Name: ${entry.doctorId?.name || "N/A"}`, 25, yPosition)
      yPosition += 6
      doc.text(`Specialty: ${entry.doctorId?.specialty || "N/A"}`, 25, yPosition)
      yPosition += 10

      // Findings
      doc.setFontSize(12)
      doc.setTextColor(33, 150, 243)
      doc.setFont(undefined, "bold")
      doc.text("FINDINGS", 20, yPosition)
      yPosition += 8

      doc.setFontSize(10)
      doc.setTextColor(0, 0, 0)
      doc.setFont(undefined, "normal")
      const findingsLines = doc.splitTextToSize(entry.findings || "N/A", pageWidth - 40)
      doc.text(findingsLines, 25, yPosition)
      yPosition += findingsLines.length * 6 + 5

      // Treatment
      if (entry.treatment) {
        doc.setFontSize(12)
        doc.setTextColor(33, 150, 243)
        doc.setFont(undefined, "bold")
        doc.text("TREATMENT", 20, yPosition)
        yPosition += 8

        doc.setFontSize(10)
        doc.setTextColor(0, 0, 0)
        doc.setFont(undefined, "normal")
        const treatmentLines = doc.splitTextToSize(entry.treatment, pageWidth - 40)
        doc.text(treatmentLines, 25, yPosition)
        yPosition += treatmentLines.length * 6 + 5
      }

      // Medications
      if (entry.medications && entry.medications.length > 0) {
        doc.setFontSize(12)
        doc.setTextColor(33, 150, 243)
        doc.setFont(undefined, "bold")
        doc.text("MEDICATIONS", 20, yPosition)
        yPosition += 8

        doc.setFontSize(10)
        doc.setTextColor(0, 0, 0)
        doc.setFont(undefined, "normal")
        entry.medications.forEach((med) => {
          doc.text(`• ${med}`, 25, yPosition)
          yPosition += 6
        })
        yPosition += 5
      }

      // Notes
      if (entry.notes) {
        doc.setFontSize(12)
        doc.setTextColor(33, 150, 243)
        doc.setFont(undefined, "bold")
        doc.text("NOTES", 20, yPosition)
        yPosition += 8

        doc.setFontSize(10)
        doc.setTextColor(0, 0, 0)
        doc.setFont(undefined, "normal")
        const notesLines = doc.splitTextToSize(entry.notes, pageWidth - 40)
        doc.text(notesLines, 25, yPosition)
      }

      // Save the PDF
      doc.save(`medical-history-${new Date(entry.date).toISOString().split("T")[0]}.pdf`)
      toast.success("Medical history record downloaded successfully")
    } catch (error) {
      console.error("[v0] Error downloading history entry:", error)
      toast.error("Failed to download medical history record")
    } finally {
      setDownloadingId(null)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  const hasReports = records.length > 0
  const hasHistory = medicalHistory && medicalHistory.entries && medicalHistory.entries.length > 0

  return (
    <ProtectedRoute patientOnly={true}>
      <div className="flex h-screen bg-background">
        <main className="flex-1 lg:ml-0">
          <div className="">
            {/* Header */}
            <div className="dashboard-header mb-8">
              <div>
                <h1 className="dashboard-title sm:text-3xl text-2xl">Medical Records</h1>
                <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                  Your appointment reports and medical history
                </p>
              </div>
            </div>

            {hasReports || hasHistory ? (
              <>
                <div className="flex gap-2 mb-6 border-b border-border">
                  <button
                    onClick={() => setActiveTab("reports")}
                    className={`px-4 py-2 font-medium text-sm transition-colors ${
                      activeTab === "reports"
                        ? "text-primary border-b-2 border-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Appointment Reports ({records.length})
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab("history")}
                    className={`px-4 py-2 font-medium text-sm transition-colors ${
                      activeTab === "history"
                        ? "text-primary border-b-2 border-primary"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      Medical History ({medicalHistory?.entries?.length || 0})
                    </span>
                  </button>
                </div>

                {/* Appointment Reports Tab */}
                {activeTab === "reports" && (
                  <div className="space-y-6">
                    {!hasReports ? (
                      <Card className="p-8 text-center">
                        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <p className="text-muted-foreground">No appointment reports found</p>
                      </Card>
                    ) : (
                      records.map((record) => (
                        <Card key={record._id} className="p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-accent" />
                                Report from {new Date(record.createdAt).toLocaleDateString()}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                Next Visit:{" "}
                                {record.nextVisit ? new Date(record.nextVisit).toLocaleDateString() : "Not scheduled"}
                              </p>
                            </div>
                            <Button
                              onClick={() => handleDownloadReport(record)}
                              disabled={downloadingId === record._id}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              {downloadingId === record._id ? "Downloading..." : "Download"}
                            </Button>
                          </div>

                          {/* Procedures */}
                          {record.procedures && record.procedures.length > 0 && (
                            <div className="mb-4">
                              <h4 className="font-semibold text-foreground mb-2 text-sm">Procedures Performed</h4>
                              <div className="space-y-2">
                                {record.procedures.map((proc, idx) => (
                                  <div key={idx} className="bg-muted/50 p-3 rounded-lg border border-border">
                                    <p className="font-medium text-foreground text-sm">{proc.name}</p>
                                    {proc.tooth && <p className="text-xs text-muted-foreground">Tooth: {proc.tooth}</p>}
                                    {proc.description && (
                                      <p className="text-xs text-muted-foreground">{proc.description}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1">Status: {proc.status}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Findings */}
                          {record.findings && (
                            <div className="mb-4">
                              <h4 className="font-semibold text-foreground mb-2 text-sm">Findings</h4>
                              <p className="text-muted-foreground text-sm whitespace-pre-wrap">{record.findings}</p>
                            </div>
                          )}

                          {/* Notes */}
                          {record.notes && (
                            <div className="mb-4">
                              <h4 className="font-semibold text-foreground mb-2 text-sm">Doctor's Notes</h4>
                              <p className="text-muted-foreground text-sm whitespace-pre-wrap">{record.notes}</p>
                            </div>
                          )}

                          {/* Follow-up */}
                          {record.followUpDetails && (
                            <div className="bg-accent/10 p-3 rounded-lg border border-accent/20">
                              <h4 className="font-semibold text-foreground mb-2 text-sm flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Follow-up Instructions
                              </h4>
                              <p className="text-muted-foreground text-sm whitespace-pre-wrap">
                                {record.followUpDetails}
                              </p>
                            </div>
                          )}
                        </Card>
                      ))
                    )}
                  </div>
                )}

                {/* Medical History Tab */}
                {activeTab === "history" && (
                  <div className="space-y-6">
                    {!hasHistory ? (
                      <Card className="p-8 text-center">
                        <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <p className="text-muted-foreground">No medical history records found</p>
                      </Card>
                    ) : (
                      medicalHistory!.entries.map((entry, idx) => (
                        <Card key={idx} className="p-6 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-primary" />
                                {new Date(entry.date).toLocaleDateString()}
                              </h3>
                              {entry.doctorId && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  Doctor: {entry.doctorId.name} ({entry.doctorId.specialty})
                                </p>
                              )}
                            </div>
                            <Button
                              onClick={() => handleDownloadHistoryEntry(entry, idx)}
                              disabled={downloadingId === `history-${idx}`}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2"
                            >
                              <Download className="w-4 h-4" />
                              {downloadingId === `history-${idx}` ? "Downloading..." : "Download"}
                            </Button>
                          </div>

                          {/* Findings */}
                          {entry.findings && (
                            <div className="mb-4">
                              <h4 className="font-semibold text-foreground mb-2 text-sm">Findings</h4>
                              <p className="text-muted-foreground text-sm whitespace-pre-wrap">{entry.findings}</p>
                            </div>
                          )}

                          {/* Treatment */}
                          {entry.treatment && (
                            <div className="mb-4">
                              <h4 className="font-semibold text-foreground mb-2 text-sm">Treatment</h4>
                              <p className="text-muted-foreground text-sm whitespace-pre-wrap">{entry.treatment}</p>
                            </div>
                          )}

                          {/* Medications */}
                          {entry.medications && entry.medications.length > 0 && (
                            <div className="mb-4">
                              <h4 className="font-semibold text-foreground mb-2 text-sm">Medications</h4>
                              <div className="space-y-1">
                                {entry.medications.map((med, medIdx) => (
                                  <p key={medIdx} className="text-muted-foreground text-sm flex items-center gap-2">
                                    <span className="text-primary">•</span>
                                    {med}
                                  </p>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Notes */}
                          {entry.notes && (
                            <div className="bg-muted/50 p-3 rounded-lg border border-border">
                              <h4 className="font-semibold text-foreground mb-2 text-sm">Notes</h4>
                              <p className="text-muted-foreground text-sm whitespace-pre-wrap">{entry.notes}</p>
                            </div>
                          )}
                        </Card>
                      ))
                    )}
                  </div>
                )}
              </>
            ) : (
              <Card className="p-8 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground">No medical records found</p>
              </Card>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
