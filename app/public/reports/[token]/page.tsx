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
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
        <div className="bg-card rounded-lg shadow-lg border border-border p-8 max-w-md w-full text-center">
          <div className="flex justify-center mb-4">
            <Loader className="w-8 h-8 animate-spin text-primary" />
          </div>
          <p className="text-foreground font-medium">Loading your medical report...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
        <div className="bg-card rounded-lg shadow-lg border border-border p-8 max-w-md w-full">
          <div className="flex gap-3 mb-4">
            <X className="w-6 h-6 text-destructive flex-shrink-0" />
            <div>
              <h2 className="font-semibold text-foreground mb-1">Error</h2>
              <p className="text-muted-foreground text-sm">{error}</p>
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
      <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
        <div className="bg-card rounded-lg shadow-lg border border-border p-8 max-w-md w-full text-center">
          <p className="text-foreground font-medium">Report not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted py-6 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Medical Report</h1>
            <p className="text-muted-foreground mt-1">Report for {report.appointmentId?.date}</p>
          </div>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors font-medium"
          >
            <Download className="w-5 h-5" />
            Download PDF
          </button>
        </div>

        {/* Report Content */}
        <div className="bg-card rounded-lg shadow-lg border border-border p-8 space-y-6">
          {/* Patient & Doctor Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Patient Information</p>
              <p className="text-lg font-semibold text-foreground mt-2">{report.patientId?.name}</p>
              <p className="text-sm text-muted-foreground mt-1">{report.patientId?.email}</p>
              <p className="text-sm text-muted-foreground">{report.patientId?.phone}</p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Doctor Information</p>
              <p className="text-lg font-semibold text-foreground mt-2">Dr. {report.doctorId?.name}</p>
              <p className="text-sm text-muted-foreground mt-1">{report.doctorId?.specialty}</p>
              {report.doctorId?.licenseNumber && (
                <p className="text-xs text-muted-foreground mt-1">License: {report.doctorId.licenseNumber}</p>
              )}
            </div>
          </div>

          {/* Appointment Details */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Appointment Details
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="font-medium text-foreground">
                  {new Date(report.appointmentId?.date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Time</p>
                <p className="font-medium text-foreground">{report.appointmentId?.time}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="font-medium text-foreground">{report.appointmentId?.type}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Report Date</p>
                <p className="font-medium text-foreground">{new Date(report.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Procedures */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Procedures Performed</h3>
            <div className="space-y-2">
              {report.procedures && report.procedures.length > 0 ? (
                report.procedures.map((proc, idx) => (
                  <div key={idx} className="bg-muted/50 rounded-lg p-4 border border-border">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{proc.name}</p>
                        {proc.description && <p className="text-sm text-muted-foreground mt-1">{proc.description}</p>}
                      </div>
                      {proc.tooth && (
                        <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap">
                          Tooth {proc.tooth}
                        </span>
                      )}
                    </div>
                    {proc.status && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Status:{" "}
                        <span className={proc.status === "completed" ? "text-green-600" : "text-orange-600"}>
                          {proc.status}
                        </span>
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No procedures recorded</p>
              )}
            </div>
          </div>

          {/* Findings */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Clinical Findings</h3>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">{report.findings}</p>
            </div>
          </div>

          {/* Doctor's Notes */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-3">Doctor's Notes</h3>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">{report.notes}</p>
            </div>
          </div>

          {/* Follow-up Information */}
          {(report.nextVisit || report.followUpDetails) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.nextVisit && (
                <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                  <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 uppercase tracking-wide">
                    Next Appointment
                  </p>
                  <p className="text-foreground font-medium mt-2">
                    {new Date(report.nextVisit).toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}
              {report.followUpDetails && (
                <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
                  <p className="text-xs font-semibold text-amber-900 dark:text-amber-300 uppercase tracking-wide">
                    Follow-up Instructions
                  </p>
                  <p className="text-foreground text-sm mt-2 leading-relaxed">{report.followUpDetails}</p>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-border pt-4 mt-6">
            <p className="text-xs text-muted-foreground text-center">
              This document was generated on {new Date(report.createdAt).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Please consult with your doctor for any questions regarding this report.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
