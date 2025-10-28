"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/components/auth-context"
import { Mail, Phone, AlertCircle } from "lucide-react"
import { toast } from "react-hot-toast"
import Link from "next/link"

export function AdminStaffRegistration() {
  const [selectedRole, setSelectedRole] = useState("receptionist")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "receptionist",
    specialty: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const { token } = useAuth()

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error("Full name is required")
      return false
    }

    if (!formData.email.trim()) {
      toast.error("Email is required")
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address")
      return false
    }

    if (formData.phone && formData.phone.length < 10) {
      toast.error("Phone number must be at least 10 digits")
      return false
    }

    if (selectedRole === "doctor" && !formData.specialty.trim()) {
      toast.error("Specialty is required for doctors")
      return false
    }

    return true
  }

  const handleRoleChange = (role: string) => {
    setSelectedRole(role)
    setFormData((prev) => ({ ...prev, role }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/admin-register-staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
          specialty: formData.specialty,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Failed to register staff member")
        return
      }

      toast.success("Staff member registered successfully! Credentials have been sent to their email.")
      setFormData({
        name: "",
        email: "",
        phone: "",
        role: "receptionist",
        specialty: "",
      })
      setSelectedRole("receptionist")
    } catch (error) {
      console.error("Registration error:", error)
      toast.error("An error occurred during registration")
    } finally {
      setIsLoading(false)
    }
  }

  const roleDescriptions = {
    doctor: "Can view assigned patients and clinical tools",
    receptionist: "Can manage patients, appointments, and billing",
  }

  return (
    <div className="w-full">
      <div className="bg-card rounded-2xl shadow-lg border border-border p-6 sm:p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">Register Staff Member</h2>
          <p className="text-muted-foreground text-xs sm:text-sm">Add a new doctor or receptionist to your clinic</p>
        </div>

        <div className="mb-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs sm:text-sm font-semibold text-blue-900">Automatic Credentials</p>
            <p className="text-xs text-blue-800 mt-1">
              A secure password will be automatically generated and sent to the staff member's email.
            </p>
          </div>
        </div>

        {/* Role Selection Tabs */}
        <div className="mb-8">
          <label className="block text-xs sm:text-sm font-semibold text-foreground mb-3">Select Role</label>
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            {["doctor", "receptionist"].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => handleRoleChange(role)}
                className={`py-2 px-2 sm:px-3 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 ${
                  selectedRole === role
                    ? "bg-primary text-primary-foreground border-2 border-primary"
                    : "bg-muted text-muted-foreground border-2 border-border hover:border-primary/50"
                }`}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {roleDescriptions[selectedRole as keyof typeof roleDescriptions]}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* Full Name Field */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 sm:py-2.5 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-muted-foreground text-sm"
              placeholder="Enter full name"
              required
            />
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-muted-foreground text-sm"
                placeholder="staff@clinic.com"
                required
              />
            </div>
          </div>

          {/* Phone Field */}
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-muted-foreground text-sm"
                placeholder="Enter phone number"
              />
            </div>
          </div>

          {/* Specialty Field (Doctor only) */}
          {selectedRole === "doctor" && (
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">Specialty</label>
              <input
                type="text"
                name="specialty"
                value={formData.specialty}
                onChange={handleChange}
                className="w-full px-4 py-2 sm:py-2.5 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground placeholder-muted-foreground text-sm"
                placeholder="e.g., General Dentistry, Orthodontics"
              />
            </div>
          )}

          {/* Register Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground font-semibold py-2 sm:py-2.5 rounded-lg transition-colors duration-200 mt-6 text-sm sm:text-base cursor-pointer"
          >
            {isLoading ? "Registering..." : "Register Staff Member"}
          </button>
        </form>

        {/* Back Link */}
        <p className="text-center text-xs sm:text-sm text-muted-foreground mt-6">
          <Link href="/dashboard" className="text-primary hover:text-primary/80 font-semibold transition-colors">
            Back to Dashboard
          </Link>
        </p>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-muted-foreground mt-6">© 2025 Dr.Mohammad Alsheikh Dental Center. All rights reserved.</p>
    </div>
  )
}
