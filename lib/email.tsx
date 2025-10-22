import nodemailer from "nodemailer"

// Create transporter - using Gmail or your email service
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
})

export async function sendPatientCredentials(email: string, patientName: string, tempPassword: string) {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

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
                <strong>Email:</strong> <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px;">${email}</code>
              </p>
              <p style="margin: 5px 0; color: #555;">
                <strong>Temporary Password:</strong> <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px;">${tempPassword}</code>
              </p>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>⚠️ Important:</strong> This is a temporary password. Please change it after your first login for security purposes.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${appUrl}/login" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
                Login to Your Portal
              </a>
            </div>
            
            <div style="background: #f0f0f0; padding: 20px; border-radius: 4px; margin-top: 30px;">
              <p style="color: #666; font-size: 13px; margin: 0 0 10px 0;"><strong>What you can access:</strong></p>
              <ul style="color: #666; font-size: 13px; margin: 0; padding-left: 20px;">
                <li>Personal medical profile and health information</li>
                <li>Complete appointment history and upcoming appointments</li>
                <li>X-rays and dental images</li>
                <li>Medical reports and findings</li>
                <li>Dental tooth chart</li>
              </ul>
            </div>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px; text-align: center; border-top: 1px solid #ddd; padding-top: 20px;">
              If you did not request this account or have any questions, please contact our clinic immediately.
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
