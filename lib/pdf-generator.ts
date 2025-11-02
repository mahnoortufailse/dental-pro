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
  let y = 58

  // Colors
  const blue = [23, 78, 166]
  const lightBlue = [231, 238, 255]
  const gray = [70, 70, 70]
  const softGray = [248, 249, 250]
  const green = [34, 197, 94]
  const red = [239, 68, 68]

  /* -------------------- HEADER -------------------- */
  const headerHeight = 52
  doc.setFillColor(blue[0], blue[1], blue[2])
  doc.rect(0, 0, pageWidth, headerHeight, "F")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(22)
  doc.setTextColor(255, 255, 255)
  doc.text("Dr. Mohammad Alsheikh", 20, 20)
  doc.text("Dental Center", 20, 30)

  doc.setFont("helvetica", "italic")
  doc.setFontSize(11)
  doc.text("Your Smile, Our Priority", 20, 40)

  doc.setDrawColor(255, 255, 255)
  doc.setLineWidth(0.5)
  doc.line(15, 45, pageWidth - 15, 45)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text("MEDICAL REPORT", pageWidth - 20, 22, { align: "right" })
  doc.setFont("helvetica", "normal")
  doc.setFontSize(10)
  doc.text("Confidential Patient Document", pageWidth - 20, 31, { align: "right" })

  /* -------------------- REPORT INFO STRIP -------------------- */
  doc.setFillColor(lightBlue[0], lightBlue[1], lightBlue[2])
  doc.roundedRect(15, y - 12, pageWidth - 30, 15, 3, 3, "F")

  const reportDate = format(new Date(report.createdAt), "MMMM dd, yyyy")
  const reportTime = format(new Date(report.createdAt), "hh:mm a")
  const reportID = `DC-${report._id.slice(-6).toUpperCase()}`

  doc.setFont("helvetica", "bold")
  doc.setFontSize(9)
  doc.setTextColor(blue[0], blue[1], blue[2])
  doc.text(`Report ID: ${reportID}`, 22, y - 3)
  doc.text(`Date: ${reportDate}`, pageWidth / 2, y - 3, { align: "center" })
  doc.text(`Time: ${reportTime}`, pageWidth - 22, y - 3, { align: "right" })

  y += 16

  /* -------------------- PATIENT INFO -------------------- */
  y = drawSectionTitle(doc, "PATIENT INFORMATION", y, blue)
  y = drawInfoCard(doc, [
    `Name: ${report.patientId?.name || "N/A"}`,
    `Email: ${report.patientId?.email || "N/A"}`,
    `Phone: ${report.patientId?.phone || "N/A"}`,
    report.patientId?.dateOfBirth ? `Date of Birth: ${format(new Date(report.patientId.dateOfBirth), "MMMM dd, yyyy")}` : "",
    report.patientId?.address ? `Address: ${report.patientId.address}` : "",
  ].filter(Boolean), y, softGray)

  /* -------------------- DOCTOR INFO -------------------- */
  y = drawSectionTitle(doc, "ATTENDING DOCTOR", y, blue)
  y = drawInfoCard(doc, [
    `Name: Dr. ${report.doctorId?.name || "N/A"}`,
    `Specialty: ${report.doctorId?.specialty || "General Dentistry"}`,
    report.doctorId?.email ? `Email: ${report.doctorId.email}` : "",
    report.doctorId?.licenseNumber ? `License #: ${report.doctorId.licenseNumber}` : "",
  ].filter(Boolean), y, softGray)

  /* -------------------- PROCEDURES -------------------- */
  y = drawSectionTitle(doc, "PROCEDURES PERFORMED", y, blue)
  if (report.procedures?.length) {
    for (const [i, p] of report.procedures.entries()) {
      y = checkNewPage(doc, y, pageHeight)
      const startY = y + 3
      doc.setFillColor(255, 255, 255)
      doc.roundedRect(20, startY, pageWidth - 40, 20, 3, 3, "F")

      doc.setFont("helvetica", "bold")
      doc.setTextColor(blue[0], blue[1], blue[2])
      doc.setFontSize(10)
      doc.text(`${i + 1}. ${p.name}`, 26, startY + 8)

      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.setTextColor(gray[0], gray[1], gray[2])
      if (p.tooth) doc.text(`Tooth: ${p.tooth}`, 26, startY + 15)
      if (p.status) {
        const color = p.status.toLowerCase() === "completed" ? green : red
        doc.setTextColor(color[0], color[1], color[2])
        doc.text(`Status: ${p.status}`, pageWidth - 26, startY + 15, { align: "right" })
        doc.setTextColor(0, 0, 0)
      }

      y += 23
      if (p.description) {
        const desc = doc.splitTextToSize(`Description: ${p.description}`, pageWidth - 50)
        doc.text(desc, 28, y)
        y += desc.length * 4 + 4
      }
    }
  } else {
    y = drawInfoCard(doc, ["No procedures recorded."], y, softGray)
  }

  /* -------------------- FINDINGS -------------------- */
  y = checkNewPage(doc, y, pageHeight)
  y = drawSectionTitle(doc, "CLINICAL FINDINGS", y, blue)
  y = drawParagraphCard(doc, report.findings || "No findings recorded.", y, pageWidth)

  /* -------------------- NOTES -------------------- */
  y = checkNewPage(doc, y, pageHeight)
  y = drawSectionTitle(doc, "DOCTOR'S NOTES", y, blue)
  y = drawParagraphCard(doc, report.notes || "No additional notes.", y, pageWidth)

  /* -------------------- NEXT VISIT -------------------- */
  if (report.nextVisit) {
    y = checkNewPage(doc, y, pageHeight)
    y = drawSectionTitle(doc, "NEXT APPOINTMENT", y, green)
    const nextVisit = format(new Date(report.nextVisit), "EEEE, MMMM dd, yyyy 'at' hh:mm a")
    y = drawParagraphCard(doc, `Scheduled for: ${nextVisit}`, y, pageWidth)
  }

  /* -------------------- FOLLOW-UP -------------------- */
  if (report.followUpDetails) {
    y = checkNewPage(doc, y, pageHeight)
    y = drawSectionTitle(doc, "FOLLOW-UP INSTRUCTIONS", y, blue)
    y = drawParagraphCard(doc, report.followUpDetails, y, pageWidth)
  }

  /* -------------------- DYNAMIC SIGNATURE -------------------- */
  if (y > pageHeight - 70) {
    doc.addPage()
    y = 40
  }
  const signatureY = y + 10

  doc.setFillColor(softGray[0], softGray[1], softGray[2])
  doc.roundedRect(90, signatureY, 100, 38, 3, 3, "F")

  doc.setDrawColor(120, 120, 120)
  doc.line(110, signatureY + 22, 180, signatureY + 22)

  doc.setFont("helvetica", "bold")
  doc.setFontSize(10)
  doc.setTextColor(30, 30, 30)
  doc.text(`${report.doctorId?.name || "Attending Dentist"}`, 145, signatureY + 30, { align: "center" })
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.setTextColor(90, 90, 90)
  



  /* -------------------- FOOTER -------------------- */
  doc.setFillColor(blue[0], blue[1], blue[2])
  doc.rect(0, pageHeight - 14, pageWidth, 14, "F")
  doc.setFontSize(8)
  doc.setTextColor(255, 255, 255)
  doc.text("Dr. Mohammad Alsheikh Dental Center — Compassion. Precision. Care.", 10, pageHeight - 6)
  

  const patientName = report.patientId?.name?.replace(/\s+/g, "_") || "Patient"
  const dateStr = format(new Date(report.createdAt), "yyyy-MM-dd")
  doc.save(`Dental_Report_${patientName}_${dateStr}.pdf`)
}

/* -------------------- HELPERS -------------------- */
function drawSectionTitle(doc, title, y, color) {
  y += 8
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.setTextColor(color[0], color[1], color[2])
  doc.text(title, 20, y)
  doc.setDrawColor(220, 220, 220)
  doc.line(20, y + 1.5, doc.internal.pageSize.getWidth() - 20, y + 1.5)
  return y + 4
}

function drawInfoCard(doc, lines, y, bgColor) {
  const height = lines.length * 5.5 + 8
  doc.setFillColor(bgColor[0], bgColor[1], bgColor[2])
  doc.roundedRect(20, y + 2, doc.internal.pageSize.getWidth() - 40, height, 3, 3, "F")
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  lines.forEach((line, i) => doc.text(line, 28, y + 8 + i * 5.5))
  return y + height + 6
}

function drawParagraphCard(doc, text, y, width) {
  const lines = doc.splitTextToSize(text, width - 50)
  const height = lines.length * 4.8 + 10
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(20, y + 2, width - 40, height, 3, 3, "F")
  doc.setFontSize(9)
  doc.text(lines, 28, y + 9)
  return y + height + 6
}

function checkNewPage(doc, y, pageHeight) {
  if (y > pageHeight - 70) {
    doc.addPage()
    return 35
  }
  return y
}
