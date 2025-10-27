//@ts-nocheck
import jsPDF from "jspdf"
import { format } from "date-fns"

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
    licenseNumber?: string
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

  // Colors
  const primaryColor = [59, 130, 246] // Blue-500
  const secondaryColor = [107, 114, 128] // Gray-500
  const accentColor = [16, 185, 129] // Green-500
  const dangerColor = [239, 68, 68] // Red-500

  // Header with gradient background
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.rect(0, 0, pageWidth, 80, 'F')
  
  // Clinic Logo/Name
  doc.setFontSize(28)
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.text("DENTAL CARE PRO", pageWidth / 2, 35, { align: "center" })
  
  doc.setFontSize(12)
  doc.setTextColor(255, 255, 255, 0.8)
  doc.setFont("helvetica", "normal")
  doc.text("Professional Dental Healthcare", pageWidth / 2, 45, { align: "center" })
  
  // Report Title
  doc.setFontSize(18)
  doc.setTextColor(255, 255, 255)
  doc.setFont("helvetica", "bold")
  doc.text("MEDICAL REPORT", pageWidth / 2, 60, { align: "center" })

  yPosition = 90

  // Report Metadata
  doc.setFontSize(10)
  doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
  doc.setFont("helvetica", "normal")
  
  const reportDate = format(new Date(report.createdAt), "MMMM dd, yyyy")
  const reportTime = format(new Date(report.createdAt), "hh:mm a")
  
  doc.text(`Report Date: ${reportDate}`, 20, yPosition)
  doc.text(`Time: ${reportTime}`, 20, yPosition + 5)
  doc.text(`Report ID: DC-${report._id.slice(-8).toUpperCase()}`, pageWidth - 20, yPosition, { align: "right" })
  doc.text(`Confidential Medical Document`, pageWidth - 20, yPosition + 5, { align: "right" })

  yPosition += 20

  // Two Column Layout
  const columnWidth = (pageWidth - 60) / 2
  const leftColumn = 20
  const rightColumn = leftColumn + columnWidth + 20

  // Patient Information Card
  drawRoundedRect(doc, leftColumn, yPosition, columnWidth, 80, 5)
  doc.setFillColor(248, 250, 252)
  doc.rect(leftColumn, yPosition, columnWidth, 80, 'F')
  
  doc.setFontSize(12)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.setFont("helvetica", "bold")
  doc.text("PATIENT INFORMATION", leftColumn + 10, yPosition + 15)

  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)
  doc.setFont("helvetica", "normal")
  
  let patientY = yPosition + 25
  doc.text(`Name: ${report.patientId?.name || "N/A"}`, leftColumn + 10, patientY)
  patientY += 6
  doc.text(`Email: ${report.patientId?.email || "N/A"}`, leftColumn + 10, patientY)
  patientY += 6
  doc.text(`Phone: ${report.patientId?.phone || "N/A"}`, leftColumn + 10, patientY)
  patientY += 6
  
  if (report.patientId?.dateOfBirth) {
    const dob = format(new Date(report.patientId.dateOfBirth), "MMMM dd, yyyy")
    doc.text(`Date of Birth: ${dob}`, leftColumn + 10, patientY)
    patientY += 6
  }
  
  if (report.patientId?.address) {
    const addressLines = doc.splitTextToSize(`Address: ${report.patientId.address}`, columnWidth - 20)
    doc.text(addressLines, leftColumn + 10, patientY)
  }

  // Doctor Information Card
  drawRoundedRect(doc, rightColumn, yPosition, columnWidth, 80, 5)
  doc.setFillColor(248, 250, 252)
  doc.rect(rightColumn, yPosition, columnWidth, 80, 'F')
  
  doc.setFontSize(12)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.setFont("helvetica", "bold")
  doc.text("ATTENDING PHYSICIAN", rightColumn + 10, yPosition + 15)

  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)
  doc.setFont("helvetica", "normal")
  
  let doctorY = yPosition + 25
  doc.text(`Dr. ${report.doctorId?.name || "N/A"}`, rightColumn + 10, doctorY)
  doctorY += 6
  doc.text(`Specialty: ${report.doctorId?.specialty || "General Dentistry"}`, rightColumn + 10, doctorY)
  doctorY += 6
  if (report.doctorId?.email) {
    doc.text(`Email: ${report.doctorId.email}`, rightColumn + 10, doctorY)
    doctorY += 6
  }
  if (report.doctorId?.licenseNumber) {
    doc.text(`License: ${report.doctorId.licenseNumber}`, rightColumn + 10, doctorY)
  }

  yPosition += 100

  // Procedures Section
  doc.setFontSize(14)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.setFont("helvetica", "bold")
  doc.text("PROCEDURES PERFORMED", 20, yPosition)
  
  yPosition += 10
  
  if (report.procedures && report.procedures.length > 0) {
    drawRoundedRect(doc, 20, yPosition, pageWidth - 40, 15 + (report.procedures.length * 25), 5)
    doc.setFillColor(255, 255, 255)
    doc.rect(20, yPosition, pageWidth - 40, 15 + (report.procedures.length * 25), 'F')
    
    let procY = yPosition + 10
    report.procedures.forEach((proc, index) => {
      // Procedure header with number
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
      doc.rect(25, procY - 5, pageWidth - 50, 15, 'F')
      
      doc.setFontSize(10)
      doc.setTextColor(255, 255, 255)
      doc.setFont("helvetica", "bold")
      doc.text(`Procedure ${index + 1}: ${proc.name}`, 30, procY + 3)
      
      procY += 12
      
      // Procedure details
      doc.setFontSize(9)
      doc.setTextColor(0, 0, 0)
      doc.setFont("helvetica", "normal")
      
      if (proc.tooth) {
        doc.text(`Tooth: ${proc.tooth}`, 30, procY)
        procY += 5
      }
      
      if (proc.status) {
        const statusColor = proc.status.toLowerCase() === 'completed' ? accentColor : dangerColor
        doc.setTextColor(statusColor[0], statusColor[1], statusColor[2])
        doc.text(`Status: ${proc.status}`, 30, procY)
        doc.setTextColor(0, 0, 0)
        procY += 5
      }
      
      if (proc.description) {
        const descLines = doc.splitTextToSize(`Description: ${proc.description}`, pageWidth - 70)
        doc.text(descLines, 30, procY)
        procY += descLines.length * 4
      }
      
      procY += 8
    })
    
    yPosition += 20 + (report.procedures.length * 25)
  } else {
    doc.setFontSize(10)
    doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2])
    doc.text("No procedures recorded", 25, yPosition)
    yPosition += 15
  }

  // Check for new page
  if (yPosition > pageHeight - 100) {
    doc.addPage()
    yPosition = 20
  }

  // Findings Section
  doc.setFontSize(14)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.setFont("helvetica", "bold")
  doc.text("CLINICAL FINDINGS", 20, yPosition)
  
  yPosition += 10
  
  drawRoundedRect(doc, 20, yPosition, pageWidth - 40, 60, 5)
  doc.setFillColor(248, 250, 252)
  doc.rect(20, yPosition, pageWidth - 40, 60, 'F')
  
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.setFont("helvetica", "normal")
  
  const findingsLines = doc.splitTextToSize(report.findings || "No significant findings recorded.", pageWidth - 60)
  doc.text(findingsLines, 30, yPosition + 10)
  yPosition += 70

  // Check for new page
  if (yPosition > pageHeight - 100) {
    doc.addPage()
    yPosition = 20
  }

  // Notes Section
  doc.setFontSize(14)
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
  doc.setFont("helvetica", "bold")
  doc.text("DOCTOR'S NOTES", 20, yPosition)
  
  yPosition += 10
  
  drawRoundedRect(doc, 20, yPosition, pageWidth - 40, 50, 5)
  doc.setFillColor(255, 255, 255)
  doc.rect(20, yPosition, pageWidth - 40, 50, 'F')
  
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.setFont("helvetica", "normal")
  
  const notesLines = doc.splitTextToSize(report.notes || "No additional notes.", pageWidth - 60)
  doc.text(notesLines, 30, yPosition + 10)
  yPosition += 60

  // Next Visit Section
  if (report.nextVisit) {
    if (yPosition > pageHeight - 80) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(14)
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2])
    doc.setFont("helvetica", "bold")
    doc.text("NEXT APPOINTMENT", 20, yPosition)
    
    yPosition += 10
    
    drawRoundedRect(doc, 20, yPosition, pageWidth - 40, 25, 5)
    doc.setFillColor(240, 253, 244)
    doc.rect(20, yPosition, pageWidth - 40, 25, 'F')
    
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.setFont("helvetica", "normal")
    
    const nextVisitDate = format(new Date(report.nextVisit), "EEEE, MMMM dd, yyyy 'at' hh:mm a")
    doc.text(`Scheduled for: ${nextVisitDate}`, 30, yPosition + 8)
    yPosition += 35
  }

  // Follow-up Details Section
  if (report.followUpDetails) {
    if (yPosition > pageHeight - 100) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(14)
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.setFont("helvetica", "bold")
    doc.text("FOLLOW-UP INSTRUCTIONS", 20, yPosition)
    
    yPosition += 10
    
    drawRoundedRect(doc, 20, yPosition, pageWidth - 40, 50, 5)
    doc.setFillColor(248, 250, 252)
    doc.rect(20, yPosition, pageWidth - 40, 50, 'F')
    
    doc.setFontSize(10)
    doc.setTextColor(0, 0, 0)
    doc.setFont("helvetica", "normal")
    
    const followUpLines = doc.splitTextToSize(report.followUpDetails, pageWidth - 60)
    doc.text(followUpLines, 30, yPosition + 10)
    yPosition += 60
  }

  // Footer with professional styling
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    
    // Footer background
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
    doc.rect(0, pageHeight - 20, pageWidth, 20, 'F')
    
    // Footer text
    doc.setFontSize(8)
    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "normal")
    
    doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 12, { align: "center" })
    doc.text("DentalCare Pro - Professional Dental Management System", 20, pageHeight - 12)
    doc.text("Confidential Medical Document - For Authorized Use Only", pageWidth - 20, pageHeight - 12, { align: "right" })
    
    // Watermark on all pages except first
    if (i > 1) {
      doc.setFontSize(40)
      doc.setTextColor(240, 240, 240)
      doc.setFont("helvetica", "bold")
      doc.text("DENTAL CARE", pageWidth / 2, pageHeight / 2, { align: "center", angle: 45 })
    }
  }

  // Add signature line on last page
  doc.setPage(totalPages)
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)
  doc.setFont("helvetica", "normal")
  
  const signatureY = yPosition + 30
  doc.line(100, signatureY, 180, signatureY)
  doc.text("Dr. " + (report.doctorId?.name || "Attending Physician"), 140, signatureY + 10, { align: "center" })
  doc.text("Signature", 140, signatureY + 15, { align: "center" })
  doc.text("License Number: " + (report.doctorId?.licenseNumber || "PROFESSIONAL"), 140, signatureY + 20, { align: "center" })

  // Save the PDF with professional filename
  const patientName = report.patientId?.name?.replace(/\s+/g, '_') || 'Unknown'
  const dateStr = format(new Date(report.createdAt), 'yyyy-MM-dd')
  doc.save(`Medical_Report_${patientName}_${dateStr}.pdf`)
}

// Helper function to draw rounded rectangles
function drawRoundedRect(doc: jsPDF, x: number, y: number, width: number, height: number, radius: number) {
  doc.setDrawColor(200, 200, 200)
  doc.setLineWidth(0.5)
  
  // Draw rounded rectangle
  doc.line(x + radius, y, x + width - radius, y)
  doc.line(x + width, y + radius, x + width, y + height - radius)
  doc.line(x + width - radius, y + height, x + radius, y + height)
  doc.line(x, y + height - radius, x, y + radius)
  
  // Draw corners
  doc.line(x + radius, y, x, y + radius)
  doc.line(x + width - radius, y, x + width, y + radius)
  doc.line(x + width, y + height - radius, x + width - radius, y + height)
  doc.line(x, y + height - radius, x + radius, y + height)
}