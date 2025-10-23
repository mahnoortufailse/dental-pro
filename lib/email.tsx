//@ts-nocheck
import nodemailer from "nodemailer"

let transporter: any = null

function getTransporter() {
  if (transporter) return transporter

  const emailService = process.env.EMAIL_SERVICE || "gmail"
  const emailUser = process.env.EMAIL_USER
  const emailPassword = process.env.EMAIL_PASSWORD

  if (!emailUser || !emailPassword) {
    console.warn("[v0] Email credentials not configured. Email sending will fail.")
    console.warn("[v0] Please set EMAIL_USER and EMAIL_PASSWORD environment variables")
  }

  transporter = nodemailer.createTransport({
    service: emailService,
    auth: {
      user: emailUser,
      pass: emailPassword,
    },
  })

  return transporter
}

export async function sendPatientCredentials(email: string, patientName: string, strongPassword: string) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const transporter = getTransporter()

    const mailOptions = {
      from: process.env.EMAIL_USER,
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
              <p style="margin: 0 0 10px 0; color: #333;"><strong>Login Credentials:</strong></p>
              <p style="margin: 5px 0; color: #555;">
                <strong>Email:</strong> <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px;">${email}</code><br>
                <strong>Password:</strong> <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px;">${strongPassword}</code>
              </p>
            </div>
            
            <p style="color: #555; font-size: 14px; line-height: 1.6; margin: 20px 0;">
              Please use these credentials to log in to your Dental Clinic Portal at <a href="${appUrl}" style="color: #667eea; text-decoration: none;">${appUrl}</a>.
            </p>
            
            <p style="color: #999; font-size: 12px; margin: 20px 0;">
              This is a one-time password. Please change your password immediately after your first login.
            </p>
          </div>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)
    console.log("[v0] Patient credentials email sent successfully to:", email)
    return true
  } catch (error) {
    console.error("[v0] Error sending patient credentials email:", error)
    throw error
  }
}

export async function sendPasswordResetEmail(email: string, userName: string, resetUrl: string) {
  try {
    const transporter = getTransporter()

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Reset Your Dental Clinic Portal Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0;">Password Reset Request</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 8px 8px;">
            <p style="color: #333; font-size: 16px;">Dear <strong>${userName}</strong>,</p>
            
            <p style="color: #555; font-size: 14px; line-height: 1.6;">
              We received a request to reset your password for your Dental Clinic Portal account. If you did not make this request, you can safely ignore this email.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #999; font-size: 12px; margin: 20px 0;">
              Or copy and paste this link in your browser:<br>
              <code style="background: #f0f0f0; padding: 8px; display: block; word-break: break-all; margin-top: 10px;">${resetUrl}</code>
            </p>
            
            <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0; color: #856404; font-size: 13px;">
                <strong>⚠ Security Notice:</strong> This link will expire in 1 hour. If you need to reset your password after that, please request a new reset link.
              </p>
            </div>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px; text-align: center; border-top: 1px solid #ddd; padding-top: 20px;">
              If you did not request this password reset, please contact our clinic immediately.
            </p>
          </div>
        </div>
      `,
    }

    await transporter.sendMail(mailOptions)
    console.log("[v0] Password reset email sent successfully to:", email)
    return true
  } catch (error) {
    console.error("[v0] Error sending password reset email:", error)
    throw error
  }
}
