//@ts-nocheck
"use client"

import type React from "react"

import { ProtectedRoute } from "@/components/protected-route"
import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/components/auth-context"
import { useState, useEffect } from "react"
import toast from "react-hot-toast"

export default function BillingPage() {
  const { user, token } = useAuth()
  const [billing, setBilling] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    patientId: "",
    treatments: "",
    totalAmount: "",
    paidAmount: "",
    paymentStatus: "Pending",
    notes: "",
  })
  const [patients, setPatients] = useState([])
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingAmount: 0,
    totalInvoices: 0,
  })

  useEffect(() => {
    if (token) {
      fetchBilling()
      fetchPatients()
    }
  }, [token])

  const fetchBilling = async () => {
    try {
      const res = await fetch("/api/billing", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        const billingData = data.billing || []
        setBilling(billingData)

        const totalRevenue = billingData.reduce((sum: number, b: any) => sum + (b.totalAmount || 0), 0)
        const pendingAmount = billingData
          .filter((b: any) => b.paymentStatus !== "Paid")
          .reduce((sum: number, b: any) => sum + ((b.totalAmount || 0) - (b.paidAmount || 0)), 0)

        setStats({
          totalRevenue,
          pendingAmount,
          totalInvoices: billingData.length,
        })
      }
    } catch (error) {
      console.error("Failed to fetch billing:", error)
    }
  }

  const fetchPatients = async () => {
    try {
      const res = await fetch("/api/patients", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setPatients(data.patients || [])
      }
    } catch (error) {
      console.error("Failed to fetch patients:", error)
    }
  }

  const handleDeleteBilling = async (billingId: string) => {
    if (!window.confirm("Are you sure you want to delete this billing record?")) return

    try {
      const res = await fetch(`/api/billing/${billingId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        setBilling(billing.filter((b) => b._id !== billingId))
        toast.success("Billing record deleted successfully")
        fetchBilling()
      } else {
        toast.error("Failed to delete billing record")
      }
    } catch (error) {
      console.error("Failed to delete billing:", error)
      toast.error("Error deleting billing record")
    }
  }

  const handleEditBilling = (bill: any) => {
    setEditingId(bill._id)
    setFormData({
      patientId: bill.patientId,
      treatments: bill.treatments?.map((t: any) => t.name).join(", ") || "",
      totalAmount: bill.totalAmount.toString(),
      paidAmount: bill.paidAmount.toString(),
      paymentStatus: bill.paymentStatus,
      notes: bill.notes || "",
    })
    setShowForm(true)
  }

  const handleAddBilling = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const method = editingId ? "PUT" : "POST"
      const url = editingId ? `/api/billing/${editingId}` : "/api/billing"

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          totalAmount: Number.parseFloat(formData.totalAmount),
          paidAmount: Number.parseFloat(formData.paidAmount) || 0,
          treatments: formData.treatments.split(",").map((t) => ({ name: t.trim(), cost: 0, quantity: 1 })),
        }),
      })

      if (res.ok) {
        if (editingId) {
          toast.success("Billing record updated successfully")
          setEditingId(null)
        } else {
          toast.success("Billing record added successfully")
        }
        setBilling([])
        setShowForm(false)
        setFormData({
          patientId: "",
          treatments: "",
          totalAmount: "",
          paidAmount: "",
          paymentStatus: "Pending",
          notes: "",
        })
        fetchBilling()
      } else {
        toast.error("Failed to save billing record")
      }
    } catch (error) {
      console.error("Failed to add billing:", error)
      toast.error("Error saving billing record")
    }
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "receptionist"]}>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold">Billing & Invoicing</h1>
              <button
                onClick={() => {
                  setEditingId(null)
                  setShowForm(!showForm)
                  if (!showForm) {
                    setFormData({
                      patientId: "",
                      treatments: "",
                      totalAmount: "",
                      paidAmount: "",
                      paymentStatus: "Pending",
                      notes: "",
                    })
                  }
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {showForm ? "Cancel" : "Add Billing Record"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-gray-600 text-sm">Total Revenue</p>
                <p className="text-3xl font-bold text-green-600">${stats.totalRevenue.toFixed(2)}</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-gray-600 text-sm">Pending Amount</p>
                <p className="text-3xl font-bold text-yellow-600">${stats.pendingAmount.toFixed(2)}</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <p className="text-gray-600 text-sm">Total Invoices</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalInvoices}</p>
              </div>
            </div>

            {showForm && (
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-xl font-bold mb-4">{editingId ? "Edit Billing Record" : "Add Billing Record"}</h2>
                <form onSubmit={handleAddBilling} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      value={formData.patientId}
                      onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Patient</option>
                      {patients.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Total Amount"
                      value={formData.totalAmount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          totalAmount: e.target.value,
                        })
                      }
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Paid Amount"
                      value={formData.paidAmount}
                      onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={formData.paymentStatus}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          paymentStatus: e.target.value,
                        })
                      }
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Partially Paid">Partially Paid</option>
                    </select>
                  </div>
                  <textarea
                    placeholder="Treatments (comma-separated)"
                    value={formData.treatments}
                    onChange={(e) => setFormData({ ...formData, treatments: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <textarea
                    placeholder="Notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      {editingId ? "Update Record" : "Add Billing Record"}
                    </button>
                    {editingId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null)
                          setShowForm(false)
                        }}
                        className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="text-left px-6 py-3 font-semibold">Patient</th>
                    <th className="text-left px-6 py-3 font-semibold">Total Amount</th>
                    <th className="text-left px-6 py-3 font-semibold">Paid Amount</th>
                    <th className="text-left px-6 py-3 font-semibold">Status</th>
                    <th className="text-left px-6 py-3 font-semibold">Date</th>
                    <th className="text-left px-6 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {billing.map((bill) => (
                    <tr key={bill._id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-3">{patients.find((p) => p._id === bill.patientId)?.name || "Unknown"}</td>

                      <td className="px-6 py-3">${bill.totalAmount.toFixed(2)}</td>
                      <td className="px-6 py-3">${bill.paidAmount.toFixed(2)}</td>
                      <td className="px-6 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            bill.paymentStatus === "Paid"
                              ? "bg-green-100 text-green-800"
                              : bill.paymentStatus === "Partially Paid"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {bill.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-3">{new Date(bill.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-3 space-x-2">
                        <button
                          onClick={() => handleEditBilling(bill)}
                          className="text-green-600 hover:underline text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteBilling(bill._id)}
                          className="text-red-600 hover:underline text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
