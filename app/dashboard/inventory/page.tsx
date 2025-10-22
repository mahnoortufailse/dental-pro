//@ts-nocheck
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import toast from "react-hot-toast"
import { ProtectedRoute } from "@/components/protected-route"
import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/components/auth-context"
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal"

export default function InventoryPage() {
  const { token } = useAuth()
  const [inventory, setInventory] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    quantity: "",
    minStock: "",
    unit: "",
    supplier: "",
  })
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<any>(null)

  // Fetch inventory on load or token change
  useEffect(() => {
    if (token) fetchInventory()
  }, [token])

  const fetchInventory = async () => {
    try {
      const res = await fetch("/api/inventory", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setInventory(data.inventory || [])
      }
    } catch (error) {
      console.error("Failed to fetch inventory:", error)
      toast.error("Failed to load inventory")
    }
  }

  const handleDeleteItem = async (_id: string) => {
    try {
      const res = await fetch(`/api/inventory/${_id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        setInventory(inventory.filter((i) => i._id !== _id))
        toast.success("Item deleted successfully")
      } else {
        toast.error("Failed to delete item")
      }
    } catch (error) {
      console.error("Delete error:", error)
      toast.error("Error deleting item")
    }
  }

  const handleEditItem = (item: any) => {
    setEditingId(item._id)
    setFormData({
      name: item.name,
      quantity: item.quantity.toString(),
      minStock: item.minStock.toString(),
      unit: item.unit,
      supplier: item.supplier,
    })
    setShowForm(true)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const method = editingId ? "PUT" : "POST"
      const url = editingId ? `/api/inventory/${editingId}` : "/api/inventory"

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          quantity: Number.parseInt(formData.quantity),
          minStock: Number.parseInt(formData.minStock),
        }),
      })

      if (!res.ok) throw new Error("Failed to save item")

      const data = await res.json()

      if (editingId) {
        setInventory(inventory.map((i) => (i._id === editingId ? data.item : i)))
        toast.success("Item updated successfully")
        setEditingId(null)
      } else {
        setInventory([...inventory, data.item])
        toast.success("Item added successfully")
      }

      setShowForm(false)
      setFormData({ name: "", quantity: "", minStock: "", unit: "", supplier: "" })
    } catch (error) {
      console.error("Save error:", error)
      toast.error("Error saving item")
    }
  }

  const lowStockItems = inventory.filter((item) => item.quantity < item.minStock)

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-auto p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Inventory Management</h1>
            <button
              onClick={() => {
                setEditingId(null)
                setShowForm(!showForm)
                if (!showForm) setFormData({ name: "", quantity: "", minStock: "", unit: "", supplier: "" })
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showForm ? "Cancel" : "Add Item"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600 text-sm">Total Items</p>
              <p className="text-3xl font-bold text-blue-600">{inventory.length}</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <p className="text-gray-600 text-sm">Low Stock Items</p>
              <p className="text-3xl font-bold text-red-600">{lowStockItems.length}</p>
            </div>
          </div>

          {showForm && (
            <div className="bg-white rounded-lg shadow p-6 mb-8">
              <h2 className="text-xl font-bold mb-4">{editingId ? "Edit Inventory Item" : "Add Inventory Item"}</h2>
              <form onSubmit={handleFormSubmit} className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Item Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="number"
                  placeholder="Quantity"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="number"
                  placeholder="Minimum Stock"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Unit (e.g., boxes, units)"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2 col-span-2">
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {editingId ? "Update Item" : "Add Item"}
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
                  <th className="text-left px-6 py-3 font-semibold">Item Name</th>
                  <th className="text-left px-6 py-3 font-semibold">Quantity</th>
                  <th className="text-left px-6 py-3 font-semibold">Min Stock</th>
                  <th className="text-left px-6 py-3 font-semibold">Unit</th>
                  <th className="text-left px-6 py-3 font-semibold">Supplier</th>
                  <th className="text-left px-6 py-3 font-semibold">Status</th>
                  <th className="text-left px-6 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => (
                  <tr key={item._id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3">{item.name}</td>
                    <td className="px-6 py-3">{item.quantity}</td>
                    <td className="px-6 py-3">{item.minStock}</td>
                    <td className="px-6 py-3">{item.unit}</td>
                    <td className="px-6 py-3">{item.supplier}</td>
                    <td className="px-6 py-3">
                      {item.quantity < item.minStock ? (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Low Stock</span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">In Stock</span>
                      )}
                    </td>
                    <td className="px-6 py-3 space-x-2">
                      <button onClick={() => handleEditItem(item)} className="text-green-600 hover:underline text-sm">
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setItemToDelete(item)
                          setShowDeleteModal(true)
                        }}
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

          <ConfirmDeleteModal
            isOpen={showDeleteModal}
            title="Delete Inventory Item"
            description="Are you sure you want to delete this inventory item? This action cannot be undone."
            itemName={itemToDelete?.name}
            onConfirm={() => {
              handleDeleteItem(itemToDelete._id)
              setShowDeleteModal(false)
              setItemToDelete(null)
            }}
            onCancel={() => {
              setShowDeleteModal(false)
              setItemToDelete(null)
            }}
          />
        </main>
      </div>
    </ProtectedRoute>
  )
}
