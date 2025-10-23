// @ts-nocheck
import nodemailer from "nodemailer"
import dotenv from "dotenv"

dotenv.config()
let transporter: any = null

function getTransporter() {
  if (transporter) return transporter

  const emailService = process.env.EMAIL_SERVICE || "gmail"
  const emailUser = process.env.EMAIL_USER
  const emailPassword = process.env.EMAIL_PASS

  if (!emailUser || !emailPassword) {
    console.warn("[v0] Email credentials not configured. Email sending will fail.")
    console.warn("[v0] Please set EMAIL_USER and EMAIL_PASSWORD environment variables.")
  }

  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465, // Use 587 for TLS or 465 for SSL
    secure: true, // true for port 465, false for 587
    auth: {
      user: emailUser,
      pass: emailPassword,
    },
  })

  return transporter
}

export async function sendPatientCredentials(
  email: string,
  patientName: string,
  tempPassword: string
) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const transporter = getTransporter()

    const mailOptions = {
      from: `"Dental Clinic" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your Dental Clinic Portal Credentials",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">Welcome to Your Dental Clinic Portal</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 8px 8px;">
            <p style="color: #333; font-size: 16px;">Dear <strong>${patientName}</strong>,</p>
            <p style="color: #555; font-size: 14px; line-height: 1.6;">
              Your account has been created in our dental clinic management system. You can now access your medical records, appointment history, x-rays, and other important health information.
            </p>
            
            <div style="background: white; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 4px;">
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Temporary Password:</strong> ${tempPassword}</p>
            </div>

            <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                ⚠️ Please change your password after logging in.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${appUrl}/login" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
                Login to Your Portal
              </a>
            </div>
          </div>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)
    console.log("[v0] ✅ Patient credentials email sent successfully to:", email)
    return true
  } catch (error) {
    console.error("[v0] ❌ Error sending patient credentials email:", error)
    throw error
  }
}
