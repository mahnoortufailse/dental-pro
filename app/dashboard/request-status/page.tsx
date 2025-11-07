//@ts-nocheck
"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/components/auth-context"
import { useEffect, useState } from "react"
import { toast } from "react-hot-toast"
import { AlertCircle, Loader2, Search } from "lucide-react"
import { useRouter } from "next/navigation"

interface PatientReferral {
  _id: string
  id: string
  doctorId: string
  doctorName: string
  patientName: string
  patientPhone: string
  patientEmail: string
  patientDob: string
  patientIdNumber: string
  patientAddress: string
  patientAllergies: string[]
  patientMedicalConditions: string[]
  referralReason: string
  status: "pending" | "in-progress" | "completed" | "rejected"
  pictureUrl?: string
  pictureSavedBy?: string
  appointmentId?: string
  notes: string
  rejectionReason?: string
  createdAt: string
  updatedAt: string
}

export default function RequestStatusPage() {
  const { user, token } = useAuth()
  const router = useRouter()
  const [referrals, setReferrals] = useState<PatientReferral[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "in-progress" | "completed" | "rejected">("all")

  useEffect(() => {
    if (token && user?.role === "doctor") {
      fetchReferrals()
    } else if (user?.role !== "doctor") {
      router.push("/dashboard")
    }
  }, [token, user, router])

  const fetchReferrals = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/patient-referrals", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        // Filter for current doctor's referrals
        const doctorReferrals = (data.referrals || []).filter((ref: PatientReferral) => ref.doctorId === user?.id)
        setReferrals(doctorReferrals)
      } else {
        toast.error("Failed to fetch requests")
      }
    } catch (error) {
      console.error("Failed to fetch referrals:", error)
      toast.error("Error fetching requests")
    } finally {
      setLoading(false)
    }
  }

  // Filter referrals based on search and status
  const filteredReferrals = referrals.filter((referral) => {
    const matchesSearch =
      referral.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      referral.patientPhone.includes(searchTerm) ||
      referral.patientEmail.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = filterStatus === "all" || referral.status === filterStatus

    return matchesSearch && matchesStatus
  })

  // Sort by date (newest first)
  const sortedReferrals = [...filteredReferrals].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800"
      case "in-progress":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "rejected":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto md:pt-0 pt-16">
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Your Request Status</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Track and view the status of all your patient referral requests
              </p>
            </div>

            {/* Filters and Search */}
            <div className="bg-card rounded-lg shadow-md border border-border p-4 mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search requests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm"
                  />
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2">
                  <label htmlFor="statusFilter" className="text-sm text-muted-foreground whitespace-nowrap">
                    Status:
                  </label>
                  <select
                    id="statusFilter"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            {!loading && referrals.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-card rounded-lg shadow-md border border-border p-4">
                  <p className="text-xs text-muted-foreground font-medium uppercase">Total Requests</p>
                  <p className="text-2xl font-bold text-foreground mt-2">{referrals.length}</p>
                </div>
                <div className="bg-card rounded-lg shadow-md border border-border p-4">
                  <p className="text-xs text-muted-foreground font-medium uppercase">Pending</p>
                  <p className="text-2xl font-bold text-amber-600 mt-2">
                    {referrals.filter((r) => r.status === "pending").length}
                  </p>
                </div>
                <div className="bg-card rounded-lg shadow-md border border-border p-4">
                  <p className="text-xs text-muted-foreground font-medium uppercase">Completed</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    {referrals.filter((r) => r.status === "completed").length}
                  </p>
                </div>
                <div className="bg-card rounded-lg shadow-md border border-border p-4">
                  <p className="text-xs text-muted-foreground font-medium uppercase">Rejected</p>
                  <p className="text-2xl font-bold text-red-600 mt-2">
                    {referrals.filter((r) => r.status === "rejected").length}
                  </p>
                </div>
              </div>
            )}

            {/* Content */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : sortedReferrals.length === 0 ? (
              <div className="text-center py-12 bg-card rounded-lg border border-border">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm || filterStatus !== "all"
                    ? "No requests match your search criteria."
                    : "No patient requests yet."}
                </p>
              </div>
            ) : (
              <div className="bg-card rounded-lg shadow-md border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted border-b border-border">
                      <tr>
                        <th className="text-left px-4 sm:px-6 py-3 font-semibold text-muted-foreground">
                          Patient Name
                        </th>
                        <th className="text-left px-4 sm:px-6 py-3 font-semibold text-muted-foreground hidden sm:table-cell">
                          Phone
                        </th>
                        <th className="text-left px-4 sm:px-6 py-3 font-semibold text-muted-foreground hidden md:table-cell">
                          Reason
                        </th>
                        <th className="text-left px-4 sm:px-6 py-3 font-semibold text-muted-foreground">Status</th>
                        <th className="text-left px-4 sm:px-6 py-3 font-semibold text-muted-foreground hidden lg:table-cell">
                          Submitted
                        </th>
                        <th className="text-left px-4 sm:px-6 py-3 font-semibold text-muted-foreground">Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedReferrals.map((referral) => (
                        <tr key={referral._id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="px-4 sm:px-6 py-3 font-medium text-foreground">{referral.patientName}</td>
                          <td className="px-4 sm:px-6 py-3 text-muted-foreground hidden sm:table-cell text-sm">
                            {referral.patientPhone}
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-muted-foreground hidden md:table-cell text-sm truncate max-w-xs">
                            {referral.referralReason}
                          </td>
                          <td className="px-4 sm:px-6 py-3">
                            <span
                              className={`inline-block text-xs px-2 py-1 rounded-full font-medium ${getStatusBadgeColor(referral.status)}`}
                            >
                              {referral.status}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-muted-foreground hidden lg:table-cell text-sm">
                            {new Date(referral.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-muted-foreground text-sm">
                            {new Date(referral.updatedAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Info */}
                <div className="px-4 sm:px-6 py-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
                  <div>
                    Showing <span className="font-medium">{sortedReferrals.length}</span> of{" "}
                    <span className="font-medium">{referrals.length}</span> requests
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
