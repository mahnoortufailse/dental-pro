//@ts-nocheck
"use client"

import type React from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/components/auth-context"
import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { Plus, Edit2, Trash2, DollarSign, Clock, FileText } from "lucide-react"
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal"

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
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [billingToDelete, setBillingToDelete] = useState<any>(null)

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
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto md:pt-0 pt-16">
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Billing & Invoicing</h1>
                <p className="text-muted-foreground text-sm mt-1">Manage patient payments and invoices</p>
              </div>
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
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors text-sm sm:text-base font-medium"
              >
                <Plus className="w-4 h-4" />
                {showForm ? "Cancel" : "Add Billing"}
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
              <div className="stat-card">
                <div className="stat-icon bg-gradient-to-br from-accent/20 to-accent/10">
                  <DollarSign className="w-6 h-6 text-accent" />
                </div>
                <p className="stat-label">Total Revenue</p>
                <p className="stat-value">${stats.totalRevenue.toFixed(2)}</p>
              </div>

              <div className="stat-card">
                <div className="stat-icon bg-gradient-to-br from-destructive/20 to-destructive/10">
                  <Clock className="w-6 h-6 text-destructive" />
                </div>
                <p className="stat-label">Pending Amount</p>
                <p className="stat-value">${stats.pendingAmount.toFixed(2)}</p>
              </div>

              <div className="stat-card">
                <div className="stat-icon bg-gradient-to-br from-primary/20 to-primary/10">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
                <p className="stat-label">Total Invoices</p>
                <p className="stat-value">{stats.totalInvoices}</p>
              </div>
            </div>

            {/* Add/Edit Form */}
            {showForm && (
              <div className="bg-card rounded-lg shadow-md border border-border p-6 mb-8">
                <h2 className="text-lg sm:text-xl font-bold mb-6 text-foreground">
                  {editingId ? "Edit Billing Record" : "Add Billing Record"}
                </h2>
                <form onSubmit={handleAddBilling} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <select
                      value={formData.patientId}
                      onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
                      className="px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
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
                      onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                      className="px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm"
                      required
                    />
                    <input
                      type="number"
                      placeholder="Paid Amount"
                      value={formData.paidAmount}
                      onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                      className="px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm"
                    />
                    <select
                      value={formData.paymentStatus}
                      onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                      className="px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
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
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm"
                    rows={2}
                  />
                  <textarea
                    placeholder="Notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm"
                    rows={2}
                  />
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="submit"
                      className="bg-accent hover:bg-accent/90 text-accent-foreground px-4 py-2 rounded-lg transition-colors text-sm font-medium"
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
                        className="bg-muted hover:bg-muted/80 text-muted-foreground px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* Billing Table */}
            <div className="bg-card rounded-lg shadow-md border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="text-left px-4 sm:px-6 py-3 font-semibold text-muted-foreground">Patient</th>
                      <th className="text-left px-4 sm:px-6 py-3 font-semibold text-muted-foreground hidden sm:table-cell">
                        Total
                      </th>
                      <th className="text-left px-4 sm:px-6 py-3 font-semibold text-muted-foreground hidden md:table-cell">
                        Paid
                      </th>
                      <th className="text-left px-4 sm:px-6 py-3 font-semibold text-muted-foreground">Status</th>
                      <th className="text-left px-4 sm:px-6 py-3 font-semibold text-muted-foreground hidden lg:table-cell">
                        Date
                      </th>
                      <th className="text-left px-4 sm:px-6 py-3 font-semibold text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billing.length > 0 ? (
                      billing.map((bill) => (
                        <tr key={bill._id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="px-4 sm:px-6 py-3 font-medium text-foreground">
                            {patients.find((p) => p._id === bill.patientId)?.name || "Unknown"}
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-muted-foreground hidden sm:table-cell">
                            ${bill.totalAmount.toFixed(2)}
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-muted-foreground hidden md:table-cell">
                            ${bill.paidAmount.toFixed(2)}
                          </td>
                          <td className="px-4 sm:px-6 py-3">
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${
                                bill.paymentStatus === "Paid"
                                  ? "bg-accent/20 text-accent"
                                  : bill.paymentStatus === "Partially Paid"
                                    ? "bg-secondary/20 text-secondary"
                                    : "bg-destructive/20 text-destructive"
                              }`}
                            >
                              {bill.paymentStatus}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-muted-foreground hidden lg:table-cell text-xs">
                            {new Date(bill.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 sm:px-6 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditBilling(bill)}
                                className="text-primary hover:text-primary/80 transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setBillingToDelete(bill)
                                  setShowDeleteModal(true)
                                }}
                                className="text-destructive hover:text-destructive/80 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 sm:px-6 py-8 text-center text-muted-foreground">
                          No billing records found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <ConfirmDeleteModal
              isOpen={showDeleteModal}
              title="Delete Billing Record"
              description="Are you sure you want to delete this billing record? This action cannot be undone."
              itemName={
                billingToDelete
                  ? `${patients.find((p) => p._id === billingToDelete.patientId)?.name || "Unknown"} - $${billingToDelete.totalAmount.toFixed(2)}`
                  : undefined
              }
              onConfirm={() => {
                handleDeleteBilling(billingToDelete._id)
                setShowDeleteModal(false)
                setBillingToDelete(null)
              }}
              onCancel={() => {
                setShowDeleteModal(false)
                setBillingToDelete(null)
              }}
            />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
