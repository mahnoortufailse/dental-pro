import { type NextRequest, NextResponse } from "next/server"
import { AppointmentReport, connectDB } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    const updates = await request.json()
    const report = await AppointmentReport.findByIdAndUpdate(params.id, updates, { new: true })
      .populate("patientId", "name")
      .populate("doctorId", "name specialty")

    if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 })

    return NextResponse.json({ success: true, report })
  } catch (error) {
    console.error("[v0] PUT appointment report error:", error)
    return NextResponse.json({ error: "Failed to update report" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    const report = await AppointmentReport.findById(params.id)
    if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 })

    // Only allow doctors to delete their own reports or admins to delete any report
    if (payload.role === "doctor" && report.doctorId.toString() !== payload.userId) {
      return NextResponse.json({ error: "You can only delete your own reports" }, { status: 403 })
    }

    await AppointmentReport.findByIdAndDelete(params.id)

    return NextResponse.json({ success: true, message: "Report deleted successfully" })
  } catch (error) {
    console.error("[v0] DELETE appointment report error:", error)
    return NextResponse.json({ error: "Failed to delete report" }, { status: 500 })
  }
}
