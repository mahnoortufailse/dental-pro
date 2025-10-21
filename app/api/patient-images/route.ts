import { type NextRequest, NextResponse } from "next/server"
import { PatientImage, connectDB } from "@/lib/db"
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

    const images = await PatientImage.find({ patientId }).populate("uploadedBy", "name").sort({ uploadedAt: -1 })

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
