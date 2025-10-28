//@ts-nocheck
"use client"

import type React from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/components/auth-context"
import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { Plus, Edit2, Trash2, DollarSign, Clock, FileText, Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal"
import { SearchableDropdown } from "@/components/searchable-dropdown"

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

  // Loading states
  const [loading, setLoading] = useState({
    billing: false,
    patients: false,
    submit: false,
    delete: false,
  })

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (token) {
      fetchBilling()
      fetchPatients()
    }
  }, [token])

  const fetchBilling = async () => {
    setLoading((prev) => ({ ...prev, billing: true }))
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
      toast.error("Failed to load billing records")
    } finally {
      setLoading((prev) => ({ ...prev, billing: false }))
    }
  }

  const fetchPatients = async () => {
    setLoading((prev) => ({ ...prev, patients: true }))
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
      toast.error("Failed to load patients")
    } finally {
      setLoading((prev) => ({ ...prev, patients: false }))
    }
  }

  const handleDeleteBilling = async (billingId: string) => {
    setLoading((prev) => ({ ...prev, delete: true }))
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
    } finally {
      setLoading((prev) => ({ ...prev, delete: false }))
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
    setLoading((prev) => ({ ...prev, submit: true }))

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
    } finally {
      setLoading((prev) => ({ ...prev, submit: false }))
    }
  }

  // Filter billing records based on search term
  const filteredBilling = billing.filter((bill) => {
    if (!searchTerm) return true
    
    const patientName = patients.find((p) => p._id === bill.patientId)?.name || "Unknown"
    return patientName.toLowerCase().includes(searchTerm.toLowerCase())
  })

  // Calculate pagination
  const totalPages = Math.ceil(filteredBilling.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentBilling = filteredBilling.slice(startIndex, endIndex)

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, itemsPerPage])

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
                disabled={loading.billing || loading.patients || loading.submit}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground px-4 py-2 rounded-lg transition-colors text-sm sm:text-base font-medium cursor-pointer disabled:cursor-not-allowed"
              >
                {loading.submit ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {showForm ? "Cancel" : "Add Billing"}
              </button>
            </div>

            {/* Stats */}
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
                    {/* Searchable Dropdown for Patient */}
                    <SearchableDropdown
                      label="Patient"
                      items={patients.map((p) => ({ id: p._id, name: p.name }))}
                      selectedItem={patients.find((p) => p._id === formData.patientId) || null}
                      onSelect={(item) =>
                        setFormData({
                          ...formData,
                          patientId: item ? item.id : "",
                        })
                      }
                      placeholder="Select Patient"
                      searchPlaceholder="Search patients..."
                      required
                      disabled={loading.submit}
                    />

                     <input
                      type="number"
                      placeholder="Total Amount"
                      value={formData.totalAmount}
                      onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                      className="px-4 !py-0 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm cursor-text disabled:cursor-not-allowed"
                      required
                      disabled={loading.submit}
                    />
                    <input
                      type="number"
                      placeholder="Paid Amount"
                      value={formData.paidAmount}
                      onChange={(e) => setFormData({ ...formData, paidAmount: e.target.value })}
                      className="px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm cursor-text disabled:cursor-not-allowed"
                      disabled={loading.submit}
                    />
                    <select
                      value={formData.paymentStatus}
                      onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                      className="px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm cursor-text disabled:cursor-not-allowed"
                      disabled={loading.submit}
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
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm cursor-text disabled:cursor-not-allowed"
                    rows={2}
                    disabled={loading.submit}
                  />
                  <textarea
                    placeholder="Notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm cursor-text disabled:cursor-not-allowed"
                    rows={2}
                    disabled={loading.submit}
                  />

                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="submit"
                      disabled={loading.submit}
                      className="flex items-center gap-2 bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-accent-foreground px-4 py-2 rounded-lg transition-colors text-sm font-medium cursor-pointer disabled:cursor-not-allowed"
                    >
                      {loading.submit && <Loader2 className="w-4 h-4 animate-spin" />}
                      {editingId ? "Update Record" : "Add Billing Record"}
                    </button>
                    {editingId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null)
                          setShowForm(false)
                        }}
                        disabled={loading.submit}
                        className="bg-muted hover:bg-muted/80 disabled:bg-muted/50 text-muted-foreground px-4 py-2 rounded-lg transition-colors text-sm font-medium cursor-pointer disabled:cursor-not-allowed"
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
              {/* Search and Controls */}
              <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search patients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm"
                  />
                </div>
                
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  <div className="flex items-center gap-2">
                    <label htmlFor="itemsPerPage" className="text-sm text-muted-foreground whitespace-nowrap">
                      Rows per page:
                    </label>
                    <select
                      id="itemsPerPage"
                      value={itemsPerPage}
                      onChange={(e) => setItemsPerPage(Number(e.target.value))}
                      className="px-2 py-1 bg-input border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary text-foreground text-sm"
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                    </select>
                  </div>
                  
                  <button
                    onClick={fetchBilling}
                    disabled={loading.billing}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors font-medium text-sm disabled:opacity-50 cursor-pointer"
                  >
                    <Loader2 className={`w-4 h-4 ${loading.billing ? 'animate-spin' : ''}`} />
                    {loading.billing ? "Loading..." : "Refresh"}
                  </button>
                </div>
              </div>

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
                    {loading.billing ? (
                      <tr>
                        <td colSpan={6} className="px-4 sm:px-6 py-8 text-center">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <div className="flex justify-center items-center gap-2">
                              <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
                              <div
                                className="w-3 h-3 bg-primary rounded-full animate-bounce"
                                style={{ animationDelay: "0.1s" }}
                              ></div>
                              <div
                                className="w-3 h-3 bg-primary rounded-full animate-bounce"
                                style={{ animationDelay: "0.2s" }}
                              ></div>
                            </div>
                            <span className="text-muted-foreground text-sm">Loading billing records...</span>
                          </div>
                        </td>
                      </tr>
                    ) : currentBilling.length > 0 ? (
                      currentBilling.map((bill) => (
                        <tr key={bill._id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="px-4 sm:px-6 py-3 font-medium text-foreground">
                            <div>
                              <div className="sm:hidden text-xs text-muted-foreground mb-1">Patient</div>
                              {patients.find((p) => p._id === bill.patientId)?.name || "Unknown"}
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-muted-foreground hidden sm:table-cell">
                            <div>
                              <div className="md:hidden text-xs text-muted-foreground mb-1">Total</div>
                              ${bill.totalAmount.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-muted-foreground hidden md:table-cell">
                            <div>
                              <div className="lg:hidden text-xs text-muted-foreground mb-1">Paid</div>
                              ${bill.paidAmount.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-3">
                            <div>
                              <div className="sm:hidden text-xs text-muted-foreground mb-1">Status</div>
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
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-muted-foreground hidden lg:table-cell text-xs">
                            <div>
                              <div className="xl:hidden text-xs text-muted-foreground mb-1">Date</div>
                              {new Date(bill.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditBilling(bill)}
                                disabled={loading.submit || loading.delete}
                                className="text-primary hover:text-primary/80 disabled:text-primary/50 transition-colors cursor-pointer disabled:cursor-not-allowed"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setBillingToDelete(bill)
                                  setShowDeleteModal(true)
                                }}
                                disabled={loading.submit || loading.delete}
                                className="text-destructive hover:text-destructive/80 disabled:text-destructive/50 transition-colors cursor-pointer disabled:cursor-not-allowed"
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
                          {searchTerm ? "No billing records found matching your search" : "No billing records found"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredBilling.length > 0 && (
                <div className="px-4 sm:px-6 py-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-muted-foreground">
                    Showing <span className="font-medium">{filteredBilling.length === 0 ? 0 : startIndex + 1}</span> to{" "}
                    <span className="font-medium">{Math.min(endIndex, filteredBilling.length)}</span> of{" "}
                    <span className="font-medium">{filteredBilling.length}</span> results
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded border border-border bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => 
                          page === 1 || 
                          page === totalPages ||
                          Math.abs(page - currentPage) <= 1
                        )
                        .map((page, index, array) => {
                          const showEllipsis = index < array.length - 1 && array[index + 1] - page > 1;
                          return (
                            <div key={page} className="flex items-center">
                              <button
                                onClick={() => setCurrentPage(page)}
                                className={`min-w-[2rem] h-8 px-2 rounded text-sm font-medium transition-colors ${
                                  currentPage === page
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-background text-foreground hover:bg-muted border border-border"
                                }`}
                              >
                                {page}
                              </button>
                              {showEllipsis && (
                                <span className="px-1 text-muted-foreground">...</span>
                              )}
                            </div>
                          );
                        })}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="p-2 rounded border border-border bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
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
              isLoading={loading.delete}
            />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}