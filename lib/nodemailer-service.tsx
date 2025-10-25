import nodemailer from "nodemailer";

let transporter: any = null;

function getTransporter() {
	if (transporter) return transporter;

	const emailService = process.env.EMAIL_SERVICE || "gmail";
	const emailUser = process.env.EMAIL_USER;
	const emailPassword = process.env.EMAIL_PASS;

	if (!emailUser || !emailPassword) {
		console.error(
			"  Email credentials not configured. Email sending will fail."
		);
		console.error(
			"  Please set EMAIL_USER and EMAIL_PASS environment variables"
		);
	}

	console.log("  Initializing NodeMailer transporter with Gmail service");

	transporter = nodemailer.createTransport({
		service: emailService,
		auth: {
			user: emailUser,
			pass: emailPassword,
		},
	});

	// Verify transporter connection on startup
	transporter.verify((error: any, success: any) => {
		if (error) {
			console.error(
				"  NodeMailer transporter verification failed:",
				error.message
			);
		} else {
			console.log("  NodeMailer transporter verified successfully");
		}
	});

	return transporter;
}

// Email template types for dynamic content
interface EmailTemplate {
	subject: string;
	html: string;
}

// Generate appointment confirmation email
function generateAppointmentConfirmationEmail(
	patientName: string,
	doctorName: string,
	appointmentDate: string,
	appointmentTime: string,
	appointmentType: string
): EmailTemplate {
	return {
		subject: `Appointment Confirmation - ${appointmentDate}`,
		html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Appointment Confirmation</h2>
        <p>Dear <strong>${patientName}</strong>,</p>
        <p>Your appointment has been successfully scheduled. Here are the details:</p>
        <div style="background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Doctor:</strong> ${doctorName}</p>
          <p><strong>Date:</strong> ${appointmentDate}</p>
          <p><strong>Time:</strong> ${appointmentTime}</p>
          <p><strong>Type:</strong> ${appointmentType}</p>
        </div>
        <p>Please arrive 10 minutes early. If you need to reschedule, please contact us as soon as possible.</p>
        <p>Best regards,<br/>DentalCare Pro Team</p>
      </div>
    `,
	};
}

// Generate appointment reminder email
function generateAppointmentReminderEmail(
	patientName: string,
	doctorName: string,
	appointmentDate: string,
	appointmentTime: string
): EmailTemplate {
	return {
		subject: `Reminder: Your appointment is scheduled for ${appointmentDate}`,
		html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Appointment Reminder</h2>
        <p>Dear <strong>${patientName}</strong>,</p>
        <p>This is a reminder that your appointment is scheduled for:</p>
        <div style="background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Doctor:</strong> ${doctorName}</p>
          <p><strong>Date:</strong> ${appointmentDate}</p>
          <p><strong>Time:</strong> ${appointmentTime}</p>
        </div>
        <p>Please arrive 10 minutes early. If you need to reschedule, please contact us immediately.</p>
        <p>Best regards,<br/>DentalCare Pro Team</p>
      </div>
    `,
	};
}

// Generate appointment reschedule email
function generateAppointmentRescheduleEmail(
	patientName: string,
	doctorName: string,
	newDate: string,
	newTime: string,
	oldDate: string,
	oldTime: string
): EmailTemplate {
	return {
		subject: `Appointment Rescheduled - New Date: ${newDate}`,
		html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Appointment Rescheduled</h2>
        <p>Dear <strong>${patientName}</strong>,</p>
        <p>Your appointment has been rescheduled. Here are the updated details:</p>
        <div style="background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Doctor:</strong> ${doctorName}</p>
          <p><strong>Previous Date & Time:</strong> ${oldDate} at ${oldTime}</p>
          <p><strong>New Date & Time:</strong> ${newDate} at ${newTime}</p>
        </div>
        <p>Please confirm your attendance. If you have any questions, please contact us.</p>
        <p>Best regards,<br/>DentalCare Pro Team</p>
      </div>
    `,
	};
}

// Generate appointment cancellation email
function generateAppointmentCancellationEmail(
	patientName: string,
	doctorName: string,
	appointmentDate: string,
	appointmentTime: string
): EmailTemplate {
	return {
		subject: `Appointment Cancelled - ${appointmentDate}`,
		html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">Appointment Cancelled</h2>
        <p>Dear <strong>${patientName}</strong>,</p>
        <p>Your appointment has been cancelled. Here are the details:</p>
        <div style="background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Doctor:</strong> ${doctorName}</p>
          <p><strong>Date:</strong> ${appointmentDate}</p>
          <p><strong>Time:</strong> ${appointmentTime}</p>
        </div>
        <p>If you would like to reschedule, please contact us to book a new appointment.</p>
        <p>Best regards,<br/>DentalCare Pro Team</p>
      </div>
    `,
	};
}

// Generate treatment report/follow-up email
function generateTreatmentReportEmail(
	patientName: string,
	doctorName: string,
	procedures: string[],
	findings: string,
	nextVisitDate?: string
): EmailTemplate {
	const proceduresList = procedures.map((p) => `<li>${p}</li>`).join("");
	return {
		subject: `Treatment Report - Follow-up Information`,
		html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Treatment Report</h2>
        <p>Dear <strong>${patientName}</strong>,</p>
        <p>Your treatment report from Dr. ${doctorName} is ready. Here are the details:</p>
        <div style="background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3>Procedures Performed:</h3>
          <ul>${proceduresList}</ul>
          <h3>Findings:</h3>
          <p>${findings}</p>
          ${nextVisitDate ? `<h3>Next Visit:</h3><p>${nextVisitDate}</p>` : ""}
        </div>
        <p>Please follow the post-treatment instructions provided by your doctor. If you have any questions, please don't hesitate to contact us.</p>
        <p>Best regards,<br/>DentalCare Pro Team</p>
      </div>
    `,
	};
}

// Generate doctor assignment email
function generateDoctorAssignmentEmail(
	doctorName: string,
	patientName: string,
	patientEmail: string
): EmailTemplate {
	return {
		subject: `New Patient Assignment - ${patientName}`,
		html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">New Patient Assignment</h2>
        <p>Dear Dr. <strong>${doctorName}</strong>,</p>
        <p>A new patient has been assigned to you:</p>
        <div style="background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Patient Name:</strong> ${patientName}</p>
          <p><strong>Patient Email:</strong> ${patientEmail}</p>
        </div>
        <p>Please review the patient's medical history and contact them to schedule an initial consultation.</p>
        <p>Best regards,<br/>DentalCare Pro Team</p>
      </div>
    `,
	};
}

// Generate X-ray/image upload email
function generateXrayUploadEmail(
	patientName: string,
	imageType: string,
	uploadedBy: string,
	imageTitle?: string
): EmailTemplate {
	return {
		subject: `New ${imageType} Images Added to Your Profile`,
		html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Medical Images Updated</h2>
        <p>Dear <strong>${patientName}</strong>,</p>
        <p>New ${imageType} images have been added to your medical profile by ${uploadedBy}.</p>
        <div style="background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Image Type:</strong> ${imageType}</p>
          ${imageTitle ? `<p><strong>Title:</strong> ${imageTitle}</p>` : ""}
          <p><strong>Uploaded By:</strong> ${uploadedBy}</p>
        </div>
        <p>You can view these images in your patient dashboard under Medical Records.</p>
        <p>Best regards,<br/>DentalCare Pro Team</p>
      </div>
    `,
	};
}

// Main function to send email dynamically
export async function sendEmail(
	to: string,
	subject: string,
	html: string,
	eventType: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
	try {
		console.log(`  Sending ${eventType} email to: ${to}`);

		const transporter = getTransporter();
		const mailOptions = {
			from: process.env.EMAIL_USER,
			to,
			subject,
			html,
		};

		const info = await transporter.sendMail(mailOptions);

		console.log(`  ${eventType} email sent successfully to ${to}`);
		console.log(`  Message ID: ${info.messageId}`);
		return { success: true, messageId: info.messageId };
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "Unknown error";
		console.error(`  Failed to send ${eventType} email to ${to}`);
		console.error(`  Error details: ${errorMessage}`);
		return { success: false, error: errorMessage };
	}
}

// Exported functions for specific email types
export async function sendAppointmentConfirmationEmail(
	patientEmail: string,
	patientName: string,
	doctorName: string,
	appointmentDate: string,
	appointmentTime: string,
	appointmentType: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
	const template = generateAppointmentConfirmationEmail(
		patientName,
		doctorName,
		appointmentDate,
		appointmentTime,
		appointmentType
	);
	return sendEmail(
		patientEmail,
		template.subject,
		template.html,
		"APPOINTMENT_CONFIRMATION"
	);
}

export async function sendAppointmentReminderEmail(
	patientEmail: string,
	patientName: string,
	doctorName: string,
	appointmentDate: string,
	appointmentTime: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
	const template = generateAppointmentReminderEmail(
		patientName,
		doctorName,
		appointmentDate,
		appointmentTime
	);
	return sendEmail(
		patientEmail,
		template.subject,
		template.html,
		"APPOINTMENT_REMINDER"
	);
}

export async function sendAppointmentRescheduleEmail(
	patientEmail: string,
	patientName: string,
	doctorName: string,
	newDate: string,
	newTime: string,
	oldDate: string,
	oldTime: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
	const template = generateAppointmentRescheduleEmail(
		patientName,
		doctorName,
		newDate,
		newTime,
		oldDate,
		oldTime
	);
	return sendEmail(
		patientEmail,
		template.subject,
		template.html,
		"APPOINTMENT_RESCHEDULE"
	);
}

export async function sendAppointmentCancellationEmail(
	patientEmail: string,
	patientName: string,
	doctorName: string,
	appointmentDate: string,
	appointmentTime: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
	const template = generateAppointmentCancellationEmail(
		patientName,
		doctorName,
		appointmentDate,
		appointmentTime
	);
	return sendEmail(
		patientEmail,
		template.subject,
		template.html,
		"APPOINTMENT_CANCELLATION"
	);
}

export async function sendTreatmentReportEmail(
	patientEmail: string,
	patientName: string,
	doctorName: string,
	procedures: string[],
	findings: string,
	nextVisitDate?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
	const template = generateTreatmentReportEmail(
		patientName,
		doctorName,
		procedures,
		findings,
		nextVisitDate
	);
	return sendEmail(
		patientEmail,
		template.subject,
		template.html,
		"TREATMENT_REPORT"
	);
}

export async function sendDoctorAssignmentEmail(
	doctorEmail: string,
	doctorName: string,
	patientName: string,
	patientEmail: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
	const template = generateDoctorAssignmentEmail(
		doctorName,
		patientName,
		patientEmail
	);
	return sendEmail(
		doctorEmail,
		template.subject,
		template.html,
		"DOCTOR_ASSIGNMENT"
	);
}

export async function sendXrayUploadEmail(
	patientEmail: string,
	patientName: string,
	imageType: string,
	uploadedBy: string,
	imageTitle?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
	const template = generateXrayUploadEmail(
		patientName,
		imageType,
		uploadedBy,
		imageTitle
	);
	return sendEmail(
		patientEmail,
		template.subject,
		template.html,
		"XRAY_UPLOAD"
	);
}
