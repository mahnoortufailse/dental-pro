import { type NextRequest, NextResponse } from "next/server"
import { PatientImage, connectDB, Patient } from "@/lib/db"
import { verifyToken, verifyPatientToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = verifyToken(token)
    let patientId: string | null = null

    if (!payload) {
      patientId = verifyPatientToken(token)
      if (!patientId) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 })
      }
    }

    const { searchParams } = new URL(request.url)
    const queryPatientId = searchParams.get("patientId")

    if (!queryPatientId && !patientId) {
      return NextResponse.json({ error: "Patient ID required" }, { status: 400 })
    }

    const finalPatientId = patientId || queryPatientId

    if (payload?.role === "doctor") {
      const patient = await Patient.findById(finalPatientId)
      if (!patient) {
        return NextResponse.json({ error: "Patient not found" }, { status: 404 })
      }

      const isAssignedDoctor = patient.assignedDoctorId?.toString() === payload.userId
      const wasPreviouslyAssigned = patient.doctorHistory?.some((dh: any) => dh.doctorId?.toString() === payload.userId)

      if (!isAssignedDoctor && !wasPreviouslyAssigned) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }
    }

    const images = await PatientImage.find({ patientId: finalPatientId })
      .populate("uploadedBy", "name")
      .sort({ uploadedAt: -1 })

    return NextResponse.json({ success: true, images })
  } catch (error) {
    console.error("[v0] GET patient images error:", error)
    return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 })
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
      return NextResponse.json({ error: "Only doctors can upload images" }, { status: 403 })
    }

    const { patientId, type, title, description, imageUrl, notes } = await request.json()

    if (!patientId || !type || !imageUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const image = await PatientImage.create({
      patientId,
      type,
      title,
      description,
      imageUrl,
      uploadedBy: payload.userId,
      notes,
    })

    await image.populate("uploadedBy", "name")
    return NextResponse.json({ success: true, image })
  } catch (error) {
    console.error("[v0] POST patient image error:", error)
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
  }
}
