"use client"

import { useState } from "react"

interface ToothStatus {
  status: string
  notes?: string
}

interface ToothChartProps {
  teeth: Record<number, ToothStatus>
  onToothClick: (toothNumber: number) => void
  readOnly?: boolean
}

export function ToothChartVisual({ teeth, onToothClick, readOnly = false }: ToothChartProps) {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null)

  const getToothImageNumber = (toothNumber: number): number => {
    const toothImageMap: Record<number, number> = {
      // Upper Right (11-18) -> images 1-8
      18: 1,
      17: 2,
      16: 3,
      15: 4,
      14: 5,
      13: 6,
      12: 7,
      11: 8,
      // Upper Left (21-28) -> images 9-16
      21: 9,
      22: 10,
      23: 11,
      24: 12,
      25: 13,
      26: 14,
      27: 15,
      28: 16,
      // Lower Left (31-38) -> images 17-24
      31: 17,
      32: 18,
      33: 19,
      34: 20,
      35: 21,
      36: 22,
      37: 23,
      38: 24,
      // Lower Right (41-48) -> images 25-32
      41: 25,
      42: 26,
      43: 27,
      44: 28,
      45: 29,
      46: 30,
      47: 31,
      48: 32,
    }
    return toothImageMap[toothNumber] || toothNumber
  }

  const getToothColor = (status: string) => {
    const colors: Record<string, string> = {
      healthy: "#10b981",
      cavity: "#ef4444",
      missing: "#9ca3af",
      filling: "#f59e0b",
      root_canal: "#f97316",
      crown: "#8b5cf6",
      implant: "#3b82f6",
    }
    return colors[status] || "#3b82f6"
  }

  const getToothLabel = (toothNumber: number) => {
    const toothNames: Record<number, string> = {
      18: "UR8",
      17: "UR7",
      16: "UR6",
      15: "UR5",
      14: "UR4",
      13: "UR3",
      12: "UR2",
      11: "UR1",
      21: "UL1",
      22: "UL2",
      23: "UL3",
      24: "UL4",
      25: "UL5",
      26: "UL6",
      27: "UL7",
      28: "UL8",
      38: "LL8",
      37: "LL7",
      36: "LL6",
      35: "LL5",
      34: "LL4",
      33: "LL3",
      32: "LL2",
      31: "LL1",
      41: "LR1",
      42: "LR2",
      43: "LR3",
      44: "LR4",
      45: "LR5",
      46: "LR6",
      47: "LR7",
      48: "LR8",
    }
    return toothNames[toothNumber] || toothNumber.toString()
  }

  const ToothImage = ({ toothNumber, status }: { toothNumber: number; status: string }) => {
    const [imageError, setImageError] = useState(false)
    const imageNumber = getToothImageNumber(toothNumber)

    return (
      <div className="relative w-full h-full flex items-center justify-center bg-white rounded-lg overflow-hidden">
        {status === "missing" ? (
          <div className="w-full h-full flex items-center justify-center border-4 border-dashed border-gray-400 bg-gray-100">
            <div className="text-gray-600 text-2xl font-bold">✕</div>
          </div>
        ) : imageError ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <div className="text-gray-600 text-xs font-bold text-center px-1">{toothNumber}</div>
          </div>
        ) : (
          <>
            <img
              src={`/teeth/teeth${imageNumber}.png`}
              alt={`Tooth ${toothNumber}`}
              className="w-full h-full object-contain p-2"
              onError={(e) => {
                setImageError(true)
              }}
            />
          </>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Upper Teeth */}
      <div>
        <h3 className="font-semibold text-foreground mb-3 text-sm">Upper Teeth</h3>
        <div className="grid grid-cols-8 gap-3 p-6 bg-blue-50 rounded-lg border border-blue-200">
          {[18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28].map((toothNum) => (
            <button
              key={toothNum}
              onClick={() => {
                setSelectedTooth(toothNum)
                !readOnly && onToothClick(toothNum)
              }}
              disabled={readOnly}
              className={`h-28 w-full rounded-lg flex flex-col items-center justify-center font-bold text-xs transition-all overflow-hidden border-4 ${
                readOnly ? "cursor-default" : "hover:shadow-md cursor-pointer hover:scale-105"
              } ${selectedTooth === toothNum ? "ring-2 ring-offset-2 ring-primary" : ""}`}
              title={`${getToothLabel(toothNum)} - ${teeth[toothNum]?.status || "healthy"}`}
              style={{
                borderColor: getToothColor(teeth[toothNum]?.status || "healthy"),
              }}
            >
              <div className="w-full h-full">
                <ToothImage toothNumber={toothNum} status={teeth[toothNum]?.status || "healthy"} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Lower Teeth */}
      <div>
        <h3 className="font-semibold text-foreground mb-3 text-sm">Lower Teeth</h3>
        <div className="grid grid-cols-8 gap-3 p-6 bg-green-50 rounded-lg border border-green-200">
          {[38, 37, 36, 35, 34, 33, 32, 31, 41, 42, 43, 44, 45, 46, 47, 48].map((toothNum) => (
            <button
              key={toothNum}
              onClick={() => {
                setSelectedTooth(toothNum)
                !readOnly && onToothClick(toothNum)
              }}
              disabled={readOnly}
              className={`h-28 w-full rounded-lg flex flex-col items-center justify-center font-bold text-xs transition-all overflow-hidden border-4 ${
                readOnly ? "cursor-default" : "hover:shadow-md cursor-pointer hover:scale-105"
              } ${selectedTooth === toothNum ? "ring-2 ring-offset-2 ring-primary" : ""}`}
              title={`${getToothLabel(toothNum)} - ${teeth[toothNum]?.status || "healthy"}`}
              style={{
                borderColor: getToothColor(teeth[toothNum]?.status || "healthy"),
              }}
            >
              <div className="w-full h-full">
                <ToothImage toothNumber={toothNum} status={teeth[toothNum]?.status || "healthy"} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 bg-muted rounded-lg border border-border">
        <h3 className="font-semibold text-foreground mb-3 text-sm">Tooth Status Legend</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-4" style={{ borderColor: "#10b981", backgroundColor: "#f8fafc" }} />
            <span className="text-foreground">Healthy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-4" style={{ borderColor: "#ef4444", backgroundColor: "#f8fafc" }} />
            <span className="text-foreground">Cavity</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded border-4 border-dashed"
              style={{ borderColor: "#9ca3af", backgroundColor: "#f8fafc" }}
            />
            <span className="text-foreground">Missing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-4" style={{ borderColor: "#f59e0b", backgroundColor: "#f8fafc" }} />
            <span className="text-foreground">Filling</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-4" style={{ borderColor: "#f97316", backgroundColor: "#f8fafc" }} />
            <span className="text-foreground">Root Canal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-4" style={{ borderColor: "#8b5cf6", backgroundColor: "#8b5cf6" }} />
            <span className="text-foreground">Crown</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border-4" style={{ borderColor: "#3b82f6", backgroundColor: "#f8fafc" }} />
            <span className="text-foreground">Implant</span>
          </div>
        </div>
      </div>

      {/* Dental Notation Guide */}
      <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
        <h3 className="font-semibold text-foreground mb-2 text-sm">Dental Notation Guide</h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <p className="font-medium text-foreground mb-1">Upper Teeth:</p>
            <div className="space-y-1 text-muted-foreground">
              <div>UR = Upper Right (11-18)</div>
              <div>UL = Upper Left (21-28)</div>
            </div>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">Lower Teeth:</p>
            <div className="space-y-1 text-muted-foreground">
              <div>LL = Lower Left (31-38)</div>
              <div>LR = Lower Right (41-48)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
