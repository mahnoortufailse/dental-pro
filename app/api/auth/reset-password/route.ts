//@ts-nocheck
import { type NextRequest, NextResponse } from "next/server"
import { User, connectDB } from "@/lib/db"
import { hashPassword } from "@/lib/encryption"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const { token, password, userType } = await request.json()

    if (!token || !password || !userType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (userType !== "staff" && userType !== "patient") {
      return NextResponse.json({ error: "Invalid user type" }, { status: 400 })
    }

    const resetTokenHash = crypto.createHash("sha256").update(token).digest("hex")

    const user = await User.findOne({
      resetToken: resetTokenHash,
      resetTokenExpiry: { $gt: new Date() },
    })

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 })
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        {
          error: "Password must be at least 8 characters with uppercase, number, and special character",
        },
        { status: 400 },
      )
    }

    const hashedPassword = await hashPassword(password)

    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    })

    console.log("[v0] Password reset successfully for", userType + ":", user.email)

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully. You can now login with your new password.",
    })
  } catch (error) {
    console.error("[v0] Reset password error:", error)
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 })
  }
}
