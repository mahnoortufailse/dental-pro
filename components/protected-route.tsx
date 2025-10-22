"use client"

import type React from "react"

import { useAuth } from "./auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export function ProtectedRoute({
  children,
  allowedRoles,
  patientOnly = false,
}: {
  children: React.ReactNode
  allowedRoles?: string[]
  patientOnly?: boolean
}) {
  const { user, patient, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      if (patientOnly) {
        if (!patient) {
          router.push("/login")
        }
      } else {
        // Staff access
        if (!user) {
          router.push("/login")
        } else if (allowedRoles && !allowedRoles.includes(user.role)) {
          router.push("/dashboard")
        }
      }
    }
  }, [user, patient, isLoading, router, allowedRoles, patientOnly])

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (patientOnly) {
    if (!patient) {
      return null
    }
  } else {
    // Staff access
    if (!user) {
      return null
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return null
    }
  }

  return <>{children}</>
}
