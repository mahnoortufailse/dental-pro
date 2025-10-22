"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

interface User {
  id: string
  name: string
  email: string
  role: "admin" | "doctor" | "receptionist"
}

interface Patient {
  _id: string
  name: string
  email: string
  phone: string
  dob: string
  address: string
  insuranceProvider: string
  insuranceNumber: string
  allergies: string[]
  medicalConditions: string[]
  balance: number
}

interface AuthContextType {
  user: User | null
  patient: Patient | null
  token: string | null
  patientToken: string | null
  login: (username: string, password: string) => Promise<void>
  signup: (data: any) => Promise<void>
  logout: () => void
  setPatient: (patient: Patient | null) => void
  setPatientToken: (token: string | null) => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [patient, setPatient] = useState<Patient | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [patientToken, setPatientToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await fetch("/api/init")
      } catch (error) {
        console.error("[v0] Failed to initialize database:", error)
      }

      // Check if staff user is already logged in
      const storedToken = sessionStorage.getItem("token")
      const storedUser = sessionStorage.getItem("user")

      if (storedToken && storedUser) {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      }

      const storedPatientToken = sessionStorage.getItem("patientToken")
      const storedPatient = sessionStorage.getItem("patient")

      if (storedPatientToken && storedPatient) {
        setPatientToken(storedPatientToken)
        setPatient(JSON.parse(storedPatient))
      }

      setIsLoading(false)
    }

    initializeApp()
  }, [])

  const login = async (username: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Login failed")
    }

    const data = await response.json()
    setToken(data.token)
    setUser(data.user)
    sessionStorage.setItem("token", data.token)
    sessionStorage.setItem("user", JSON.stringify(data.user))
  }

  const signup = async (data: any) => {
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.message || "Signup failed")
      }

      setToken(result.token)
      setUser(result.user)
      sessionStorage.setItem("token", result.token)
      sessionStorage.setItem("user", JSON.stringify(result.user))
    } catch (error: any) {
      throw new Error(error.message)
    }
  }

  const logout = () => {
    setUser(null)
    setPatient(null)
    setToken(null)
    setPatientToken(null)
    sessionStorage.removeItem("token")
    sessionStorage.removeItem("user")
    sessionStorage.removeItem("patientToken")
    sessionStorage.removeItem("patient")
  }

  const updatePatient = (patientData: Patient | null) => {
    setPatient(patientData)
  }

  const updatePatientToken = (tokenData: string | null) => {
    setPatientToken(tokenData)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        patient,
        token,
        patientToken,
        login,
        signup,
        logout,
        setPatient: updatePatient,
        setPatientToken: updatePatientToken,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
