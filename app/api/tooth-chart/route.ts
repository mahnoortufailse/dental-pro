import { type NextRequest, NextResponse } from "next/server"
import { ToothChart, connectDB } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    if (payload.role === "receptionist") return NextResponse.json({ error: "Access denied" }, { status: 403 })

    const charts = await ToothChart.find({})
    return NextResponse.json({ success: true, charts })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to fetch tooth charts" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    if (payload.role === "receptionist") return NextResponse.json({ error: "Access denied" }, { status: 403 })

    const { patientId, overallNotes } = await request.json()
    if (!patientId) return NextResponse.json({ error: "Patient ID is required" }, { status: 400 })

    const teeth: Record<number, any> = {}
    for (let i = 1; i <= 32; i++) teeth[i] = { status: "healthy", notes: "", lastUpdated: new Date() }

    const newChart = await ToothChart.create({
      patientId,
      doctorId: payload.userId,
      teeth,
      overallNotes: overallNotes || "",
      lastReview: new Date(),
    })

    return NextResponse.json({ success: true, chart: newChart })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to create tooth chart" }, { status: 500 })
  }
}
