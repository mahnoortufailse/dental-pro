//@ts-nocheck
import { type NextRequest, NextResponse } from "next/server"
import { User, connectDB } from "@/lib/db"
import { sendPasswordResetEmail } from "@/lib/email"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const { email, userType } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    if (!userType || (userType !== "staff" && userType !== "patient")) {
      return NextResponse.json({ error: "Invalid user type" }, { status: 400 })
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("[v0] Email credentials not configured")
      return NextResponse.json(
        { error: "Email service is not configured. Please contact the administrator." },
        { status: 500 },
      )
    }

    const user = await User.findOne({ email: email.toLowerCase() })

    if (!user) {
      // Don't reveal if email exists for security
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, a password reset link has been sent.",
      })
    }

    const resetToken = crypto.randomBytes(32).toString("hex")
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex")
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    await User.findByIdAndUpdate(user._id, {
      resetToken: resetTokenHash,
      resetTokenExpiry,
    })

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${resetToken}&type=${userType}`

    try {
      await sendPasswordResetEmail(email, user.name, resetUrl)
      console.log("[v0] Password reset email sent to", userType + ":", email)
    } catch (emailError) {
      console.error("[v0] Failed to send password reset email:", emailError)
      // Clear the reset token if email fails
      await User.findByIdAndUpdate(user._id, {
        resetToken: null,
        resetTokenExpiry: null,
      })
      return NextResponse.json(
        { error: "Failed to send password reset email. Please try again later." },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, a password reset link has been sent.",
    })
  } catch (error) {
    console.error("[v0] Forgot password error:", error)
    return NextResponse.json({ error: "Failed to process password reset request" }, { status: 500 })
  }
}
