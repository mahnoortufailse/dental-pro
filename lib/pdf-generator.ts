//@ts-nocheck
import jsPDF from "jspdf"

interface ReportData {
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
  procedures: Array<{ name: string; description?: string; tooth?: string; status?: string }>
  findings: string
  notes: string
  nextVisit?: string
  followUpDetails?: string
  createdAt: string
}

export function generateReportPDF(report: ReportData) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let yPosition = 20

  doc.setFontSize(24)
  doc.setTextColor(33, 150, 243) // Primary blue color
  doc.text("DENTAL CARE PRO", pageWidth / 2, yPosition, { align: "center" })
  yPosition += 8

  doc.setFontSize(12)
  doc.setTextColor(100, 100, 100)
  doc.text("MEDICAL REPORT", pageWidth / 2, yPosition, { align: "center" })
  yPosition += 10

  // Separator line
  doc.setDrawColor(33, 150, 243)
  doc.setLineWidth(0.5)
  doc.line(20, yPosition, pageWidth - 20, yPosition)
  yPosition += 10

  // Report Date and ID
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Report Date: ${new Date(report.createdAt).toLocaleDateString()}`, 20, yPosition)
  doc.text(`Report ID: ${report._id.slice(-8).toUpperCase()}`, pageWidth - 60, yPosition)
  yPosition += 10

  // Patient Information Section
  doc.setFontSize(12)
  doc.setTextColor(33, 150, 243)
  doc.setFont(undefined, "bold")
  doc.text("PATIENT INFORMATION", 20, yPosition)
  yPosition += 8

  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.setFont(undefined, "normal")
  doc.text(`Name: ${report.patientId?.name || "N/A"}`, 25, yPosition)
  yPosition += 6
  doc.text(`Email: ${report.patientId?.email || "N/A"}`, 25, yPosition)
  yPosition += 6
  doc.text(`Phone: ${report.patientId?.phone || "N/A"}`, 25, yPosition)
  yPosition += 6
  if (report.patientId?.dateOfBirth) {
    doc.text(`Date of Birth: ${new Date(report.patientId.dateOfBirth).toLocaleDateString()}`, 25, yPosition)
    yPosition += 6
  }
  if (report.patientId?.address) {
    const addressLines = doc.splitTextToSize(`Address: ${report.patientId.address}`, pageWidth - 50)
    doc.text(addressLines, 25, yPosition)
    yPosition += addressLines.length * 6
  }
  yPosition += 5

  // Doctor Information Section
  doc.setFontSize(12)
  doc.setTextColor(33, 150, 243)
  doc.setFont(undefined, "bold")
  doc.text("DOCTOR INFORMATION", 20, yPosition)
  yPosition += 8

  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.setFont(undefined, "normal")
  doc.text(`Name: ${report.doctorId?.name || "N/A"}`, 25, yPosition)
  yPosition += 6
  doc.text(`Specialty: ${report.doctorId?.specialty || "N/A"}`, 25, yPosition)
  yPosition += 6
  if (report.doctorId?.email) {
    doc.text(`Email: ${report.doctorId.email}`, 25, yPosition)
    yPosition += 6
  }
  yPosition += 5

  // Procedures Section
  doc.setFontSize(12)
  doc.setTextColor(33, 150, 243)
  doc.setFont(undefined, "bold")
  doc.text("PROCEDURES PERFORMED", 20, yPosition)
  yPosition += 8

  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.setFont(undefined, "normal")
  if (report.procedures && report.procedures.length > 0) {
    report.procedures.forEach((proc) => {
      let procText = `• ${proc.name}`
      if (proc.tooth) procText += ` (Tooth: ${proc.tooth})`
      if (proc.status) procText += ` - ${proc.status}`

      const procLines = doc.splitTextToSize(procText, pageWidth - 50)
      doc.text(procLines, 25, yPosition)
      yPosition += procLines.length * 6

      if (proc.description) {
        const descLines = doc.splitTextToSize(`  Description: ${proc.description}`, pageWidth - 55)
        doc.setFont(undefined, "italic")
        doc.text(descLines, 25, yPosition)
        doc.setFont(undefined, "normal")
        yPosition += descLines.length * 5
      }
    })
  } else {
    doc.text("No procedures recorded", 25, yPosition)
    yPosition += 6
  }
  yPosition += 5

  // Check if we need a new page
  if (yPosition > pageHeight - 60) {
    doc.addPage()
    yPosition = 20
  }

  // Findings Section
  doc.setFontSize(12)
  doc.setTextColor(33, 150, 243)
  doc.setFont(undefined, "bold")
  doc.text("FINDINGS", 20, yPosition)
  yPosition += 8

  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.setFont(undefined, "normal")
  const findingsLines = doc.splitTextToSize(report.findings || "N/A", pageWidth - 40)
  doc.text(findingsLines, 25, yPosition)
  yPosition += findingsLines.length * 6 + 5

  // Check if we need a new page
  if (yPosition > pageHeight - 60) {
    doc.addPage()
    yPosition = 20
  }

  // Notes Section
  doc.setFontSize(12)
  doc.setTextColor(33, 150, 243)
  doc.setFont(undefined, "bold")
  doc.text("DOCTOR'S NOTES", 20, yPosition)
  yPosition += 8

  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.setFont(undefined, "normal")
  const notesLines = doc.splitTextToSize(report.notes || "N/A", pageWidth - 40)
  doc.text(notesLines, 25, yPosition)
  yPosition += notesLines.length * 6 + 5

  // Next Visit Section
  if (report.nextVisit) {
    if (yPosition > pageHeight - 60) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(12)
    doc.setTextColor(33, 150, 243)
    doc.setFont(undefined, "bold")
    doc.text("NEXT VISIT", 20, yPosition)
    yPosition += 8

    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.setFont(undefined, "normal")
    doc.text(`Scheduled for: ${new Date(report.nextVisit).toLocaleDateString()}`, 25, yPosition)
    yPosition += 8
  }

  // Follow-up Details Section
  if (report.followUpDetails) {
    if (yPosition > pageHeight - 60) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(12)
    doc.setTextColor(33, 150, 243)
    doc.setFont(undefined, "bold")
    doc.text("FOLLOW-UP INSTRUCTIONS", 20, yPosition)
    yPosition += 8

    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.setFont(undefined, "normal")
    const followUpLines = doc.splitTextToSize(report.followUpDetails, pageWidth - 40)
    doc.text(followUpLines, 25, yPosition)
    yPosition += followUpLines.length * 6
  }

  // Footer with page numbers and clinic info
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.line(20, pageHeight - 15, pageWidth - 20, pageHeight - 15)
    doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: "center" })
    doc.text("DentalCare Pro - Professional Dental Management System", 20, pageHeight - 10)
  }

  // Save the PDF
  doc.save(`medical-report-${report._id}.pdf`)
}
