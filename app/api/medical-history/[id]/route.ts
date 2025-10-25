//@ts-nocheck
import { type NextRequest, NextResponse } from "next/server"
import { MedicalHistory, connectDB, Patient } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    await connectDB()
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    if (payload.role !== "doctor") {
      return NextResponse.json({ error: "Only doctors can edit medical history" }, { status: 403 })
    }

    const { entryIndex, entry } = await request.json()

    if (entryIndex === undefined || !entry) {
      return NextResponse.json({ error: "Missing required fields: entryIndex and entry" }, { status: 400 })
    }

    if (!entry.notes || !entry.findings || !entry.treatment) {
      return NextResponse.json(
        { error: "Missing required fields: notes, findings, and treatment are required" },
        { status: 400 },
      )
    }

    const history = await MedicalHistory.findById(id)
    if (!history) {
      return NextResponse.json({ error: "Medical history not found" }, { status: 404 })
    }

    const patient = await Patient.findById(history.patientId)
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 })
    }

    const entryToEdit = history.entries[entryIndex]
    if (!entryToEdit) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 })
    }

    const entryDoctorId = String(entryToEdit.doctorId || "")
    const currentDoctorId = String(payload.userId || "")

    console.log("[v0] PUT - Comparing doctorIds:", {
      entryDoctorId,
      currentDoctorId,
      match: entryDoctorId === currentDoctorId,
    })

    if (entryDoctorId !== currentDoctorId) {
      return NextResponse.json({ error: "You can only edit entries you created" }, { status: 403 })
    }

    if (entryIndex >= 0 && entryIndex < history.entries.length) {
      history.entries[entryIndex] = {
        ...history.entries[entryIndex],
        ...entry,
        date: history.entries[entryIndex].date,
        doctorId: history.entries[entryIndex].doctorId, // Preserve original doctorId
      }
      history.updatedAt = new Date()
      await history.save()
    } else {
      return NextResponse.json({ error: "Invalid entry index" }, { status: 400 })
    }

    await history.populate("doctorId", "name specialty")
    return NextResponse.json({ success: true, history })
  } catch (error) {
    console.error("[v0] PUT medical history error:", error)
    return NextResponse.json({ error: "Failed to update medical history" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    await connectDB()
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    if (payload.role !== "doctor") {
      return NextResponse.json({ error: "Only doctors can delete medical history" }, { status: 403 })
    }

    const { entryIndex } = await request.json()

    if (entryIndex === undefined) {
      return NextResponse.json({ error: "Entry index required" }, { status: 400 })
    }

    const history = await MedicalHistory.findById(id)
    if (!history) {
      return NextResponse.json({ error: "Medical history not found" }, { status: 404 })
    }

    const patient = await Patient.findById(history.patientId)
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 })
    }

    const entryToDelete = history.entries[entryIndex]
    if (!entryToDelete) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 })
    }

    const entryDoctorId = String(entryToDelete.doctorId || "")
    const currentDoctorId = String(payload.userId || "")

    console.log("[v0] DELETE - Comparing doctorIds:", {
      entryDoctorId,
      currentDoctorId,
      match: entryDoctorId === currentDoctorId,
    })

    if (entryDoctorId !== currentDoctorId) {
      return NextResponse.json({ error: "You can only delete entries you created" }, { status: 403 })
    }

    if (entryIndex >= 0 && entryIndex < history.entries.length) {
      history.entries.splice(entryIndex, 1)
      history.updatedAt = new Date()
      await history.save()
    } else {
      return NextResponse.json({ error: "Invalid entry index" }, { status: 400 })
    }

    await history.populate("doctorId", "name specialty")
    return NextResponse.json({ success: true, history })
  } catch (error) {
    console.error("[v0] DELETE medical history error:", error)
    return NextResponse.json({ error: "Failed to delete medical history entry" }, { status: 500 })
  }
}
