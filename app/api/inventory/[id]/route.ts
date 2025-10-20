import { type NextRequest, NextResponse } from "next/server"
import { Inventory, connectDB } from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import { Types } from "mongoose"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { id } = params
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const deleted = await Inventory.findByIdAndDelete(id)
    if (!deleted) return NextResponse.json({ error: "Item not found" }, { status: 404 })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete inventory error:", error)
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload || payload.role !== "admin") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { id } = params
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
    }

    const { name, quantity, minStock, unit, supplier } = await request.json()

    const updatedItem = await Inventory.findByIdAndUpdate(
      id,
      { name, quantity, minStock, unit, supplier },
      { new: true }
    )

    if (!updatedItem) return NextResponse.json({ error: "Item not found" }, { status: 404 })

    return NextResponse.json({ success: true, item: updatedItem })
  } catch (error) {
    console.error("Update inventory error:", error)
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 })
  }
}
