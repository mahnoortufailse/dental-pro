import { type NextRequest, NextResponse } from "next/server"
import { ToothChart, connectDB } from "@/lib/db"
import { verifyToken, verifyPatientToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get("patientId")

    let payload = verifyToken(token)
    let isPatient = false

    if (!payload) {
      // Try patient token (base64-encoded patient ID)
      const decodedPatientId = verifyPatientToken(token)
      if (decodedPatientId) {
        isPatient = true
        payload = { userId: decodedPatientId, email: "", role: "patient" as any, name: "" }
      }
    }

    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // If patient is requesting, they can only access their own chart
    if (isPatient && patientId && patientId !== payload.userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const queryPatientId = patientId || payload.userId
    const chart = await ToothChart.findOne({ patientId: queryPatientId.toString() })

    console.log("[v0] Tooth chart query result:", { patientId: queryPatientId, found: !!chart })
    return NextResponse.json({ success: true, toothChart: chart || null })
  } catch (error) {
    console.error("[v0] Tooth chart API error:", error)
    return NextResponse.json({ error: "Failed to fetch tooth charts", details: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let payload = verifyToken(token)
    let isPatient = false

    if (!payload) {
      const decodedPatientId = verifyPatientToken(token)
      if (decodedPatientId) {
        isPatient = true
        payload = { userId: decodedPatientId, email: "", role: "patient" as any, name: "" }
      }
    }

    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Patients cannot create tooth charts
    if (isPatient) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    if (payload.role === "receptionist") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { patientId, overallNotes } = await request.json()
    if (!patientId) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 })
    }

    const teeth: Record<number, any> = {}
    for (let i = 1; i <= 32; i++) {
      teeth[i] = { status: "healthy", notes: "", lastUpdated: new Date() }
    }

    const newChart = await ToothChart.create({
      patientId: patientId.toString(),
      doctorId: payload.userId,
      teeth,
      overallNotes: overallNotes || "",
      lastReview: new Date(),
    })

    return NextResponse.json({ success: true, chart: newChart })
  } catch (error) {
    console.error("[v0] Tooth chart creation error:", error)
    return NextResponse.json({ error: "Failed to create tooth chart" }, { status: 500 })
  }
}
