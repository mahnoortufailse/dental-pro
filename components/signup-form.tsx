"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "./auth-context"
import { Eye, EyeOff, Lock, User, Mail, Phone } from "lucide-react"
import toast from "react-hot-toast"

export function SignupForm() {
  const [selectedRole, setSelectedRole] = useState("receptionist")
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    role: "receptionist",
    phone: "",
    specialty: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { signup } = useAuth()
  const router = useRouter()

  const validateForm = (): boolean => {
    if (!formData.username.trim()) {
      toast.error("Username is required")
      return false
    }

    if (formData.username.trim().length < 3) {
      toast.error("Username must be at least 3 characters")
      return false
    }

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

    if (!formData.password) {
      toast.error("Password is required")
      return false
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match")
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
      await signup(formData)
      toast.success("Account created successfully!")
      router.push("/dashboard")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Signup failed"
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const roleDescriptions = {
    admin: "Manage patient registrations, appointments, and billing",
    doctor: "View assigned patients, clinical tools, and appointments",
    receptionist: "Manage patient registrations, appointments, and billing",
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Sign Up</h2>
          <p className="text-gray-500 text-sm">Create Your Account</p>
        </div>

        {/* Role Selection Tabs */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">Select Your Role</label>
          <div className="flex gap-3">
            {["admin", "doctor", "receptionist"].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => handleRoleChange(role)}
                className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                  selectedRole === role
                    ? "bg-blue-600 text-white border-2 border-blue-600"
                    : "bg-gray-100 text-gray-700 border-2 border-gray-200 hover:border-gray-300"
                }`}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-2">
            {roleDescriptions[selectedRole as keyof typeof roleDescriptions]}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                placeholder="username"
                required
              />
            </div>
          </div>

          {/* Full Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
              placeholder="Enter your full name"
              required
            />
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          {/* Phone Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                placeholder="Enter your phone number"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full pl-10 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Specialty Field (Doctor only) */}
          {selectedRole === "doctor" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Specialty</label>
              <input
                type="text"
                name="specialty"
                value={formData.specialty}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                placeholder="e.g., General Dentistry, Orthodontics"
              />
            </div>
          )}

          {/* Create Account Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-lg transition-colors duration-200 mt-6"
          >
            {isLoading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        {/* Sign In Link */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
            Sign In
          </a>
        </p>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-gray-500 mt-6">© 2025 DentalCare Pro. All rights reserved.</p>
    </div>
  )
}
