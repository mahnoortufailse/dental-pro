"use client"

import React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const TOOTH_SIDES = ["Left", "Right", "Top", "Bottom", "Center"]
const COMMON_PROCEDURES = [
  "Filling",
  "Root Canal",
  "Crown",
  "Extraction",
  "Cleaning",
  "Whitening",
  "Bridge",
  "Implant",
]

interface ToothModalProps {
  isOpen: boolean
  toothNumber: number | null
  existingData?: {
    sides?: string[]
    procedure?: string
    diagnosis?: string
    comments?: string
    date?: string
    fillingType?: string
  }
  onClose: () => void
  onSave: (data: {
    toothNumber: number
    sides: string[]
    procedure: string
    diagnosis: string
    comments: string
    date: string
    fillingType?: string
  }) => void
}

const FILLING_TYPES = [
  "Composite Resin",
  "Amalgam",
  "Glass Ionomer",
  "Resin-Modified Glass Ionomer",
  "Temporary Filling",
  "Other",
]

export function ToothChartModal({
  isOpen,
  toothNumber,
  existingData,
  onClose,
  onSave,
}: ToothModalProps) {
  const [selectedSides, setSelectedSides] = useState<string[]>(existingData?.sides || [])
  const [procedure, setProcedure] = useState(existingData?.procedure || "")
  const [customProcedure, setCustomProcedure] = useState("")
  const [diagnosis, setDiagnosis] = useState(existingData?.diagnosis || "")
  const [comments, setComments] = useState(existingData?.comments || "")
  const [fillingType, setFillingType] = useState(existingData?.fillingType || "")
  const [showCustom, setShowCustom] = useState(false)

  // Update form state when modal opens with new data
  useEffect(() => {
    if (isOpen && existingData) {
      setSelectedSides(existingData.sides || [])
      setProcedure(existingData.procedure || "")
      setDiagnosis(existingData.diagnosis || "")
      setComments(existingData.comments || "")
      setFillingType(existingData.fillingType || "")
      setCustomProcedure("")
      setShowCustom(false)
    }
  }, [isOpen, existingData])

  const handleSidToggle = (side: string) => {
    setSelectedSides((prev) =>
      prev.includes(side) ? prev.filter((s) => s !== side) : [...prev, side]
    )
  }

  const handleProcedureChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    if (value === "other") {
      setShowCustom(true)
      setProcedure("")
    } else {
      setShowCustom(false)
      setProcedure(value)
      setCustomProcedure("")
    }
  }

  const handleSave = () => {
    if (!toothNumber) return

    const finalProcedure = showCustom ? customProcedure : procedure

    if (!selectedSides.length || !finalProcedure) {
      alert("Please select at least one side and a procedure")
      return
    }

    // Check if filling type is required when procedure is "Filling"
    if (finalProcedure.toLowerCase() === "filling" && !fillingType) {
      alert("Please select a filling type")
      return
    }

    onSave({
      toothNumber,
      sides: selectedSides,
      procedure: finalProcedure,
      diagnosis,
      comments,
      date: new Date().toISOString().split("T")[0],
      fillingType,
    })

    // Reset form and close modal
    resetForm()
  }

  const resetForm = () => {
    setSelectedSides([])
    setProcedure("")
    setCustomProcedure("")
    setDiagnosis("")
    setComments("")
    setFillingType("")
    setShowCustom(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tooth #{toothNumber} - Enter Procedure Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tooth Sides */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Select Tooth Sides</Label>
            <div className="grid grid-cols-5 gap-2">
              {TOOTH_SIDES.map((side) => (
                <button
                  key={side}
                  onClick={() => handleSidToggle(side)}
                  className={`py-2 px-1 text-xs font-medium rounded border transition-colors ${
                    selectedSides.includes(side)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted border-border hover:bg-input"
                  }`}
                >
                  {side}
                </button>
              ))}
            </div>
          </div>

          {/* Diagnosis */}
          <div className="space-y-2">
            <Label htmlFor="diagnosis" className="text-sm font-medium">
              Diagnosis
            </Label>
            <Input
              id="diagnosis"
              placeholder="e.g., Cavity, Decay, Discoloration"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className="text-sm"
            />
          </div>

          {/* Procedure Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="procedure" className="text-sm font-medium">
              Procedure Done
            </Label>
            <select
              id="procedure"
              value={showCustom ? "other" : procedure}
              onChange={handleProcedureChange}
              className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
            >
              <option value="">Select a procedure...</option>
              {COMMON_PROCEDURES.map((proc) => (
                <option key={proc} value={proc}>
                  {proc}
                </option>
              ))}
              <option value="other">Other (type custom)</option>
            </select>
          </div>

          {/* Custom Procedure Input */}
          {showCustom && (
            <div className="space-y-2">
              <Label htmlFor="customProcedure" className="text-sm font-medium">
                Custom Procedure
              </Label>
              <Input
                id="customProcedure"
                placeholder="Type the procedure name..."
                value={customProcedure}
                onChange={(e) => setCustomProcedure(e.target.value)}
                className="text-sm"
              />
            </div>
          )}

          {/* Filling Type Input - Show only when "Filling" is selected */}
          {(procedure.toLowerCase() === "filling" || 
            (showCustom && customProcedure.toLowerCase() === "filling")) && (
            <div className="space-y-2">
              <Label htmlFor="fillingType" className="text-sm font-medium">
                Filling Type <span className="text-red-500">*</span>
              </Label>
              <select
                id="fillingType"
                value={fillingType}
                onChange={(e) => setFillingType(e.target.value)}
                className="w-full px-3 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
              >
                <option value="">Select filling type...</option>
                {FILLING_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Comments */}
          <div className="space-y-2">
            <Label htmlFor="comments" className="text-sm font-medium">
              Comments
            </Label>
            <Textarea
              id="comments"
              placeholder="Add any additional notes about this procedure..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="text-sm"
              rows={3}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={handleClose} className="flex-1 bg-transparent">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
