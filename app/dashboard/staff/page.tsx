//@ts-nocheck
"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/components/auth-context"
import { useState, useEffect } from "react"
import toast from "react-hot-toast"
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal"

export default function StaffPage() {
  const { user, token } = useAuth()
  const [staff, setStaff] = useState([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [staffToDelete, setStaffToDelete] = useState<any>(null)
  const [isLoadingFetch, setIsLoadingFetch] = useState(false)
  const [isLoadingDelete, setIsLoadingDelete] = useState(false)

  useEffect(() => {
    if (token) {
      fetchStaff()
    }
  }, [token])

  const fetchStaff = async () => {
    setIsLoadingFetch(true)
    try {
      const res = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setStaff(data.users || [])
      }
    } catch (error) {
      console.error("Failed to fetch staff:", error)
    } finally {
      setIsLoadingFetch(false)
    }
  }

  const handleDeleteStaff = async (staffId: string) => {
    setIsLoadingDelete(true)
    try {
      const res = await fetch(`/api/users/${staffId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        setStaff(staff.filter((s) => s.id !== staffId))
        toast.success("Staff member deleted successfully")
      } else {
        toast.error("Failed to delete staff member")
      }
    } catch (error) {
      console.error("Failed to delete staff:", error)
      toast.error("Error deleting staff member")
    } finally {
      setIsLoadingDelete(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            <h1 className="text-3xl font-bold mb-8">Staff Management</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-gray-600 text-sm">Total Staff</p>
                <p className="text-3xl font-bold text-blue-600">{staff.length}</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-gray-600 text-sm">Doctors</p>
                <p className="text-3xl font-bold text-blue-600">{staff.filter((s) => s.role === "doctor").length}</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-gray-600 text-sm">Receptionists</p>
                <p className="text-3xl font-bold text-green-600">
                  {staff.filter((s) => s.role === "receptionist").length}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="flex justify-between items-center p-6 border-b">
                <h2 className="text-lg font-semibold">Staff Members</h2>
                <a
                  href="/signup"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Register New Staff
                </a>
              </div>
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="text-left px-6 py-3 font-semibold">Name</th>
                    <th className="text-left px-6 py-3 font-semibold">Email</th>
                    <th className="text-left px-6 py-3 font-semibold">Role</th>
                    <th className="text-left px-6 py-3 font-semibold">Specialty</th>
                    <th className="text-left px-6 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingFetch ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center">
                        <div className="flex justify-center items-center gap-2">
                          <div className="w-4 h-4 bg-blue-600 rounded-full animate-bounce"></div>
                          <div
                            className="w-4 h-4 bg-blue-600 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-4 h-4 bg-blue-600 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                          <span className="text-gray-600 ml-2">Loading staff...</span>
                        </div>
                      </td>
                    </tr>
                  ) : staff.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No staff members found
                      </td>
                    </tr>
                  ) : (
                    staff.map((member) => (
                      <tr key={member.id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-3">{member.name}</td>
                        <td className="px-6 py-3">{member.email}</td>
                        <td className="px-6 py-3">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs capitalize">
                            {member.role}
                          </span>
                        </td>
                        <td className="px-6 py-3">{member.specialty || "-"}</td>
                        <td className="px-6 py-3">
                          <button
                            onClick={() => {
                              setStaffToDelete(member)
                              setShowDeleteModal(true)
                            }}
                            disabled={isLoadingDelete}
                            className="text-red-600 hover:underline text-sm disabled:text-red-400 disabled:cursor-not-allowed transition-colors"
                          >
                            {isLoadingDelete ? "Deleting..." : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <ConfirmDeleteModal
              isOpen={showDeleteModal}
              title="Delete Staff Member"
              description="Are you sure you want to delete this staff member? This action cannot be undone."
              itemName={staffToDelete?.name}
              onConfirm={() => {
                handleDeleteStaff(staffToDelete.id)
                setShowDeleteModal(false)
                setStaffToDelete(null)
              }}
              onCancel={() => {
                setShowDeleteModal(false)
                setStaffToDelete(null)
              }}
            />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
