import { NextRequest, NextResponse } from "next/server"
import { ToothChart, connectDB } from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    const chart = await ToothChart.findById(params.id)
    if (!chart) return NextResponse.json({ error: "Tooth chart not found" }, { status: 404 })

    if (payload.role === "doctor" && chart.doctorId.toString() !== payload.userId) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const updates = await request.json()
    Object.assign(chart, updates, { lastReview: new Date() })
    await chart.save()

    return NextResponse.json({ success: true, chart })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to update tooth chart" }, { status: 500 })
  }
}
