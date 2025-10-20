import { NextRequest, NextResponse } from "next/server"
import { Appointment, connectDB } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    if (payload.role === "doctor") return NextResponse.json({ error: "Access denied" }, { status: 403 })

    const { id } = params
    const updateData = await request.json()

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
