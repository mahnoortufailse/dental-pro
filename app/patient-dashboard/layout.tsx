// app/patient-dashboard/layout.tsx
"use client"

import { PatientSidebar } from "@/components/patient-sidebar"
import { ProtectedRoute } from "@/components/protected-route"

export default function PatientDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute patientOnly={true}>
      <div className="flex h-screen bg-background">
        <PatientSidebar />
        <main className="flex-1 overflow-auto lg:ml-0">
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
