"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-context"
import { Eye, EyeOff, Lock, Mail, User, MessageCircle } from "lucide-react"
import { toast } from "react-hot-toast"
import Link from "next/link"
import { FaWhatsapp } from "react-icons/fa"

export default function LoginPage() {
  
  const [loginType, setLoginType] = useState<"staff" | "patient">("staff")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login, setPatient, setPatientToken } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      if (loginType === "staff") {
        if (!username.trim() || !password) {
          toast.error("Username and password required")
          setIsLoading(false)
          return
        }
        await login(username, password)
        toast.success("Login successful!")
        router.push("/dashboard")
      } else {
        if (!email.trim() || !password) {
          toast.error("Email and password required")
          setIsLoading(false)
          return
        }

        const res = await fetch("/api/auth/patient-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        })

        if (!res.ok) {
          const error = await res.json()
          toast.error(error.error || "Login failed")
          setIsLoading(false)
          return
        }

        const data = await res.json()
        sessionStorage.setItem("patientToken", data.token)
        sessionStorage.setItem("patient", JSON.stringify(data.patient))

        setPatientToken(data.token)
        setPatient(data.patient)

        toast.success("Login successful!")
        router.push("/patient-dashboard")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed"
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // --- Admin contact info ---
  const adminEmail = "admin@dentalcarepro.com"
  const whatsappNumber = "+923001234567" // replace with your actual WhatsApp number

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-primary to-accent rounded-2xl mb-4 shadow-lg">
            <svg
              className="w-7 h-7 sm:w-8 sm:h-8 text-primary-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">DentalCare Pro</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">Professional Clinic Management</p>
        </div>

        {/* Login Type */}
        <div className="flex gap-2 mb-6 bg-muted p-1 rounded-lg">
          <button
            onClick={() => {
              setLoginType("staff")
              setUsername("")
              setEmail("")
              setPassword("")
            }}
            className={`flex-1 py-2 px-3 rounded-md font-medium text-sm transition-colors ${
              loginType === "staff"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Staff Login
          </button>
          <button
            onClick={() => {
              setLoginType("patient")
              setUsername("")
              setEmail("")
              setPassword("")
            }}
            className={`flex-1 py-2 px-3 rounded-md font-medium text-sm transition-colors ${
              loginType === "patient"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Patient Portal
          </button>
        </div>

        {/* Login Form */}
        <div className="bg-card rounded-2xl shadow-lg border border-border p-6 sm:p-8">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
              {loginType === "staff" ? "Staff Login" : "Patient Portal"}
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm">
              {loginType === "staff" ? "Sign in to your staff account" : "Access your medical records"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {loginType === "staff" && (
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm"
                    placeholder="Enter your username"
                    required
                  />
                </div>
              </div>
            )}

            {loginType === "patient" && (
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 sm:py-2.5 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Eye className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground font-semibold py-2 sm:py-2.5 rounded-lg transition-colors duration-200 text-sm sm:text-base cursor-pointer"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="text-center mt-4">
            <Link
              href="/forgot-password"
              className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
            >
              Forgot Password?
            </Link>
          </div>

          <div className="my-6 border-t border-border"></div>

 {/* Staff Contact Info */}
{loginType === "staff" && (
<div className="text-center mt-4">
      <p className="text-sm text-gray-700 mb-3">
        Don’t have an account? Contact your admin to register.
      </p>

      <div className="flex items-center justify-center gap-3 bg-gray-50 border rounded-xl px-4 py-3 shadow-sm w-fit mx-auto">
        {/* Email */}
        <a
          href="mailto:admin@dentalcarepro.com"
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow transition-all"
        >
          <Mail className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">
            admin@dentalcarepro.com
          </span>
        </a>

        {/* WhatsApp Icon with Tooltip */}
        <div className="relative group">
          <a
            href={`https://wa.me/${whatsappNumber.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-9 h-9 bg-green-50 border border-green-500 rounded-full shadow-sm hover:bg-green-100 transition-all"
          >
            <FaWhatsapp className="w-5 h-5 text-green-600" />
          </a>
          {/* Tooltip */}
          <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            Chat on WhatsApp
          </span>
        </div>
      </div>
    </div>
)}



          {/* Patient Info */}
          {loginType === "patient" && (
            <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 text-sm">
              <p className="text-accent font-medium mb-2">First time logging in?</p>
              <p className="text-accent/80 text-xs">
                Use the password sent to your email. You'll be prompted to change it on first login.
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2025 DentalCare Pro. All rights reserved.
        </p>
      </div>
    </div>
  )
}
