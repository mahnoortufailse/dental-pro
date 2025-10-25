"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Plus, Edit2, Trash2, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface MedicalEntry {
  date: string
  notes: string
  findings: string
  treatment: string
  medications: string[]
  doctorId?: string
}

interface MedicalHistorySectionProps {
  patientId: string
  token: string
  isDoctor: boolean
  currentDoctorId?: string
}

export function MedicalHistorySection({ patientId, token, isDoctor, currentDoctorId }: MedicalHistorySectionProps) {
  const { toast } = useToast()
  const [history, setHistory] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    notes: "",
    findings: "",
    treatment: "",
    medications: "",
  })

  useEffect(() => {
    fetchMedicalHistory()
  }, [patientId, token])

  const fetchMedicalHistory = async () => {
    try {
      const res = await fetch(`/api/medical-history?patientId=${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setHistory(data.history)
      } else {
        console.error("Failed to fetch medical history:", res.status)
      }
    } catch (error) {
      console.error("Error fetching medical history:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (editingIndex !== null && history) {
        const res = await fetch(`/api/medical-history/${history._id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            entryIndex: editingIndex,
            entry: {
              notes: formData.notes,
              findings: formData.findings,
              treatment: formData.treatment,
              medications: formData.medications
                .split(",")
                .map((m) => m.trim())
                .filter((m) => m),
              date: new Date().toISOString(),
            },
          }),
        })

        if (res.ok) {
          const data = await res.json()
          setHistory(data.history)
          toast({
            title: "Success",
            description: "Medical history entry updated",
          })
          setEditingIndex(null)
        } else {
          const error = await res.json()
          toast({
            title: "Error",
            description: error.error || "Failed to update entry",
            variant: "destructive",
          })
        }
      } else {
        const res = await fetch("/api/medical-history", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            patientId,
            entry: {
              notes: formData.notes,
              findings: formData.findings,
              treatment: formData.treatment,
              medications: formData.medications
                .split(",")
                .map((m) => m.trim())
                .filter((m) => m),
              date: new Date().toISOString(),
            },
          }),
        })

        if (res.ok) {
          const data = await res.json()
          setHistory(data.history)
          toast({
            title: "Success",
            description: "Medical history entry added",
          })
        } else {
          const error = await res.json()
          toast({
            title: "Error",
            description: error.error || "Failed to add entry",
            variant: "destructive",
          })
        }
      }

      setShowForm(false)
      setFormData({ notes: "", findings: "", treatment: "", medications: "" })
    } catch (error) {
      toast({
        title: "Error",
        description: "Error saving medical history entry",
        variant: "destructive",
      })
      console.error("Error:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleEditEntry = (index: number) => {
    const entry = history.entries[index]
    setFormData({
      notes: entry.notes || "",
      findings: entry.findings || "",
      treatment: entry.treatment || "",
      medications: entry.medications?.join(", ") || "",
    })
    setEditingIndex(index)
    setShowForm(true)
  }

  const handleDeleteEntry = async (index: number) => {
    if (!history) return

    if (!confirm("Are you sure you want to delete this entry?")) return

    try {
      const res = await fetch(`/api/medical-history/${history._id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ entryIndex: index }),
      })

      if (res.ok) {
        const data = await res.json()
        setHistory(data.history)
        toast({
          title: "Success",
          description: "Medical history entry deleted",
        })
      } else {
        const error = await res.json()
        toast({
          title: "Error",
          description: error.error || "Failed to delete entry",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error deleting medical history entry",
        variant: "destructive",
      })
      console.error("Error:", error)
    }
  }

  const canEditEntry = (entry: MedicalEntry) => {
    return isDoctor && entry.doctorId === currentDoctorId
  }

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading medical history...</div>
  }

  return (
    <div className="space-y-6">
      {isDoctor && (
        <button
          onClick={() => {
            setEditingIndex(null)
            setFormData({ notes: "", findings: "", treatment: "", medications: "" })
            setShowForm(!showForm)
          }}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          {showForm ? "Cancel" : "Add Entry"}
        </button>
      )}

      {showForm && isDoctor && (
        <form onSubmit={handleAddEntry} className="bg-card border border-border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">
              {editingIndex !== null ? "Edit Medical History Entry" : "Add New Entry"}
            </h3>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setEditingIndex(null)
                setFormData({ notes: "", findings: "", treatment: "", medications: "" })
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Clinical notes..."
              className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm"
              rows={2}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Findings</label>
            <textarea
              value={formData.findings}
              onChange={(e) => setFormData({ ...formData, findings: e.target.value })}
              placeholder="Examination findings..."
              className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm"
              rows={2}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Treatment</label>
            <textarea
              value={formData.treatment}
              onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
              placeholder="Treatment provided..."
              className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm"
              rows={2}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Medications (comma-separated)</label>
            <input
              type="text"
              value={formData.medications}
              onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
              placeholder="e.g., Amoxicillin, Ibuprofen"
              className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-accent hover:bg-accent/90 disabled:opacity-50 text-accent-foreground px-4 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            {saving ? "Saving..." : editingIndex !== null ? "Update Entry" : "Save Entry"}
          </button>
        </form>
      )}

      {history && history.entries && history.entries.length > 0 ? (
        <div className="space-y-3">
          <h3 className="font-semibold text-foreground">Medical History Entries</h3>
          {history.entries.map((entry: MedicalEntry, idx: number) => (
            <div key={idx} className="bg-card border border-border rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between">
                <p className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleString()}</p>
                {canEditEntry(entry) && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditEntry(idx)}
                      className="text-primary hover:text-primary/80 transition-colors p-1 hover:bg-primary/10 rounded"
                      title="Edit entry"
                      aria-label="Edit entry"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteEntry(idx)}
                      className="text-destructive hover:text-destructive/80 transition-colors p-1 hover:bg-destructive/10 rounded"
                      title="Delete entry"
                      aria-label="Delete entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              {entry.notes && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Notes</p>
                  <p className="text-sm text-foreground">{entry.notes}</p>
                </div>
              )}
              {entry.findings && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Findings</p>
                  <p className="text-sm text-foreground">{entry.findings}</p>
                </div>
              )}
              {entry.treatment && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Treatment</p>
                  <p className="text-sm text-foreground">{entry.treatment}</p>
                </div>
              )}
              {entry.medications && entry.medications.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase">Medications</p>
                  <p className="text-sm text-foreground">{entry.medications.join(", ")}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">No medical history entries yet</div>
      )}
    </div>
  )
}
