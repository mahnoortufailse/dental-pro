"use client"

import { useState, useEffect } from "react"
import { Download, X, Loader } from "lucide-react"
import { generateReportPDF } from "@/lib/pdf-generator"
import { use } from "react"

interface Report {
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
    licenseNumber?: string
  }
  appointmentId: {
    date: string
    time: string
    type: string
    status: string
  }
  procedures: Array<{
    name: string
    description?: string
    tooth?: string
    status?: string
  }>
  findings: string
  notes: string
  nextVisit?: string
  followUpDetails?: string
  createdAt: string
}

export default function PublicReportPage({ params }: { params: { token: string } }) {
  const { token } = use(Promise.resolve(params))
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchReport()
  }, [token])

  const fetchReport = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`/api/public/patient-reports/${token}`)

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to fetch report")
      }

      const data = await res.json()
      setReport(data.report)
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred"
      setError(message)
      console.error("[PUBLIC] Error fetching report:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPDF = () => {
    if (report) {
      generateReportPDF(report)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-3 sm:p-4">
        <div className="bg-card rounded-lg shadow-lg border border-border p-6 max-w-sm w-full text-center">
          <div className="flex justify-center mb-3">
            <Loader className="w-7 h-7 animate-spin text-primary" />
          </div>
          <p className="text-foreground font-medium text-sm">Loading your medical report...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-3 sm:p-4">
        <div className="bg-card rounded-lg shadow-lg border border-border p-5 max-w-sm w-full">
          <div className="flex gap-2 mb-3">
            <X className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold text-foreground text-sm">Error</h2>
              <p className="text-muted-foreground text-xs mt-1">{error}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            If you believe this is an error, please contact your doctor or clinic.
          </p>
        </div>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-3 sm:p-4">
        <div className="bg-card rounded-lg shadow-lg border border-border p-5 max-w-sm w-full text-center">
          <p className="text-foreground font-medium text-sm">Report not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-4 px-3 sm:py-6 sm:px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Medical Report</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {new Date(report.appointmentId?.date).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-3 sm:px-4 py-2 rounded-lg transition-colors font-medium text-sm whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
        </div>

        {/* Report Content */}
        <div className="bg-card rounded-lg shadow-lg border border-border p-4 sm:p-5 space-y-4">
          {/* Patient & Doctor Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded p-3 border border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Patient</p>
              <p className="font-semibold text-foreground text-sm mt-1">{report.patientId?.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{report.patientId?.email}</p>
              <p className="text-xs text-muted-foreground">{report.patientId?.phone}</p>
            </div>

            <div className="bg-muted/50 rounded p-3 border border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Doctor</p>
              <p className="font-semibold text-foreground text-sm mt-1">Dr. {report.doctorId?.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{report.doctorId?.specialty}</p>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="bg-muted/50 rounded p-3 border border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Appointment</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Date</p>
                <p className="font-medium text-foreground">
                  {new Date(report.appointmentId?.date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Time</p>
                <p className="font-medium text-foreground">{report.appointmentId?.time}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Type</p>
                <p className="font-medium text-foreground">{report.appointmentId?.type}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Report Date</p>
                <p className="font-medium text-foreground">{new Date(report.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Procedures */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Procedures</h3>
            <div className="space-y-2">
              {report.procedures && report.procedures.length > 0 ? (
                report.procedures.map((proc, idx) => (
                  <div key={idx} className="bg-muted/50 rounded p-3 border border-border">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm">{proc.name}</p>
                        {proc.description && <p className="text-xs text-muted-foreground mt-0.5">{proc.description}</p>}
                      </div>
                      {proc.tooth && (
                        <span className="bg-primary/20 text-primary px-2 py-1 rounded text-xs font-medium whitespace-nowrap flex-shrink-0">
                          Tooth {proc.tooth}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-xs">No procedures recorded</p>
              )}
            </div>
          </div>

          {/* Findings */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Findings</h3>
            <div className="bg-muted/50 rounded p-3 border border-border">
              <p className="text-foreground text-sm whitespace-pre-wrap leading-relaxed">{report.findings}</p>
            </div>
          </div>

          {/* Doctor's Notes */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Notes</h3>
            <div className="bg-muted/50 rounded p-3 border border-border">
              <p className="text-foreground text-sm whitespace-pre-wrap leading-relaxed">{report.notes}</p>
            </div>
          </div>

          {/* Follow-up Information */}
          {(report.nextVisit || report.followUpDetails) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {report.nextVisit && (
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded p-3 border border-blue-200 dark:border-blue-800">
                  <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 uppercase tracking-wide">
                    Next Appointment
                  </p>
                  <p className="text-foreground font-medium text-sm mt-1">
                    {new Date(report.nextVisit).toLocaleDateString()}
                  </p>
                </div>
              )}
              {report.followUpDetails && (
                <div className="bg-amber-50 dark:bg-amber-950/30 rounded p-3 border border-amber-200 dark:border-amber-800">
                  <p className="text-xs font-semibold text-amber-900 dark:text-amber-300 uppercase tracking-wide">
                    Follow-up
                  </p>
                  <p className="text-foreground text-xs mt-1 leading-relaxed">{report.followUpDetails}</p>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-border pt-3 mt-4 text-center">
            <p className="text-xs text-muted-foreground">Generated on {new Date(report.createdAt).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
