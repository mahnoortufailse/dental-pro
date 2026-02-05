"use client"

import React, { useEffect, useState, useRef } from "react"
import { useAuth } from "@/components/auth-context"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { AlertCircle, Send, Clock, Paperclip, Mic, X, RefreshCw } from "lucide-react"
import WhatsAppChatHeader from "@/components/whatsapp-chat-header"
import WhatsAppMessageBubble from "@/components/whatsapp-message-bubble"
import WhatsAppChatSidebar from "@/components/whatsapp-chat-sidebar"

interface Message {
  _id: string
  senderType: "patient" | "business"
  body: string
  status: "sent" | "delivered" | "read" | "failed"
  createdAt: string
  mediaType?: string | null
  mediaUrl?: string | null
  quotedMessageBody?: string | null
  quotedMediaUrl?: string | null
  quotedMediaType?: string | null
}

interface Chat {
  _id: string
  patientName: string
  patientPhone: string
  lastMessageAt: string
  window24HourEndsAt: string | null
  whatsappProfilePictureUrl?: string | null
  whatsappDisplayName?: string | null
}

export default function ChatThreadPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const chatId = params?.chatId as string

  const [chat, setChat] = useState<Chat | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [chats, setChats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [messageText, setMessageText] = useState("")
  const [search, setSearch] = useState("")
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null)
  const mediaInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleQuotedMessageClick = (quotedText: string) => {
    // Find message with this body
    const targetMsg = messages.find(
      (m) => m.body.includes(quotedText) || m.body.startsWith(quotedText.substring(0, 20)),
    )
    if (targetMsg) {
      const element = document.getElementById(`message-${targetMsg._id}`)
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" })
        // Add highlight effect
        element.querySelector("[data-highlight]")?.classList.add("ring-2", "ring-yellow-400", "scale-105")
        setTimeout(() => {
          element.querySelector("[data-highlight]")?.classList.remove("ring-2", "ring-yellow-400", "scale-105")
        }, 2000)
      }
    }
  }

  useEffect(() => {
    if (!authLoading && (!user || (user.role !== "admin" && user.role !== "receptionist"))) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (!authLoading && user && chatId) {
      fetchMessages()
      fetchChats()
    }
  }, [authLoading, user, chatId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchChats = async () => {
    try {
      const token = sessionStorage.getItem("token")
      const params = new URLSearchParams({
        status: "active",
        page: "1",
        limit: "50",
      })

      if (search) {
        params.append("search", search)
      }

      const response = await fetch(`/api/whatsapp/chats?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setChats(data.chats || [])
      }
    } catch (err) {
      console.error("[v0] Error fetching chats:", err)
    }
  }

  const fetchMessages = async () => {
    try {
      const token = sessionStorage.getItem("token")
      const response = await fetch(`/api/whatsapp/messages?chatId=${chatId}&limit=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Failed to fetch messages")

      const data = await response.json()
      setMessages(data.messages || [])

      const chatsResponse = await fetch(`/api/whatsapp/chats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (chatsResponse.ok) {
        const chatsData = await chatsResponse.json()
        const foundChat = chatsData.chats?.find((c: Chat) => c._id === chatId)
        if (foundChat) {
          setChat(foundChat)
        }
      }

      setError("")
    } catch (err) {
      console.error("[v0] Error fetching messages:", err)
      if (!messages.length) {
        setError(err instanceof Error ? err.message : "Failed to load messages")
      }
    } finally {
      setLoading(false)
    }
  }

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      const chunks: BlobPart[] = []

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" })
        setRecordedAudio(blob)
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error("[v0] Error accessing microphone:", err)
      setError("Could not access microphone")
    }
  }

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if ((!messageText.trim() && !mediaFile && !recordedAudio) || !chat) return

    try {
      // Auto-stop recording if still active
      if (isRecording) {
        stopAudioRecording()
      }

      setSending(true)
      setError("")

      const token = sessionStorage.getItem("token")

      // If there's media file or audio, send as form data
      if (mediaFile || recordedAudio) {
        const formData = new FormData()
        formData.append("chatId", chatId)
        formData.append("patientPhone", chat.patientPhone)
        formData.append("message", messageText || "")
        formData.append("whatsappBusinessPhoneNumberId", "default")

        if (mediaFile) {
          formData.append("media", mediaFile)
          formData.append("mediaType", mediaFile.type.startsWith("image") ? "image" : 
                                       mediaFile.type.startsWith("video") ? "video" : 
                                       mediaFile.type.startsWith("audio") ? "audio" : "document")
        }

        if (recordedAudio) {
          formData.append("media", recordedAudio, "recording.webm")
          formData.append("mediaType", "audio")
        }

        const response = await fetch("/api/whatsapp/messages", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        })

        if (!response.ok) {
          const errData = await response.json()
          throw new Error(errData.error || "Failed to send message")
        }

        const data = await response.json()
        setMessages([...messages, data.message])
      } else {
        // Text-only message
        const response = await fetch("/api/whatsapp/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            chatId,
            patientId: chat.patientName,
            patientPhone: chat.patientPhone,
            message: messageText,
            messageType: "text",
            whatsappBusinessPhoneNumberId: "default",
          }),
        })

        if (!response.ok) {
          const errData = await response.json()
          throw new Error(errData.error || "Failed to send message")
        }

        const data = await response.json()
        setMessages([...messages, data.message])
      }

      setMessageText("")
      setMediaFile(null)
      setRecordedAudio(null)
      scrollToBottom()
    } catch (err) {
      console.error("[v0] Error sending message:", err)
      setError(err instanceof Error ? err.message : "Failed to send message")
    } finally {
      setSending(false)
    }
  }

  const isWindow24HourValid = chat?.window24HourEndsAt ? new Date(chat.window24HourEndsAt) > new Date() : false

  if (authLoading || (loading && messages.length === 0)) {
    return (
      <div className="flex h-screen">
        <WhatsAppChatSidebar
          chats={chats}
          onSearchChange={setSearch}
          searchValue={search}
          loading={loading}
          selectedChatId={chatId}
        />
        <div className="hidden md:flex flex-1 items-center justify-center">
          <Spinner />
        </div>
      </div>
    )
  }

  if (!chat) {
    return (
      <div className="flex h-screen">
        <WhatsAppChatSidebar
          chats={chats}
          onSearchChange={setSearch}
          searchValue={search}
          loading={loading}
          selectedChatId={chatId}
        />
        <div className="hidden md:flex flex-1 flex-col items-center justify-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <p className="text-gray-600">Chat not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar - Hidden on mobile */}
      <div className="hidden md:block">
        <WhatsAppChatSidebar
          chats={chats}
          onSearchChange={setSearch}
          searchValue={search}
          loading={loading}
          selectedChatId={chatId}
        />
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col md:w-0">
        {/* Header with Refresh Button */}
        <div className="flex items-center justify-between bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex-1">
            <WhatsAppChatHeader
              patientName={chat.patientName}
              patientPhone={chat.patientPhone}
              whatsappDisplayName={chat.whatsappDisplayName}
              whatsappProfilePictureUrl={chat.whatsappProfilePictureUrl}
            />
          </div>
          <Button
            type="button"
            onClick={fetchMessages}
            disabled={loading}
            size="sm"
            variant="ghost"
            className="ml-2"
            title="Refresh messages"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50 space-y-2">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400 text-center">
                <span className="block text-lg font-medium mb-1">No messages yet</span>
                <span className="text-sm">Start a conversation with this customer</span>
              </p>
            </div>
          ) : (
            <div className="w-full space-y-2">
              {messages.map((msg) => (
                <div key={msg._id} data-highlight>
                  <WhatsAppMessageBubble
                    messageId={msg._id}
                    type={msg.senderType === "business" ? "sent" : "received"}
                    text={msg.body}
                    timestamp={new Date(msg.createdAt)}
                    status={msg.status}
                    mediaType={msg.mediaType}
                    mediaUrl={msg.mediaUrl}
                    quotedMessageBody={msg.quotedMessageBody}
                    quotedMediaUrl={msg.quotedMediaUrl}
                    quotedMediaType={msg.quotedMediaType}
                    onQuotedMessageClick={handleQuotedMessageClick}
                  />
                </div>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 24-hour Window Warning */}
        {!isWindow24HourValid && messages.some((m) => m.senderType === "patient") && (
          <div className="bg-amber-50 border-t border-amber-200 px-4 py-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-700 font-medium">
              Outside 24-hour window. Only template messages are allowed.
            </p>
          </div>
        )}

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="bg-white border-t border-gray-200 p-4 space-y-3">
          {/* Recording Status */}
          {isRecording && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between animate-pulse">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                <p className="text-sm font-medium text-red-600">Recording audio...</p>
              </div>
              <p className="text-xs text-red-500">Press stop or send to finish</p>
            </div>
          )}

          {/* Media Preview */}
          {(mediaFile || recordedAudio) && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
              <p className="text-sm text-blue-700 font-medium">
                {mediaFile 
                  ? `📎 File: ${mediaFile.name}` 
                  : "🎙️ Audio recording ready to send"}
              </p>
              <button
                type="button"
                onClick={() => {
                  setMediaFile(null)
                  setRecordedAudio(null)
                }}
                className="text-blue-500 hover:text-blue-700"
                title="Remove"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              disabled={sending || isRecording}
              className="flex-1 h-10 border-gray-300 rounded-full focus:ring-blue-500"
            />

            {/* Media Upload Button */}
            <input
              ref={mediaInputRef}
              type="file"
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setMediaFile(e.target.files[0])
                  setRecordedAudio(null)
                }
              }}
              className="hidden"
            />
            <Button
              type="button"
              onClick={() => mediaInputRef.current?.click()}
              disabled={sending || isRecording || mediaFile !== null}
              size="icon"
              variant="ghost"
              className="w-10 h-10"
              title="Attach file"
            >
              <Paperclip className="w-4 h-4 text-gray-600" />
            </Button>

            {/* Audio Recording Button */}
            <Button
              type="button"
              onClick={isRecording ? stopAudioRecording : startAudioRecording}
              disabled={sending || mediaFile !== null}
              size="icon"
              variant="ghost"
              className={`w-10 h-10 transition-colors ${
                isRecording
                  ? "bg-red-100 text-red-600 hover:bg-red-200"
                  : "text-gray-600 hover:text-gray-800"
              }`}
              title={isRecording ? "Stop recording" : "Start recording"}
            >
              <Mic className={`w-4 h-4 ${isRecording ? "animate-pulse" : ""}`} />
            </Button>

            {/* Send Button */}
            <Button
              type="submit"
              disabled={sending || (!messageText.trim() && !mediaFile && !recordedAudio)}
              size="icon"
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-full w-10 h-10"
              title="Send message"
            >
              {sending ? <Spinner /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
