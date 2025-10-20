"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "./auth-context"
import { Eye, EyeOff, Lock, User } from "lucide-react"
import toast from "react-hot-toast"

export function LoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const validateForm = (): boolean => {
    if (!username.trim()) {
      toast.error("Username is required")
      return false
    }

    if (username.trim().length < 3) {
      toast.error("Username must be at least 3 characters")
      return false
    }

    if (!password) {
      toast.error("Password is required")
      return false
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      await login(username, password)
      toast.success("Login successful!")
      router.push("/dashboard")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed"
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome Back</h2>
          <p className="text-gray-500 text-sm">Sign in to your account</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-blue-50 border border-blue-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                placeholder="Enter your username"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-blue-50 border border-blue-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-600">Remember me</span>
            </label>
            <a href="#" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Forgot password?
            </a>
          </div>

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-lg transition-colors duration-200"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 border-t border-gray-200"></div>

        {/* Sign Up Link */}
        <div className="text-center mb-6">
          <p className="text-gray-600 text-sm mb-3">Don't have an account? Create one to get started.</p>
          <a
            href="/signup"
            className="block w-full bg-green-50 hover:bg-green-100 text-green-700 font-semibold py-2.5 rounded-lg transition-colors duration-200 border border-green-200"
          >
            Create New Account
          </a>
        </div>

        {/* Getting Started */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
          <h3 className="text-sm font-semibold text-blue-900 mb-3">Getting Started</h3>
          <ol className="text-xs text-blue-800 space-y-2">
            <li>1. Click "Create New Account"</li>
            <li>2. Select your role (Admin, Doctor, or Receptionist)</li>
            <li>3. Fill in your details</li>
            <li>4. You'll be logged in automatically</li>
          </ol>
        </div>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-gray-500 mt-6">© 2025 DentalCare Pro. All rights reserved.</p>
    </div>
  )
}
