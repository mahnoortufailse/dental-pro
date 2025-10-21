"use client"

import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        {/* Logo and Branding */}
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

        <LoginForm />
      </div>
    </div>
  )
}
