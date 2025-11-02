import { type NextRequest, NextResponse } from "next/server"
import { connectDB, AppointmentReport } from "@/lib/db"
import { encryptData } from "@/lib/encryption"

export async function POST(request: NextRequest) {
  try {
    const { appointmentId } = await request.json()

    if (!appointmentId) {
      return NextResponse.json({ error: "appointmentId is required" }, { status: 400 })
    }

    await connectDB()

    // Check if report exists for this appointment
    const report = await AppointmentReport.findOne({ appointmentId })
    if (!report) {
      return NextResponse.json({ error: "No report found for this appointment" }, { status: 404 })
    }

    // Generate encrypted token
    const tokenData = JSON.stringify({
      appointmentId: appointmentId.toString(),
      patientId: report.patientId.toString(),
    })
    const token = encryptData(tokenData)

    // Generate public URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const publicLink = `${appUrl}/public/reports/${token}`

    return NextResponse.json({
      success: true,
      link: publicLink,
      token: token,
      appointmentId: appointmentId,
      message: "Copy the link above and open it in your browser to test",
    })
  } catch (error) {
    console.error("Error generating report link:", error)
    return NextResponse.json({ error: "Failed to generate report link" }, { status: 500 })
  }
}
