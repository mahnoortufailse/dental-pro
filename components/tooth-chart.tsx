"use client"

import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { Save, RotateCcw } from "lucide-react"

interface ToothStatus {
  status: "healthy" | "cavity" | "filling" | "root-canal" | "missing" | "implant"
  notes: string
  lastUpdated: Date
}

interface ToothChartProps {
  patientId: string
  token: string
  onSave?: () => void
}

const TOOTH_STATUSES = [
  { value: "healthy", label: "Healthy", color: "bg-green-100 border-green-300" },
  { value: "cavity", label: "Cavity", color: "bg-red-100 border-red-300" },
  { value: "filling", label: "Filling", color: "bg-yellow-100 border-yellow-300" },
  { value: "root-canal", label: "Root Canal", color: "bg-orange-100 border-orange-300" },
  { value: "missing", label: "Missing", color: "bg-gray-100 border-gray-300" },
  { value: "implant", label: "Implant", color: "bg-blue-100 border-blue-300" },
]

export function ToothChart({ patientId, token, onSave }: ToothChartProps) {
  const [teeth, setTeeth] = useState<Record<number, ToothStatus>>({})
  const [overallNotes, setOverallNotes] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null)

  useEffect(() => {
    fetchToothChart()
  }, [patientId])

  const fetchToothChart = async () => {
    try {
      const res = await fetch(`/api/tooth-chart/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        if (data.chart) {
          setTeeth(data.chart.teeth || {})
          setOverallNotes(data.chart.overallNotes || "")
        } else {
          // Initialize empty chart
          const newTeeth: Record<number, ToothStatus> = {}
          for (let i = 1; i <= 32; i++) {
            newTeeth[i] = { status: "healthy", notes: "", lastUpdated: new Date() }
          }
          setTeeth(newTeeth)
        }
      }
    } catch (error) {
      console.error("Error fetching tooth chart:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleToothStatusChange = (toothNumber: number, status: string) => {
    setTeeth((prev) => ({
      ...prev,
      [toothNumber]: {
        ...prev[toothNumber],
        status: status as ToothStatus["status"],
        lastUpdated: new Date(),
      },
    }))
  }

  const handleToothNotesChange = (toothNumber: number, notes: string) => {
    setTeeth((prev) => ({
      ...prev,
      [toothNumber]: {
        ...prev[toothNumber],
        notes,
        lastUpdated: new Date(),
      },
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/tooth-chart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientId,
          teeth,
          overallNotes,
        }),
      })

      if (res.ok) {
        toast.success("Tooth chart saved successfully")
        onSave?.()
      } else {
        const error = await res.json()
        toast.error(error.error || "Failed to save tooth chart")
      }
    } catch (error) {
      toast.error("Error saving tooth chart")
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all changes?")) {
      fetchToothChart()
    }
  }

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading tooth chart...</div>
  }

  return (
    <div className="space-y-6">
      {/* Tooth Status Legend */}
      <div className="bg-muted/50 rounded-lg p-4">
        <h3 className="font-semibold text-foreground mb-3">Tooth Status Legend</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {TOOTH_STATUSES.map((status) => (
            <div key={status.value} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded border ${status.color}`} />
              <span className="text-xs text-muted-foreground">{status.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tooth Grid */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground">Tooth Chart</h3>

        {/* Upper Teeth */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">Upper Teeth</p>
          <div className="grid grid-cols-8 gap-2">
            {Array.from({ length: 16 }, (_, i) => i + 1).map((toothNum) => (
              <button
                key={toothNum}
                onClick={() => setSelectedTooth(selectedTooth === toothNum ? null : toothNum)}
                className={`aspect-square rounded-lg border-2 flex items-center justify-center font-bold text-sm transition-all ${
                  teeth[toothNum]
                    ? TOOTH_STATUSES.find((s) => s.value === teeth[toothNum].status)?.color || "bg-gray-100"
                    : "bg-gray-100"
                } ${selectedTooth === toothNum ? "ring-2 ring-primary" : ""}`}
              >
                {toothNum}
              </button>
            ))}
          </div>
        </div>

        {/* Lower Teeth */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">Lower Teeth</p>
          <div className="grid grid-cols-8 gap-2">
            {Array.from({ length: 16 }, (_, i) => i + 17).map((toothNum) => (
              <button
                key={toothNum}
                onClick={() => setSelectedTooth(selectedTooth === toothNum ? null : toothNum)}
                className={`aspect-square rounded-lg border-2 flex items-center justify-center font-bold text-sm transition-all ${
                  teeth[toothNum]
                    ? TOOTH_STATUSES.find((s) => s.value === teeth[toothNum].status)?.color || "bg-gray-100"
                    : "bg-gray-100"
                } ${selectedTooth === toothNum ? "ring-2 ring-primary" : ""}`}
              >
                {toothNum}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Tooth Details */}
      {selectedTooth && teeth[selectedTooth] && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
          <h4 className="font-semibold text-foreground">Tooth #{selectedTooth} Details</h4>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Status</label>
            <select
              value={teeth[selectedTooth].status}
              onChange={(e) => handleToothStatusChange(selectedTooth, e.target.value)}
              className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
            >
              {TOOTH_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Notes</label>
            <textarea
              value={teeth[selectedTooth].notes}
              onChange={(e) => handleToothNotesChange(selectedTooth, e.target.value)}
              placeholder="Add notes about this tooth..."
              className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm"
              rows={3}
            />
          </div>
        </div>
      )}

      {/* Overall Notes */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Overall Notes</label>
        <textarea
          value={overallNotes}
          onChange={(e) => setOverallNotes(e.target.value)}
          placeholder="Add overall notes about the patient's dental health..."
          className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm"
          rows={4}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground px-4 py-2 rounded-lg transition-colors text-sm font-medium"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Chart"}
        </button>
        <button
          onClick={handleReset}
          className="flex items-center gap-2 bg-muted hover:bg-muted/80 text-muted-foreground px-4 py-2 rounded-lg transition-colors text-sm font-medium"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </button>
      </div>
    </div>
  )
}
