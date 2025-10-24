//@ts-nocheck
import { type NextRequest, NextResponse } from "next/server"
import { MedicalHistory, connectDB, Patient } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId")

    if (!patientId) {
      return NextResponse.json({ error: "Patient ID required" }, { status: 400 })
    }

    const patient = await Patient.findById(patientId)
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 })
    }

    if (payload.role === "doctor") {
      const isAssignedDoctor = patient.assignedDoctorId?.toString() === payload.userId
      const wasPreviouslyAssigned = patient.doctorHistory?.some((dh: any) => dh.doctorId?.toString() === payload.userId)

      if (!isAssignedDoctor && !wasPreviouslyAssigned) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }
    }

    const history = await MedicalHistory.findOne({ patientId }).populate("doctorId", "name specialty")

    return NextResponse.json({ success: true, history })
  } catch (error) {
    console.error("[v0] GET medical history error:", error)
    return NextResponse.json({ error: "Failed to fetch medical history" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    // Only doctors can create/edit medical history
    if (payload.role !== "doctor") {
      return NextResponse.json({ error: "Only doctors can manage medical history" }, { status: 403 })
    }

    const { patientId, entry } = await request.json()

    if (!patientId || !entry) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    let history = await MedicalHistory.findOne({ patientId })

    if (!history) {
      history = await MedicalHistory.create({
        patientId,
        doctorId: payload.userId,
        entries: [
          {
            ...entry,
            doctorId: payload.userId,
            date: new Date(),
          },
        ],
      })
    } else {
      history.entries.push({
        ...entry,
        doctorId: payload.userId,
        date: new Date(),
      })
      history.updatedAt = new Date()
      await history.save()
    }

    await history.populate("doctorId", "name specialty")
    return NextResponse.json({ success: true, history })
  } catch (error) {
    console.error("[v0] POST medical history error:", error)
    return NextResponse.json({ error: "Failed to save medical history" }, { status: 500 })
  }
}
