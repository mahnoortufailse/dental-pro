import { type NextRequest, NextResponse } from "next/server"
import { connectDB, User } from "@/lib/db"
import { sendPatientCredentials } from "@/lib/email"

function generateSecurePassword(length = 12): string {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const lowercase = "abcdefghijklmnopqrstuvwxyz"
  const numbers = "0123456789"
  const special = "!@#$%^&*"
  const all = uppercase + lowercase + numbers + special

  let password = ""
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += special[Math.floor(Math.random() * special.length)]

  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)]
  }

  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("")
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()

    const { email, firstName, lastName, role, adminId } = await request.json()

    // Verify admin authorization
    const admin = await User.findById(adminId)
    if (!admin || admin.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized: Only admins can register staff" }, { status: 403 })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }

    // Generate secure password
    const generatedPassword = generateSecurePassword()

    // Create username from email
    const username = email.split("@")[0]

    // Create new staff user
    const newUser = new User({
      email,
      username,
      password: generatedPassword,
      firstName,
      lastName,
      role,
      userType: "staff",
      isVerified: true,
      createdBy: adminId,
    })

    await newUser.save()

    // Send credentials email using the same template as patients
    const staffName = `${firstName} ${lastName}`
    await sendPatientCredentials(email, staffName, generatedPassword)

    return NextResponse.json(
      {
        success: true,
        message: "Staff member registered successfully. Credentials sent to email.",
        user: {
          id: newUser._id,
          email: newUser.email,
          role: newUser.role,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("[v0] Error registering staff:", error)
    return NextResponse.json({ error: "Failed to register staff member" }, { status: 500 })
  }
}
