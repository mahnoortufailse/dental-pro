"use client"

import React, { useState } from "react"
import { Check, CheckCheck, AlertCircle, Download } from "lucide-react"
import Image from "next/image"

interface MessageBubbleProps {
  type: "sent" | "received"
  text: string
  timestamp: Date
  status?: "sent" | "delivered" | "read" | "failed"
  mediaType?: string | null
  mediaUrl?: string | null
}

export default function WhatsAppMessageBubble({
  type,
  text,
  timestamp,
  status = "read",
  mediaType,
  mediaUrl,
}: MessageBubbleProps) {
  const [loadingMedia, setLoadingMedia] = useState(false)
  const [mediaError, setMediaError] = useState(false)

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const isOwn = type === "sent"
  const bgColor = isOwn ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900"
  const bubbleAlign = isOwn ? "justify-end" : "justify-start"

  const getStatusIcon = () => {
    switch (status) {
      case "sent":
        return <Check className="w-4 h-4" />
      case "delivered":
      case "read":
        return <CheckCheck className="w-4 h-4" />
      case "failed":
        return <AlertCircle className="w-4 h-4" />
      default:
        return null
    }
  }

  return (
    <div className={`flex ${bubbleAlign} mb-2`}>
      <div
        className={`max-w-xs lg:max-w-md rounded-2xl px-4 py-2.5 ${bgColor} shadow-sm ${
          isOwn ? "rounded-br-none" : "rounded-bl-none"
        }`}
      >
        {/* Media Content */}
        {mediaType && mediaUrl && (
          <div className="mb-2">
            {mediaType === "image" && (
              <div className="relative rounded-lg overflow-hidden bg-black/5 max-w-sm">
                {loadingMedia && (
                  <div className="h-48 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                )}
                {!mediaError ? (
                  <img
                    src={mediaUrl || "/placeholder.svg"}
                    alt="Message image"
                    className="max-w-full rounded-lg"
                    onLoad={() => setLoadingMedia(false)}
                    onError={() => {
                      setLoadingMedia(false)
                      setMediaError(true)
                    }}
                    onLoadingCapture={() => setLoadingMedia(true)}
                  />
                ) : (
                  <div className="h-48 flex flex-col items-center justify-center text-gray-400">
                    <AlertCircle className="w-8 h-8 mb-2" />
                    <p className="text-xs">Unable to load image</p>
                  </div>
                )}
              </div>
            )}

            {mediaType === "video" && (
              <div className="relative rounded-lg overflow-hidden bg-black/5 max-w-sm">
                <video
                  src={mediaUrl}
                  controls
                  className="max-w-full rounded-lg"
                  onLoadStart={() => setLoadingMedia(true)}
                  onCanPlay={() => setLoadingMedia(false)}
                  onError={() => {
                    setLoadingMedia(false)
                    setMediaError(true)
                  }}
                />
              </div>
            )}

            {mediaType === "audio" && (
              <div className="flex items-center gap-2 bg-black/5 rounded-lg px-3 py-2">
                <audio src={mediaUrl} controls className="flex-1 h-6" onError={() => setMediaError(true)} />
              </div>
            )}

            {mediaType === "document" && (
              <div className="flex items-center gap-2 bg-black/5 rounded-lg px-3 py-2">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                  <span className="text-xs font-semibold text-blue-700">DOC</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{text}</p>
                </div>
                <a href={mediaUrl} download target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                  <Download className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Text Content */}
        {text && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{text}</p>
        )}

        {/* Timestamp and Status */}
        <div className={`flex items-center gap-1 mt-1 text-xs ${isOwn ? "text-blue-100 justify-end" : "text-gray-500"}`}>
          <span>{formatTime(new Date(timestamp))}</span>
          {isOwn && getStatusIcon()}
        </div>
      </div>
    </div>
  )
}
