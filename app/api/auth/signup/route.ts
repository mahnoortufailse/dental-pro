import { type NextRequest, NextResponse } from "next/server"
import { User, connectDB } from "@/lib/db"
import { generateToken } from "@/lib/auth"
import { validateEmail, validatePassword } from "@/lib/utils"

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const { username, email, password, name, role, phone, specialty } = await request.json()

    // Validation
    if (!username || !email || !password || !name || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!validateEmail(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    if (!validatePassword(password)) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    })

    if (existingUser) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    const newUser = await User.create({
      username,
      email,
      password,
      name,
      role: role as "admin" | "doctor" | "receptionist",
      phone,
      specialty: role === "doctor" ? specialty : undefined,
      active: true,
    })

    // Generate token
    const token = generateToken({
      userId: newUser._id.toString(),
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
    })

    return NextResponse.json({
      success: true,
      token,
      user: { id: newUser._id.toString(), name: newUser.name, email: newUser.email, role: newUser.role },
    })
  } catch (error) {
    console.error("[v0] Signup error:", error)
    return NextResponse.json({ error: "Signup failed" }, { status: 500 })
  }
}
