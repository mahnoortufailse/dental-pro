import { type NextRequest, NextResponse } from "next/server"
import {
  Patient,
  User,
  connectDB,
  ToothChart,
  Appointment,
  PatientImage,
  MedicalHistory,
  AppointmentReport,
  Billing,
} from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import { Types } from "mongoose"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    const patient = await Patient.findById(params.id).populate("assignedDoctorId", "name email specialty")
    if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 })

    if (payload.role === "doctor") {
      const doctorId = new Types.ObjectId(payload.userId)
      console.log("  Doctor access check - Doctor ID:", doctorId, "Patient assigned to:", patient.assignedDoctorId?._id)
      if (!patient.assignedDoctorId || !patient.assignedDoctorId._id.equals(doctorId)) {
        console.log(
          "  Access denied: Doctor",
          payload.userId,
          "trying to access patient assigned to",
          patient.assignedDoctorId?._id,
        )
        return NextResponse.json({ error: "Access denied" }, { status: 403 })
      }
    }

    return NextResponse.json({ success: true, patient })
  } catch (error) {
    console.error("  Get patient error:", error)
    return NextResponse.json({ error: "Failed to fetch patient" }, { status: 500 })
  }
}

// Also update the PUT endpoint for patient updates - FIXED VERSION
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB()
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    const { id } = await params
    const updateData = await request.json()

    console.log("  PUT update data received:", updateData) // Debug log

    // Validate critical credentials if they're being updated
    if (updateData.phone || updateData.email || updateData.dob || updateData.insuranceProvider || updateData.idNumber) {
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

    // ALWAYS recalculate credential status on update - FIXED
    const patient = await Patient.findById(id)
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 })
    }

    // Merge existing data with update data to get complete picture
    const mergedData = { ...patient.toObject(), ...updateData }

    console.log("  Merged data for credential check:", {
      // Debug log
      insuranceNumber: mergedData.insuranceNumber,
      address: mergedData.address,
      insuranceProvider: mergedData.insuranceProvider,
      idNumber: mergedData.idNumber,
    })

    const missingNonCriticalCredentials = []
    if (!mergedData.email?.trim()) missingNonCriticalCredentials.push("Email")
    if (!mergedData.insuranceProvider?.trim()) missingNonCriticalCredentials.push("Insurance Provider")
    if (!mergedData.insuranceNumber?.trim()) missingNonCriticalCredentials.push("Insurance Number")
    if (!mergedData.address?.trim()) missingNonCriticalCredentials.push("Address")

    console.log("  Missing non-critical credentials:", missingNonCriticalCredentials) // Debug log

    // Update credential status based on non-critical fields
    updateData.credentialStatus = missingNonCriticalCredentials.length === 0 ? "complete" : "incomplete"
    updateData.missingCredentials = missingNonCriticalCredentials

    console.log("  Final update data with credential status:", {
      // Debug log
      credentialStatus: updateData.credentialStatus,
      missingCredentials: updateData.missingCredentials,
    })

    const updatedPatient = await Patient.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("assignedDoctorId", "name email specialty")

    if (!updatedPatient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 })
    }

    console.log("  Patient updated successfully:", {
      // Debug log
      id: updatedPatient._id,
      credentialStatus: updatedPatient.credentialStatus,
      missingCredentials: updatedPatient.missingCredentials,
      insuranceNumber: updatedPatient.insuranceNumber,
    })

    if (updateData.assignedDoctorId && updateData.assignedDoctorId !== patient?.assignedDoctorId?.toString()) {
      console.log("  Doctor assignment detected, sending email notification")
      const newDoctor = await User.findById(updateData.assignedDoctorId)

      if (newDoctor && newDoctor.email && updatedPatient.email) {
        const { sendDoctorAssignmentEmail } = await import("@/lib/nodemailer-service")

        const emailResult = await sendDoctorAssignmentEmail(
          newDoctor.email,
          newDoctor.name,
          updatedPatient.name,
          updatedPatient.email,
        )

        if (!emailResult.success) {
          console.warn("  Doctor assignment email failed:", emailResult.error)
        } else {
          console.log("  Doctor assignment email sent successfully:", emailResult.messageId)
        }
      } else {
        console.warn("  Doctor or patient email not found — Doctor assignment email skipped")
      }
    }

    return NextResponse.json({ success: true, patient: updatedPatient })
  } catch (error) {
    console.error("  PUT /api/patients error:", error)
    const errorMessage = error instanceof Error ? error.message : "Failed to update patient"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    await connectDB()

    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const payload = verifyToken(token)
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    if (payload.role !== "admin" && payload.role !== "receptionist") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    console.log("  Starting cascade delete for patient:", id)

    const deletedRecords = {
      toothCharts: 0,
      appointments: 0,
      images: 0,
      medicalHistory: 0,
      reports: 0,
      billing: 0,
    }

    // Delete tooth charts
    const deletedCharts = await ToothChart.deleteMany({ patientId: id })
    deletedRecords.toothCharts = deletedCharts.deletedCount
    console.log("  Deleted tooth charts:", deletedCharts.deletedCount)

    // Delete appointments
    const deletedAppointments = await Appointment.deleteMany({ patientId: id })
    deletedRecords.appointments = deletedAppointments.deletedCount
    console.log("  Deleted appointments:", deletedAppointments.deletedCount)

    // Delete patient images (x-rays, photos, scans)
    const deletedImages = await PatientImage.deleteMany({ patientId: id })
    deletedRecords.images = deletedImages.deletedCount
    console.log("  Deleted patient images:", deletedImages.deletedCount)

    // Delete medical history
    const deletedMedicalHistory = await MedicalHistory.deleteMany({
      patientId: id,
    })
    deletedRecords.medicalHistory = deletedMedicalHistory.deletedCount
    console.log("  Deleted medical history records:", deletedMedicalHistory.deletedCount)

    // Delete appointment reports
    const deletedReports = await AppointmentReport.deleteMany({
      patientId: id,
    })
    deletedRecords.reports = deletedReports.deletedCount
    console.log("  Deleted appointment reports:", deletedReports.deletedCount)

    // Delete billing records
    const deletedBilling = await Billing.deleteMany({ patientId: id })
    deletedRecords.billing = deletedBilling.deletedCount
    console.log("  Deleted billing records:", deletedBilling.deletedCount)

    // Finally, delete the patient
    const deleted = await Patient.findByIdAndDelete(id)
    if (!deleted) return NextResponse.json({ error: "Patient not found" }, { status: 404 })

    console.log("  Patient and all related data deleted successfully:", id)
    return NextResponse.json({
      success: true,
      message: "Patient and all related data deleted successfully",
      deletedRecords,
    })
  } catch (error) {
    console.error("  Delete patient error:", error)
    return NextResponse.json({ error: "Failed to delete patient" }, { status: 500 })
  }
}
