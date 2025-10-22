import { type NextRequest, NextResponse } from "next/server"
import { Appointment, connectDB } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    const { id } = params
    const updateData = await request.json()

    if (payload.role === "doctor") {
      // Doctors can only update status to "cancelled" or "completed"
      if (updateData.status && !["cancelled", "completed"].includes(updateData.status)) {
        return NextResponse.json({ error: "Doctors can only cancel or complete appointments" }, { status: 403 })
      }
      // Doctors can only update their own appointments
      const appointment = await Appointment.findById(id)
      if (appointment && appointment.doctorId !== payload.userId) {
        return NextResponse.json({ error: "You can only manage your own appointments" }, { status: 403 })
      }
    } else if (payload.role !== "admin" && payload.role !== "receptionist") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const updatedAppointment = await Appointment.findByIdAndUpdate(id, updateData, { new: true })

    if (!updatedAppointment) return NextResponse.json({ error: "Appointment not found" }, { status: 404 })

    return NextResponse.json({ success: true, appointment: updatedAppointment })
  } catch (error) {
    console.error("[Appointments PUT] Error:", error)
    return NextResponse.json({ error: "Failed to update appointment" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    if (payload.role === "doctor") return NextResponse.json({ error: "Access denied" }, { status: 403 })

    const { id } = params
    const deletedAppointment = await Appointment.findByIdAndDelete(id)
    if (!deletedAppointment) return NextResponse.json({ error: "Appointment not found" }, { status: 404 })

    return NextResponse.json({ success: true, message: "Appointment deleted" })
  } catch (error) {
    console.error("[Appointments DELETE] Error:", error)
    return NextResponse.json({ error: "Failed to delete appointment" }, { status: 500 })
  }
}
