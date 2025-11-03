/**
 * WhatsApp Business API Service
 * Handles all WhatsApp template-based notifications
 * Fully dynamic with comprehensive error handling
 */

interface WhatsAppTemplateParams {
  to: string // Phone number in international format (e.g., "923391415151")
  templateName: string
  parameters: string[]
}

interface WhatsAppResponse {
  success: boolean
  messageId?: string
  error?: string
}

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL!

const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN

/**
 * Sends a WhatsApp template message
 * @param params - Template parameters including phone number and template name
 * @returns Response with success status and message ID or error
 */
export async function sendWhatsAppTemplate(params: WhatsAppTemplateParams): Promise<WhatsAppResponse> {
  try {
    console.log("[DEBUG] sendWhatsAppTemplate called with:", params)
    console.log("[DEBUG] WHATSAPP_API_URL:", WHATSAPP_API_URL)
    console.log("[DEBUG] Access Token Present:", !!WHATSAPP_ACCESS_TOKEN)

    const payload = {
      messaging_product: "whatsapp",
      to: params.to,
      type: "template",
      template: {
        name: params.templateName,
        language: { code: "en" },
        components: buildTemplateComponents(params.templateName, params.parameters),
      },
    }

    console.log("[DEBUG] WhatsApp payload:", JSON.stringify(payload, null, 2))

    const response = await fetch(WHATSAPP_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(payload),
    })

    console.log("[DEBUG] WhatsApp API response status:", response.status)
    const data = await response.json()
    console.log("[DEBUG] WhatsApp API raw response:", JSON.stringify(data, null, 2))

    if (!response.ok) {
      console.error("  WhatsApp API error:", data)
      return {
        success: false,
        error: data.error?.message || "Failed to send WhatsApp message",
      }
    }

    const messageId = data.messages?.[0]?.id
    console.log("  WhatsApp: Message sent successfully", { messageId })

    return { success: true, messageId }
  } catch (error) {
    console.error("  WhatsApp service error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

/**
 * Builds template components based on template name
 * Each template has specific structure and parameter count
 */
function buildTemplateComponents(templateName: string, parameters: string[]): any[] {
  switch (templateName) {
    case "account_confirmation":
      // account_confirmation: patient name + verification link
      return [
        {
          type: "body",
          parameters: [
            { type: "text", text: parameters[0] || "" }, // Patient name
          ],
        },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [
            { type: "text", text: parameters[1] || "" }, // Verification link
          ],
        },
      ]

    case "appointment_confirmation":
      // hello_world (appointment confirmation): patient name, service, date, time, doctor, appointment ID
      return [
        {
          type: "body",
          parameters: [
            { type: "text", text: parameters[0] || "" }, // Patient name
            { type: "text", text: parameters[1] || "" }, // Service/Type
            { type: "text", text: parameters[2] || "" }, // Date
            { type: "text", text: parameters[3] || "" }, // Time
            { type: "text", text: parameters[4] || "" }, // Doctor name
            { type: "text", text: parameters[5] || "" }, // Appointment ID
          ],
        },
      ]

    case "appointment_reminder":
      // appointment_reminder: patient name, time
      return [
        {
          type: "body",
          parameters: [
            { type: "text", text: parameters[0] || "" }, // Patient name
            { type: "text", text: parameters[1] || "" }, // Time
          ],
        },
      ]

    case "appointment_reschedule":
      // appointment_reschedule: patient name, doctor name, date, time
      return [
        {
          type: "body",
          parameters: [
            { type: "text", text: parameters[0] || "" }, // Patient name
            { type: "text", text: parameters[1] || "" }, // Doctor name
            { type: "text", text: parameters[2] || "" }, // New date
            { type: "text", text: parameters[3] || "" }, // New time
          ],
        },
      ]

    case "report_message":
      // medical_report: patient name, date, time, doctor name + report link button
      return [
        {
          type: "body",
          parameters: [
            { type: "text", text: parameters[0] || "" }, // Patient name
            { type: "text", text: parameters[1] || "" }, // Date
            { type: "text", text: parameters[2] || "" }, // Time
            { type: "text", text: parameters[3] || "" }, // Doctor name
          ],
        },
        {
          type: "button",
          sub_type: "url",
          index: "0",
          parameters: [
            { type: "text", text: parameters[4] || "" }, // Report link
          ],
        },
      ]

    default:
      console.warn("  WhatsApp: Unknown template name:", templateName)
      return []
  }
}

/**
 * Sends account confirmation notification
 */
export async function sendAccountConfirmation(
  phoneNumber: string,
  patientName: string,
  verificationLink: string,
): Promise<WhatsAppResponse> {
  return sendWhatsAppTemplate({
    to: phoneNumber,
    templateName: "account_confirmation",
    parameters: [patientName, verificationLink],
  })
}

/**
 * Sends appointment confirmation notification
 */
export async function sendAppointmentConfirmation(
  phoneNumber: string,
  patientName: string,
  appointmentType: string,
  date: string,
  time: string,
  doctorName: string,
  appointmentId: string,
): Promise<WhatsAppResponse> {
  return sendWhatsAppTemplate({
    to: phoneNumber,
    templateName: "appointment_confirmation",
    parameters: [patientName, appointmentType, date, time, doctorName, appointmentId],
  })
}

/**
 * Sends appointment reschedule notification
 */
export async function sendAppointmentReschedule(
  phoneNumber: string,
  patientName: string,
  doctorName: string,
  newDate: string,
  newTime: string,
): Promise<WhatsAppResponse> {
  return sendWhatsAppTemplate({
    to: phoneNumber,
    templateName: "appointment_reschedule",
    parameters: [patientName, doctorName, newDate, newTime],
  })
}

/**
 * Sends appointment reminder notification
 */
export async function sendAppointmentReminder(
  phoneNumber: string,
  patientName: string,
  time: string,
): Promise<WhatsAppResponse> {
  return sendWhatsAppTemplate({
    to: phoneNumber,
    templateName: "appointment_reminder",
    parameters: [patientName, time],
  })
}

/**
 * Sends appointment cancellation notification
 */
export async function sendAppointmentCancellation(
  phoneNumber: string,
  patientName: string,
  doctorName: string,
  appointmentDate: string,
): Promise<WhatsAppResponse> {
  return sendWhatsAppTemplate({
    to: phoneNumber,
    templateName: "appointment_cancelled",
    parameters: [patientName, doctorName, appointmentDate],
  })
}

export async function sendMedicalReportLink(
  phoneNumber: string,
  patientName: string,
  appointmentDate: string,
  appointmentTime: string,
  doctorName: string,
  reportLink: string,
): Promise<WhatsAppResponse> {
  return sendWhatsAppTemplate({
    to: phoneNumber,
    templateName: "report_message",
    parameters: [patientName, appointmentDate, appointmentTime, doctorName, reportLink],
  })
}
