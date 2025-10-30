import { type NextRequest, NextResponse } from "next/server"
import { Appointment, connectDB, User } from "@/lib/db"
import { verifyToken, verifyPatientToken } from "@/lib/auth"
import { sendAppointmentConfirmation } from "@/lib/whatsapp-service"
import { validateAppointmentScheduling } from "@/lib/appointment-validation"

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const token = request.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyToken(token)
    let patientId: string | null = null

    if (!payload) {
      // Try patient token
      patientId = verifyPatientToken(token)
      if (!patientId) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 })
      }
    }

    const query: any = {}

    if (payload?.role === "doctor") {
      // For doctors, show only their appointments
      query.doctorId = payload.userId
      console.log("  Doctor fetching appointments - doctorId:", payload.userId)
    } else if (patientId) {
      // For patients, show only their appointments
      query.patientId = patientId
      console.log("  Patient fetching appointments - patientId:", patientId)
    }
    // For admin and receptionist, show all appointments

    const appointments = await Appointment.find(query).sort({
      date: -1,
      time: -1,
    })

    console.log("  Found appointments:", appointments.length, "for query:", query)

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
        roomNumber: apt.roomNumber,
        duration: apt.duration,
      })),
    })
  } catch (error) {
    console.error("  Get appointments error:", error)
    return NextResponse.json({ error: "Failed to fetch appointments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    console.log("[DEBUG] Database connected")

    const token = request.headers.get("authorization")?.split(" ")[1]
    console.log("[DEBUG] Token received:", token ? "Yes" : "No")

    if (!token) {
      console.warn("[DEBUG] No token found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyToken(token)
    console.log("[DEBUG] Token payload:", payload)

    if (!payload) {
      console.warn("[DEBUG] Invalid token")
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { patientId, patientName, doctorId, doctorName, date, time, type, roomNumber, duration } =
      await request.json()
    console.log("[DEBUG] Appointment data:", {
      patientId,
      patientName,
      doctorId,
      doctorName,
      date,
      time,
      type,
    })

    const validation = await validateAppointmentScheduling(doctorId, date, time, duration || 30)
    if (!validation.isValid) {
      console.warn("[DEBUG] Validation failed:", validation.error)
      return NextResponse.json({ error: validation.error }, { status: 409 })
    }

    const doctor = await User.findById(doctorId)
    console.log("[DEBUG] Doctor found:", doctor ? doctor.name : "No doctor found")

    const newAppointment = await Appointment.create({
      patientId,
      patientName,
      doctorId: doctorId.toString(),
      doctorName,
      date,
      time,
      type,
      status: "confirmed",
      roomNumber,
      duration: duration || 30,
    })
    console.log("[DEBUG] Appointment created:", newAppointment._id.toString())

    console.log("[DEBUG] Looking up patient with ID:", patientId)

    // Fetch patient phone number from Patient collection
    const { Patient } = await import("@/lib/db")
    const patient = await Patient.findById(patientId)

    console.log("[DEBUG] Patient found:", patient ? patient.name : "No patient found")
    console.log("[DEBUG] Patient phone:", patient?.phone)

    if (patient && patient.phone) {
      const appointmentId = newAppointment._id.toString()
      console.log("[DEBUG] Sending WhatsApp confirmation for:", {
        to: patient?.phone,
        patientName,
        type,
        date,
        time,
        doctorName,
        appointmentId,
      })

      const whatsappResult = await sendAppointmentConfirmation(
        patient?.phone,
        patientName,
        type || "Appointment",
        date,
        time,
        doctorName,
        appointmentId,
      )

      console.log("[DEBUG] WhatsApp result:", whatsappResult)

      if (!whatsappResult.success) {
        console.warn("  WhatsApp notification failed for appointment creation:", whatsappResult.error)
      } else {
        console.log("  WhatsApp appointment confirmation sent:", whatsappResult.messageId)
      }
    } else {
      console.warn("[DEBUG] Patient phone missing — WhatsApp message skipped")
    }

    if (patient && patient.email) {
      console.log("  Sending email confirmation to patient:", patient.email)
      const { sendAppointmentConfirmationEmail } = await import("@/lib/nodemailer-service")
      const emailResult = await sendAppointmentConfirmationEmail(
        patient.email,
        patientName,
        doctorName,
        date,
        time,
        type || "Appointment",
      )

      if (!emailResult.success) {
        console.warn("  Email notification failed for appointment creation:", emailResult.error)
      } else {
        console.log("  Email appointment confirmation sent:", emailResult.messageId)
      }
    } else {
      console.warn("  Patient email missing — Email message skipped")
    }

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
        roomNumber: newAppointment.roomNumber,
        duration: newAppointment.duration,
      },
    })
  } catch (error) {
    console.error("  Add appointment error:", error)
    return NextResponse.json({ error: "Failed to create appointment" }, { status: 500 })
  }
}
