//@ts-nocheck
import { type NextRequest, NextResponse } from "next/server"
import { Patient, User, connectDB } from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import { Types } from "mongoose"
import { formatPhoneForDatabase } from "@/lib/validation"

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
      console.log("  Doctor filter - userId:", payload.userId, "ObjectId:", query.assignedDoctorId)
    }

    console.log("  Fetching patients with query:", query)
    const patients = await Patient.find(query).populate("assignedDoctorId", "name email specialty")
    console.log("  Found patients:", patients.length, "for role:", payload.role)

    if (payload.role === "doctor") {
      patients.forEach((p) => {
        console.log("  Patient:", p.name, "assigned to:", p.assignedDoctorId?._id)
      })
    }

    return NextResponse.json({ success: true, patients })
  } catch (error) {
    console.error("  GET /api/patients error:", error)
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

    // Validate critical credentials
    const missingCriticalCredentials = []
    if (!name?.trim()) missingCriticalCredentials.push("Name")
    if (!phone?.trim()) missingCriticalCredentials.push("Phone")
    if (!dob?.trim()) missingCriticalCredentials.push("Date of Birth")
    if (!idNumber?.trim()) missingCriticalCredentials.push("ID Number")

    if (missingCriticalCredentials.length > 0) {
      return NextResponse.json(
        {
          error: `Missing critical patient credentials: ${missingCriticalCredentials.join(", ")}`,
        },
        { status: 400 },
      )
    }

    // Phone validation
    console.log("  Received phone:", phone, "Type:", typeof phone)

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

    if (email?.trim()) {
      const existingUser = await User.findOne({ email: email.toLowerCase() })
      if (existingUser) {
        console.log("  Email exists in staff records:", email)
        return NextResponse.json(
          {
            error: "Email already exists in staff records. Please use a different email.",
          },
          { status: 409 },
        )
      }
    }

    if (!assignedDoctorId) {
      return NextResponse.json({ error: "Doctor assignment is required" }, { status: 400 })
    }

    if (!Types.ObjectId.isValid(assignedDoctorId)) {
      console.error("  Invalid doctor ID format:", assignedDoctorId)
      return NextResponse.json({ error: "Invalid doctor ID format" }, { status: 400 })
    }

    const doctor = await User.findById(assignedDoctorId)
    if (!doctor) {
      return NextResponse.json({ error: "Selected doctor not found" }, { status: 404 })
    }

    if (doctor.role !== "doctor") {
      return NextResponse.json({ error: "Selected user is not a doctor" }, { status: 400 })
    }

    console.log("  Creating patient with doctor:", doctor._id, "doctor name:", doctor.name)

    const formattedPhone = formatPhoneForDatabase(phone)

    const newPatient = await Patient.create({
      name,
      phone: formattedPhone,
      email: email?.toLowerCase() || "", // Ensure empty string if not provided
      dob,
      idNumber,
      address: address || "",
      insuranceProvider: insuranceProvider || "", // Ensure empty string if not provided
      insuranceNumber: insuranceNumber || "",
      allergies,
      medicalConditions,
      status: "active",
      balance: 0,
      assignedDoctorId: doctor._id,
      doctorHistory: [
        {
          doctorId: doctor._id,
          doctorName: doctor.name,
          startDate: new Date(),
        },
      ],
      medicalHistory: "",
    })
     

    try {
			const { sendAccountConfirmation } = await import(
				"@/lib/whatsapp-service"
			);
			const verificationLink = `${
				process.env.NEXT_PUBLIC_APP_URL
			}/verify-email?email=${encodeURIComponent(email)}`;
			const whatsappResult = await sendAccountConfirmation(
				formattedPhone,
				name,
				verificationLink
			);
			if (!whatsappResult.success) {
				console.warn(
					"  WhatsApp notification failed for patient registration:",
					whatsappResult.error
				);
			} else {
				console.log(
					"  WhatsApp patient registration notification sent:",
					whatsappResult.messageId
				);
			}
		} catch (whatsappError) {
			console.error("  Failed to send WhatsApp notification:", whatsappError);
		}
    await newPatient.populate("assignedDoctorId", "name email specialty")
    console.log("  Patient created successfully:", newPatient._id)

    return NextResponse.json({ success: true, patient: newPatient })
  } catch (error) {
    console.error("  POST /api/patients error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to add patient"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    const { id } = params
    const updateData = await request.json()

    // Validate critical credentials if they're being updated
    if (updateData.phone || updateData.dob || updateData.idNumber) {
      const patient = await Patient.findById(id)
      if (!patient) {
        return NextResponse.json({ error: "Patient not found" }, { status: 404 })
      }

      const mergedData = { ...patient.toObject(), ...updateData }

      const missingCriticalCredentials = []
      if (!mergedData.name?.trim()) missingCriticalCredentials.push("Name")
      if (!mergedData.phone?.trim()) missingCriticalCredentials.push("Phone")
      if (!mergedData.dob?.trim()) missingCriticalCredentials.push("Date of Birth")
      if (!mergedData.idNumber?.trim()) missingCriticalCredentials.push("ID Number")

      if (missingCriticalCredentials.length > 0) {
        return NextResponse.json(
          {
            error: `Cannot update: Missing critical patient credentials: ${missingCriticalCredentials.join(", ")}`,
          },
          { status: 400 },
        )
      }
    }

    const updatedPatient = await Patient.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("assignedDoctorId", "name email specialty")

    if (!updatedPatient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, patient: updatedPatient })
  } catch (error) {
    console.error("  PUT /api/patients error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to update patient"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
