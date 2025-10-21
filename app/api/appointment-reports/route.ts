//@ts-nocheck
import { type NextRequest, NextResponse } from "next/server"
import { AppointmentReport, connectDB, Patient, User, Appointment } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const appointmentId = searchParams.get("appointmentId")

    if (!appointmentId) {
      return NextResponse.json({ error: "Appointment ID required" }, { status: 400 })
    }

    const report = await AppointmentReport.findOne({ appointmentId })
      .populate("patientId", "name")
      .populate("doctorId", "name specialty")

    return NextResponse.json({ success: true, report })
  } catch (error) {
    console.error("[v0] GET appointment report error:", error)
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    if (payload.role !== "doctor") {
      return NextResponse.json({ error: "Only doctors can create reports" }, { status: 403 })
    }

    const body = await request.json()
    const { appointmentId, patientId, procedures, findings, notes, nextVisit, followUpDetails } = body

    if (!appointmentId || !String(appointmentId).trim()) {
      return NextResponse.json({ error: "Appointment ID is required" }, { status: 400 })
    }

    if (!patientId || !String(patientId).trim()) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 })
    }

    let proceduresArray = []
    if (Array.isArray(procedures)) {
      proceduresArray = procedures
        .filter((p) => p && String(p).trim())
        .map((p) => ({
          name: String(p).trim(),
          description: "",
          tooth: "",
          status: "completed",
        }))
    } else if (typeof procedures === "string") {
      proceduresArray = procedures
        .split("\n")
        .map((p) => String(p).trim())
        .filter(Boolean)
        .map((p) => ({
          name: p,
          description: "",
          tooth: "",
          status: "completed",
        }))
    }

    if (!proceduresArray || proceduresArray.length === 0) {
      return NextResponse.json({ error: "At least one procedure is required" }, { status: 400 })
    }

    if (!findings || String(findings).trim() === "") {
      return NextResponse.json({ error: "Findings are required" }, { status: 400 })
    }

    if (!notes || String(notes).trim() === "") {
      return NextResponse.json({ error: "Notes are required" }, { status: 400 })
    }

    const patientExists = await Patient.findById(patientId)
    if (!patientExists) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 })
    }

    const doctorExists = await User.findById(payload.userId)
    if (!doctorExists) {
      return NextResponse.json({ error: "Doctor not found" }, { status: 404 })
    }

    const appointmentExists = await Appointment.findById(appointmentId)
    if (!appointmentExists) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 })
    }

    const reportData = {
      appointmentId: String(appointmentId).trim(),
      patientId: String(patientId).trim(),
      doctorId: payload.userId,
      procedures: proceduresArray,
      findings: String(findings).trim(),
      notes: String(notes).trim(),
      nextVisit: nextVisit ? new Date(nextVisit) : null,
      followUpDetails: followUpDetails ? String(followUpDetails).trim() : "",
    }

    console.log("[v0] Creating report with data:", reportData)

    const report = await AppointmentReport.create(reportData)

    if (!report) {
      console.error("[v0] Report creation returned null")
      return NextResponse.json({ error: "Failed to create report in database" }, { status: 500 })
    }

    const populatedReport = await AppointmentReport.findById(report._id)
      .populate("patientId", "name")
      .populate("doctorId", "name specialty")

    console.log("[v0] Report created successfully:", populatedReport)

    return NextResponse.json({ success: true, report: populatedReport })
  } catch (error) {
    console.error("[v0] POST appointment report error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: `Failed to create report: ${errorMessage}` }, { status: 500 })
  }
}
