import { type NextRequest, NextResponse } from "next/server"
import { User, connectDB } from "@/lib/db"
import { generateToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password required" }, { status: 400 })
    }

    const user = await User.findOne({
      $or: [{ username }, { email: username }],
    })

    if (!user || user.password !== password) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    })

    return NextResponse.json({
      success: true,
      token,
      user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
    })
  } catch (error) {
    console.error("[v0] Login error:", error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
