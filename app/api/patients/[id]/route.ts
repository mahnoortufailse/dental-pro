import { type NextRequest, NextResponse } from "next/server"
import { Patient, User, connectDB } from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import { Types } from "mongoose"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    const patient = await Patient.findById(params.id).populate("assignedDoctorId", "name email specialty")
    if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 })

    if (payload.role === "doctor") {
      const doctorId = new Types.ObjectId(payload.userId)
      console.log(
        "[v0] Doctor access check - Doctor ID:",
        doctorId,
        "Patient assigned to:",
        patient.assignedDoctorId?._id,
      )
      if (!patient.assignedDoctorId || !patient.assignedDoctorId._id.equals(doctorId)) {
        console.log(
          "[v0] Access denied: Doctor",
          payload.userId,
          "trying to access patient assigned to",
          patient.assignedDoctorId?._id,
        )
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }
    }

    return NextResponse.json({ success: true, patient })
  } catch (error) {
    console.error("[v0] Get patient error:", error)
    return NextResponse.json({ error: "Failed to fetch patient" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    const patient = await Patient.findById(params.id)
    if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 })

    const updates = await request.json()
    console.log("[v0] Update request received:", { patientId: params.id, updates })

    if (payload.role === "doctor") {
      patient.medicalHistory = updates.medicalHistory || patient.medicalHistory
      patient.allergies = updates.allergies || patient.allergies
      patient.medicalConditions = updates.medicalConditions || patient.medicalConditions
      console.log("[v0] Doctor updated medical info for patient:", params.id)
    } else {
      // Update basic fields
      if (updates.name) patient.name = updates.name
      if (updates.phone) patient.phone = updates.phone
      if (updates.email) patient.email = updates.email
      if (updates.dob) patient.dob = updates.dob
      if (updates.insuranceProvider) patient.insuranceProvider = updates.insuranceProvider
      if (updates.allergies) patient.allergies = updates.allergies
      if (updates.medicalConditions) patient.medicalConditions = updates.medicalConditions
      if (updates.medicalHistory) patient.medicalHistory = updates.medicalHistory

      if (updates.assignedDoctorId) {
        console.log(
          "[v0] Attempting to update assignedDoctorId:",
          updates.assignedDoctorId,
          "type:",
          typeof updates.assignedDoctorId,
        )

        // Validate the doctor ID format
        if (!Types.ObjectId.isValid(updates.assignedDoctorId)) {
          console.error(
            "[v0] Invalid doctor ID format:",
            updates.assignedDoctorId,
            "type:",
            typeof updates.assignedDoctorId,
          )
          return NextResponse.json({ error: "Invalid doctor ID format" }, { status: 400 })
        }

        // Verify the doctor exists and is actually a doctor
        const doctor = await User.findById(updates.assignedDoctorId)
        if (!doctor) {
          console.error("[v0] Doctor not found:", updates.assignedDoctorId)
          return NextResponse.json({ error: "Selected doctor not found" }, { status: 404 })
        }

        if (doctor.role !== "doctor") {
          console.error("[v0] Selected user is not a doctor:", updates.assignedDoctorId)
          return NextResponse.json({ error: "Selected user is not a doctor" }, { status: 400 })
        }

        const newDoctorId = new Types.ObjectId(updates.assignedDoctorId)

        // Only update doctorHistory if the doctor is actually changing
        if (!patient.assignedDoctorId || !patient.assignedDoctorId.equals(newDoctorId)) {
          patient.assignedDoctorId = newDoctorId

          // Add to doctor history
          if (!patient.doctorHistory) {
            patient.doctorHistory = []
          }

          patient.doctorHistory.push({
            doctorId: newDoctorId,
            doctorName: doctor.name,
            startDate: new Date(),
          })

          console.log("[v0] Updated assignedDoctorId to:", newDoctorId, "doctor name:", doctor.name)
        }
      }
    }

    await patient.save()
    await patient.populate("assignedDoctorId", "name email specialty")

    console.log("[v0] Patient updated successfully:", patient._id, "assigned to:", patient.assignedDoctorId?._id)
    return NextResponse.json({ success: true, patient })
  } catch (error) {
    console.error("[v0] Update patient error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to update patient"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    await connectDB()

    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    if (payload.role !== "admin" && payload.role !== "receptionist") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const deleted = await Patient.findByIdAndDelete(id)
    if (!deleted) return NextResponse.json({ error: "Patient not found" }, { status: 404 })

    console.log("[v0] Patient deleted successfully:", id)
    return NextResponse.json({ success: true, message: "Patient deleted successfully" })
  } catch (error) {
    console.error("[v0] Delete patient error:", error)
    return NextResponse.json({ error: "Failed to delete patient" }, { status: 500 })
  }
}
