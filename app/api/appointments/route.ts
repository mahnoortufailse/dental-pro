import { type NextRequest, NextResponse } from "next/server"
import { Appointment, connectDB, User } from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import { Types } from "mongoose"

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const token = request.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const query: any = {}

    if (payload.role === "doctor") {
      // For doctors, show only their appointments
      query.doctorId = payload.userId
      console.log("[v0] Doctor fetching appointments - doctorId:", payload.userId)
    }
    // For admin and receptionist, show all appointments

    const appointments = await Appointment.find(query).sort({ date: -1, time: -1 })

    console.log("[v0] Found appointments:", appointments.length, "for query:", query)

    return NextResponse.json({
      success: true,
      appointments: appointments.map((apt) => ({
        id: apt._id.toString(),
        patientId: apt.patientId,
        patientName: apt.patientName,
        doctorId: apt.doctorId,
        doctorName: apt.doctorName,
        date: apt.date,
        time: apt.time,
        type: apt.type,
        status: apt.status,
        chair: apt.chair,
        duration: apt.duration,
      })),
    })
  } catch (error) {
    console.error("[v0] Get appointments error:", error)
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const token = request.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (payload.role === "doctor") {
      return NextResponse.json({ error: "Doctors cannot create appointments" }, { status: 403 })
    }

    const { patientId, patientName, doctorId, doctorName, date, time, type, chair, duration } = await request.json()

    if (!patientId || !doctorId || !date || !time) {
      return NextResponse.json({ error: "Missing required fields: patientId, doctorId, date, time" }, { status: 400 })
    }

    if (!Types.ObjectId.isValid(doctorId)) {
      return NextResponse.json({ error: "Invalid doctor ID format" }, { status: 400 })
    }

    const doctor = await User.findById(doctorId)
    if (!doctor || doctor.role !== "doctor") {
      return NextResponse.json({ error: "Invalid doctor selected" }, { status: 400 })
    }

    console.log("[v0] Creating appointment - doctorId:", doctorId, "patientId:", patientId)

    const newAppointment = await Appointment.create({
      patientId,
      patientName,
      doctorId: doctorId.toString(),
      doctorName,
      date,
      time,
      type,
      status: "confirmed",
      chair,
      duration: duration || 30,
    })

    console.log("[v0] Appointment created:", newAppointment._id)

    return NextResponse.json({
      success: true,
      appointment: {
        id: newAppointment._id.toString(),
        patientId: newAppointment.patientId,
        patientName: newAppointment.patientName,
        doctorId: newAppointment.doctorId,
        doctorName: newAppointment.doctorName,
        date: newAppointment.date,
        time: newAppointment.time,
        type: newAppointment.type,
        status: newAppointment.status,
        chair: newAppointment.chair,
        duration: newAppointment.duration,
      },
    })
  } catch (error) {
    console.error("[v0] Add appointment error:", error)
    return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 })
  }
}
