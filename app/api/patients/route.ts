//@ts-nocheck
import { type NextRequest, NextResponse } from "next/server";
import { Patient, User, connectDB } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { Types } from "mongoose";
import {
	generateStrongPassword,
	formatPhoneForDatabase,
} from "@/lib/validation";

export async function GET(request: NextRequest) {
	try {
		await connectDB();
		const token = request.headers.get("authorization")?.split(" ")[1];
		if (!token)
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

		const payload = verifyToken(token);
		if (!payload)
			return NextResponse.json({ error: "Invalid token" }, { status: 401 });

		const query: any = {};
		if (payload.role === "doctor") {
			query.assignedDoctorId = new Types.ObjectId(payload.userId);
			console.log(
				"  Doctor filter - userId:",
				payload.userId,
				"ObjectId:",
				query.assignedDoctorId
			);
		}

		console.log("  Fetching patients with query:", query);
		const patients = await Patient.find(query).populate(
			"assignedDoctorId",
			"name email specialty"
		);
		console.log(
			"  Found patients:",
			patients.length,
			"for role:",
			payload.role
		);

		if (payload.role === "doctor") {
			patients.forEach((p) => {
				console.log(
					"  Patient:",
					p.name,
					"assigned to:",
					p.assignedDoctorId?._id
				);
			});
		}

		return NextResponse.json({ success: true, patients });
	} catch (error) {
		console.error("  GET /api/patients error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch patients" },
			{ status: 500 }
		);
	}
}

// Enhanced patient creation with credential validation
export async function POST(request: NextRequest) {
	try {
		await connectDB();
		const token = request.headers.get("authorization")?.split(" ")[1];
		if (!token)
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

		const payload = verifyToken(token);
		if (!payload)
			return NextResponse.json({ error: "Invalid token" }, { status: 401 });
		if (payload.role === "doctor")
			return NextResponse.json(
				{ error: "Doctors cannot add patients" },
				{ status: 403 }
			);

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
		} = await request.json();

		// Enhanced validation for critical credentials
		const missingCriticalCredentials = [];
		if (!name?.trim()) missingCriticalCredentials.push("Name");
		if (!phone?.trim()) missingCriticalCredentials.push("Phone");
		if (!email?.trim()) missingCriticalCredentials.push("Email");
		if (!dob?.trim()) missingCriticalCredentials.push("Date of Birth");
		if (!insuranceProvider?.trim())
			missingCriticalCredentials.push("Insurance Provider");
		if (!idNumber?.trim()) missingCriticalCredentials.push("ID Number");

		if (missingCriticalCredentials.length > 0) {
			return NextResponse.json(
				{
					error: `Missing critical patient credentials: ${missingCriticalCredentials.join(
						", "
					)}`,
				},
				{ status: 400 }
			);
		}

		// Enhanced phone validation
		console.log("  Received phone:", phone, "Type:", typeof phone);

		if (!phone) {
			return NextResponse.json(
				{ error: "Phone number is required" },
				{ status: 400 }
			);
		}

		const phoneStr = String(phone).trim();

		if (phoneStr === "") {
			return NextResponse.json(
				{ error: "Phone number is required" },
				{ status: 400 }
			);
		}

		const phoneDigits = phoneStr.slice(1);
		if (!/^\d+$/.test(phoneDigits)) {
			return NextResponse.json(
				{ error: "Phone number must contain only digits after +" },
				{ status: 400 }
			);
		}

		if (phoneDigits.length < 10 || phoneDigits.length > 15) {
			return NextResponse.json(
				{ error: "Phone number must be 10-15 digits after +" },
				{ status: 400 }
			);
		}

		// Check for existing patients/users
		const existingPatient = await Patient.findOne({
			email: email.toLowerCase(),
		});
		if (existingPatient) {
			console.log("  Duplicate email attempt:", email);
			return NextResponse.json(
				{ error: "Email already exists. Please use a different email." },
				{ status: 409 }
			);
		}

		const existingUser = await User.findOne({ email: email.toLowerCase() });
		if (existingUser) {
			console.log("  Email exists in staff records:", email);
			return NextResponse.json(
				{
					error:
						"Email already exists in staff records. Please use a different email.",
				},
				{ status: 409 }
			);
		}

		if (!assignedDoctorId) {
			return NextResponse.json(
				{ error: "Doctor assignment is required" },
				{ status: 400 }
			);
		}

		if (!Types.ObjectId.isValid(assignedDoctorId)) {
			console.error("  Invalid doctor ID format:", assignedDoctorId);
			return NextResponse.json(
				{ error: "Invalid doctor ID format" },
				{ status: 400 }
			);
		}

		// Check for missing non-critical credentials
		const missingNonCriticalCredentials = [];
		if (!insuranceNumber?.trim())
			missingNonCriticalCredentials.push("Insurance Number");
		if (!address?.trim()) missingNonCriticalCredentials.push("Address");

		const doctor = await User.findById(assignedDoctorId);
		if (!doctor) {
			return NextResponse.json(
				{ error: "Selected doctor not found" },
				{ status: 404 }
			);
		}

		if (doctor.role !== "doctor") {
			return NextResponse.json(
				{ error: "Selected user is not a doctor" },
				{ status: 400 }
			);
		}

		console.log(
			"  Creating patient with doctor:",
			doctor._id,
			"doctor name:",
			doctor.name
		);

		const strongPassword = generateStrongPassword();
		const formattedPhone = formatPhoneForDatabase(phone);

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
			doctorHistory: [
				{
					doctorId: doctor._id,
					doctorName: doctor.name,
					startDate: new Date(),
				},
			],
			medicalHistory: "",
			// Set credential status based on missing non-critical credentials
			credentialStatus:
				missingNonCriticalCredentials.length === 0 ? "complete" : "incomplete",
			missingCredentials: missingNonCriticalCredentials,
		});

		try {
			const { sendPatientCredentials } = await import("@/lib/email");
			await sendPatientCredentials(email, name, strongPassword);
			console.log("  Strong password email sent to patient:", email);
		} catch (emailError) {
			console.error("  Failed to send email:", emailError);
		}

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

		await newPatient.populate("assignedDoctorId", "name email specialty");
		console.log("  Patient created successfully:", newPatient._id);

		return NextResponse.json({ success: true, patient: newPatient });
	} catch (error) {
		console.error("  POST /api/patients error:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Failed to add patient";
		return NextResponse.json({ error: errorMessage }, { status: 500 });
	}
}

// Also update the PUT endpoint for patient updates
export async function PUT(
	request: NextRequest,
	{ params }: { params: { id: string } }
) {
	try {
		await connectDB();
		const token = request.headers.get("authorization")?.split(" ")[1];
		if (!token)
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

		const payload = verifyToken(token);
		if (!payload)
			return NextResponse.json({ error: "Invalid token" }, { status: 401 });

		const { id } = params;
		const updateData = await request.json();

		// Validate critical credentials if they're being updated
		if (
			updateData.phone ||
			updateData.email ||
			updateData.dob ||
			updateData.insuranceProvider ||
			updateData.idNumber
		) {
			const patient = await Patient.findById(id);
			if (!patient) {
				return NextResponse.json(
					{ error: "Patient not found" },
					{ status: 404 }
				);
			}

			const mergedData = { ...patient.toObject(), ...updateData };

			const missingCriticalCredentials = [];
			if (!mergedData.name?.trim()) missingCriticalCredentials.push("Name");
			if (!mergedData.phone?.trim()) missingCriticalCredentials.push("Phone");
			if (!mergedData.email?.trim()) missingCriticalCredentials.push("Email");
			if (!mergedData.dob?.trim())
				missingCriticalCredentials.push("Date of Birth");
			if (!mergedData.insuranceProvider?.trim())
				missingCriticalCredentials.push("Insurance Provider");
			if (!mergedData.idNumber?.trim())
				missingCriticalCredentials.push("ID Number");

			if (missingCriticalCredentials.length > 0) {
				return NextResponse.json(
					{
						error: `Cannot update: Missing critical patient credentials: ${missingCriticalCredentials.join(
							", "
						)}`,
					},
					{ status: 400 }
				);
			}
		}

		// Update credential status based on non-critical fields
		if (
			updateData.insuranceNumber !== undefined ||
			updateData.address !== undefined
		) {
			const patient = await Patient.findById(id);
			if (patient) {
				const mergedData = { ...patient.toObject(), ...updateData };

				const missingNonCriticalCredentials = [];
				if (!mergedData.insuranceNumber?.trim())
					missingNonCriticalCredentials.push("Insurance Number");
				if (!mergedData.address?.trim())
					missingNonCriticalCredentials.push("Address");

				updateData.credentialStatus =
					missingNonCriticalCredentials.length === 0
						? "complete"
						: "incomplete";
				updateData.missingCredentials = missingNonCriticalCredentials;
			}
		}

		const updatedPatient = await Patient.findByIdAndUpdate(id, updateData, {
			new: true,
			runValidators: true,
		}).populate("assignedDoctorId", "name email specialty");

		if (!updatedPatient) {
			return NextResponse.json({ error: "Patient not found" }, { status: 404 });
		}

		return NextResponse.json({ success: true, patient: updatedPatient });
	} catch (error) {
		console.error("  PUT /api/patients error:", error);
		const errorMessage =
			error instanceof Error ? error.message : "Failed to update patient";
		return NextResponse.json({ error: errorMessage }, { status: 500 });
	}
}
