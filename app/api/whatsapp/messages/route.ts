import { connectDB, WhatsAppMessage, WhatsAppChat, User, Patient } from "@/lib/db-server"
import { NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { v4 as uuidv4 } from "crypto"

const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || ""
const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || ""

// Helper to upload media to WhatsApp and get media ID
async function uploadMediaToWhatsApp(
  buffer: Buffer,
  mimeType: string,
): Promise<string | null> {
  try {
    const formData = new FormData()
    const blob = new Blob([buffer], { type: mimeType })
    formData.append("file", blob)
    formData.append("type", mimeType)
    formData.append("messaging_product", "whatsapp")

    const mediaEndpoint = WHATSAPP_API_URL.replace("/messages", "").replace(/\/$/, "") + "/media"
    console.log("[v0] Uploading media to:", mediaEndpoint)

    const response = await fetch(mediaEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
      },
      body: formData,
    })

    const responseText = await response.text()
    console.log("[v0] Media upload response:", { status: response.status, body: responseText })

    if (!response.ok) {
      console.error("[v0] Failed to upload media to WhatsApp:", responseText)
      return null
    }

    const data = JSON.parse(responseText)
    return data.id || null
  } catch (error) {
    console.error("[v0] Error uploading media:", error)
    return null
  }
}

// ============================
// GET MESSAGES
// ============================
export async function GET(req: NextRequest) {
  try {
    await connectDB()

    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (payload.role !== "admin" && payload.role !== "receptionist") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const chatId = searchParams.get("chatId")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")

    if (!chatId) {
      return NextResponse.json({ error: "chatId is required" }, { status: 400 })
    }

    const total = await WhatsAppMessage.countDocuments({ chatId })
    const messages = await WhatsAppMessage.find({ chatId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    await WhatsAppMessage.updateMany(
      { chatId, senderType: "patient", status: { $in: ["sent", "delivered"] } },
      { status: "read", statusChangedAt: new Date() },
    )

    const unreadCount = await WhatsAppMessage.countDocuments({
      chatId,
      senderType: "patient",
      status: { $in: ["sent", "delivered"] },
    })

    await WhatsAppChat.findByIdAndUpdate(chatId, { unreadCount })

    return NextResponse.json({
      success: true,
      messages: messages.reverse(),
      total,
      page,
      limit,
    })
  } catch (error) {
    console.error("[v0] WhatsApp GET messages error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ============================
// POST SEND MESSAGE
// ============================
export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const token = req.headers.get("authorization")?.split(" ")[1]

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    if (payload.role !== "admin" && payload.role !== "receptionist") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    const user = payload

    // Handle both JSON and FormData
    let chatId: string = ""
    let patientPhone: string = ""
    let message: string = ""
    let messageType: string = "text"
    let whatsappBusinessPhoneNumberId: string = ""
    let mediaType: string | null = null
    let mediaBuffer: Buffer | null = null

    const contentType = req.headers.get("content-type") || ""

    if (contentType.includes("application/json")) {
      const body = await req.json()
      chatId = body.chatId || ""
      patientPhone = body.patientPhone || ""
      message = body.message || ""
      messageType = body.messageType || "text"
      whatsappBusinessPhoneNumberId = body.whatsappBusinessPhoneNumberId || ""
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData()
      chatId = formData.get("chatId")?.toString() || ""
      patientPhone = formData.get("patientPhone")?.toString() || ""
      message = formData.get("message")?.toString() || ""
      whatsappBusinessPhoneNumberId = formData.get("whatsappBusinessPhoneNumberId")?.toString() || ""
      mediaType = formData.get("mediaType")?.toString() || null

      const mediaFile = formData.get("media") as File | null
      if (mediaFile) {
        messageType = "media"
        mediaBuffer = Buffer.from(await mediaFile.arrayBuffer())
      }
    } else {
      return NextResponse.json({ error: "Invalid content type" }, { status: 400 })
    }

    // Validate required fields - message is optional for media
    if (!chatId || !patientPhone || !whatsappBusinessPhoneNumberId) {
      return NextResponse.json(
        { error: "Missing required fields: chatId, patientPhone, whatsappBusinessPhoneNumberId" },
        { status: 400 },
      )
    }

    // Message is required only for text messages
    if (messageType === "text" && !message) {
      return NextResponse.json(
        { error: "Message text is required for text messages" },
        { status: 400 },
      )
    }

    const chat = await WhatsAppChat.findById(chatId)
    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    const normalizedPhone = patientPhone.startsWith("+")
      ? patientPhone
      : `+${patientPhone}`

    // ============================
    // RESOLVE PATIENT SAFELY
    // ============================
    let resolvedPatientId = chat.patientId || null

    if (!resolvedPatientId) {
      const patient = await Patient.findOne({
        "phones.number": normalizedPhone,
      })

      if (patient) {
        resolvedPatientId = patient._id

        await WhatsAppChat.findByIdAndUpdate(chatId, {
          patientId: patient._id,
          patientName: patient.name,
        })
      }
    }

    const now = new Date()
    const window24HourValid = !chat.window24HourEndsAt || now < new Date(chat.window24HourEndsAt)

    // ============================
    // SAVE MESSAGE FIRST
    // ============================
    const messageData: any = {
      chatId,
      patientId: resolvedPatientId,
      patientPhone: normalizedPhone,
      senderType: "business",
      senderName: user.name,
      messageType,
      body: message,
      mediaType,
      sentBy: user.userId,
      sentByName: user.name,
      window24HourValid,
      status: "sent",
      createdAt: new Date(),
    }

    // Store media data if present
    if (mediaBuffer && mediaType) {
      messageData.mediaData = mediaBuffer
      // Generate local media URL for retrieval
      messageData.mediaUrl = `/api/whatsapp/media-proxy?local=true&id={{messageId}}`
    }

    const messageDoc = await WhatsAppMessage.create(messageData)

    // Update media URL with actual message ID
    if (mediaBuffer && mediaType) {
      await WhatsAppMessage.findByIdAndUpdate(messageDoc._id, {
        mediaUrl: `/api/whatsapp/media-proxy?local=true&id=${messageDoc._id}-${Date.now()}`,
      })
    }

    // ============================
    // SEND TO WHATSAPP
    // ============================
    try {
      let payload: any = {
        messaging_product: "whatsapp",
        to: normalizedPhone.replace("+", ""),
        type: "text",
        text: {
          preview_url: true,
          body: message || `[${mediaType?.toUpperCase() || "Media"} sent]`,
        },
      }

      // Handle media messages - store media locally, show in UI
      if (messageType === "media" && mediaBuffer && mediaType) {
        console.log("[v0] Storing media message locally:", { mediaType, size: mediaBuffer.length })

        // For now, send text-only message with media stored in database
        // In production, upload to CDN (S3, Cloudinary) and use the URL for sending
        payload = {
          messaging_product: "whatsapp",
          to: normalizedPhone.replace("+", ""),
          type: "text",
          text: {
            body: message || `[${mediaType.toUpperCase()} sent]`,
          },
        }
      }

      const response = await fetch(WHATSAPP_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (response.ok && data.messages?.[0]?.id) {
        const whatsappMessageId = data.messages[0].id

        // Store media locally if present
        let localMediaUrl = null
        if (mediaBuffer && mediaType) {
          const mediaId = `${whatsappMessageId}-${Date.now()}`
          // In production, store to cloud storage (S3, Cloudinary, etc)
          // For now, we'll just note that media should be stored locally
          localMediaUrl = `/api/whatsapp/media-proxy?id=${mediaId}`
        }

        await WhatsAppMessage.findByIdAndUpdate(messageDoc._id, {
          whatsappMessageId,
          mediaUrl: localMediaUrl,
          status: "sent",
        })

        await WhatsAppChat.findByIdAndUpdate(chatId, {
          lastMessage: message || `[${mediaType} sent]`,
          lastMessageAt: new Date(),
          updatedAt: new Date(),
        })

        return NextResponse.json(
          {
            success: true,
            message: {
              ...messageDoc.toObject(),
              whatsappMessageId,
              mediaUrl: localMediaUrl,
            },
          },
          { status: 201 },
        )
      } else {
        await WhatsAppMessage.findByIdAndUpdate(messageDoc._id, {
          status: "failed",
          errorMessage: data.error?.message || "Failed to send message",
          statusChangedAt: new Date(),
        })

        return NextResponse.json(
          {
            success: false,
            error: data.error?.message || "Failed to send message via WhatsApp",
            message: messageDoc,
          },
          { status: 400 },
        )
      }
    } catch (error) {
      console.error("[v0] WhatsApp API error:", error)

      await WhatsAppMessage.findByIdAndUpdate(messageDoc._id, {
        status: "failed",
        errorMessage: error instanceof Error ? error.message : "Network error",
        statusChangedAt: new Date(),
      })

      return NextResponse.json(
        {
          success: false,
          error: "Failed to send message",
          message: messageDoc,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("[v0] WhatsApp POST message error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
