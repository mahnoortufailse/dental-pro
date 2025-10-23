//@ts-nocheck
import { type NextRequest, NextResponse } from "next/server"
import { Patient, User, connectDB } from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import { Types } from "mongoose"
import { generateStrongPassword, formatPhoneForDatabase } from "@/lib/validation"

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    const query: any = {}
    if (payload.role === "doctor") {
      query.assignedDoctorId = new Types.ObjectId(payload.userId)
      console.log("[v0] Doctor filter - userId:", payload.userId, "ObjectId:", query.assignedDoctorId)
    }

    console.log("[v0] Fetching patients with query:", query)
    const patients = await Patient.find(query).populate("assignedDoctorId", "name email specialty")
    console.log("[v0] Found patients:", patients.length, "for role:", payload.role)

    if (payload.role === "doctor") {
      patients.forEach((p) => {
        console.log("[v0] Patient:", p.name, "assigned to:", p.assignedDoctorId?._id)
      })
    }

    return NextResponse.json({ success: true, patients })
  } catch (error) {
    console.error("[v0] GET /api/patients error:", error)
    return NextResponse.json({ error: "Failed to fetch patients" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    if (payload.role === "doctor") return NextResponse.json({ error: "Doctors cannot add patients" }, { status: 403 })

    const {
      name,
      phone,
      email,
      dob,
      insuranceProvider,
      allergies = [],
      medicalConditions = [],
      assignedDoctorId,
      idNumber,
      address,
      insuranceNumber,
    } = await request.json()

    if (!name || !phone || !email || !dob || !insuranceProvider) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Enhanced phone validation with better error messages
    console.log("[v0] Received phone:", phone, "Type:", typeof phone)
    
    if (!phone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

    const phoneStr = String(phone).trim()
    
    if (phoneStr === "") {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 })
    }

   

    const phoneDigits = phoneStr.slice(1)
    if (!/^\d+$/.test(phoneDigits)) {
      return NextResponse.json({ error: "Phone number must contain only digits after +" }, { status: 400 })
    }

    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      return NextResponse.json({ error: "Phone number must be 10-15 digits after +" }, { status: 400 })
    }

    const existingPatient = await Patient.findOne({ email: email.toLowerCase() })
    if (existingPatient) {
      console.log("[v0] Duplicate email attempt:", email)
      return NextResponse.json({ error: "Email already exists. Please use a different email." }, { status: 409 })
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      console.log("[v0] Email exists in staff records:", email)
      return NextResponse.json(
        { error: "Email already exists in staff records. Please use a different email." },
        { status: 409 },
      )
    }

    if (!assignedDoctorId) {
      return NextResponse.json({ error: "Doctor assignment is required" }, { status: 400 })
    }

    if (!Types.ObjectId.isValid(assignedDoctorId)) {
      console.error("[v0] Invalid doctor ID format:", assignedDoctorId)
      return NextResponse.json({ error: "Invalid doctor ID format" }, { status: 400 })
    }

    const missingCredentials = []
    if (!phone) missingCredentials.push("Phone")
    if (!email) missingCredentials.push("Email")
    if (!dob) missingCredentials.push("Date of Birth")
    if (!insuranceProvider) missingCredentials.push("Insurance Provider")

    const doctor = await User.findById(assignedDoctorId)
    if (!doctor) {
      return NextResponse.json({ error: "Selected doctor not found" }, { status: 404 })
    }

    if (doctor.role !== "doctor") {
      return NextResponse.json({ error: "Selected user is not a doctor" }, { status: 400 })
    }

    console.log("[v0] Creating patient with doctor:", doctor._id, "doctor name:", doctor.name)

    const strongPassword = generateStrongPassword()
    const formattedPhone = formatPhoneForDatabase(phone)

    const newPatient = await Patient.create({
      name,
      phone: formattedPhone,
      email: email.toLowerCase(),
      dob,
      idNumber,
      address,
      insuranceProvider,
      insuranceNumber,
      allergies,
      medicalConditions,
      status: "active",
      balance: 0,
      password: strongPassword,
      assignedDoctorId: doctor._id,
      doctorHistory: [{ doctorId: doctor._id, doctorName: doctor.name, startDate: new Date() }],
      medicalHistory: "",
      credentialStatus: missingCredentials.length === 0 ? "complete" : "incomplete",
      missingCredentials,
    })

    try {
      const { sendPatientCredentials } = await import("@/lib/email")
      await sendPatientCredentials(email, name, strongPassword)
      console.log("[v0] Strong password email sent to patient:", email)
    } catch (emailError) {
      console.error("[v0] Failed to send email:", emailError)
    }

    await newPatient.populate("assignedDoctorId", "name email specialty")
    console.log("[v0] Patient created successfully:", newPatient._id)

    return NextResponse.json({ success: true, patient: newPatient })
  } catch (error) {
    console.error("[v0] POST /api/patients error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to add patient"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}