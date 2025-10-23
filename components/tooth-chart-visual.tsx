"use client"

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

  const getToothType = (toothNumber: number) => {
    const isMolar = [16, 17, 18, 26, 27, 28, 36, 37, 38, 46, 47, 48].includes(toothNumber)
    const isPremolar = [14, 15, 24, 25, 34, 35, 44, 45].includes(toothNumber)
    const isCanine = [13, 23, 33, 43].includes(toothNumber)
    const isIncisor = [11, 12, 21, 22, 31, 32, 41, 42].includes(toothNumber)

    return { isMolar, isPremolar, isCanine, isIncisor }
  }

  const ToothVisual = ({ toothNumber, status }: { toothNumber: number; status: string }) => {
    const color = getToothColor(status)
    const { isMolar, isPremolar, isCanine, isIncisor } = getToothType(toothNumber)
    const isUpper = toothNumber <= 28
    const isLower = toothNumber >= 31

    const baseColor = status === "missing" ? "#9ca3af" : "#f8fafc"
    const borderColor = color

    const hasCavity = status === "cavity"
    const hasFilling = status === "filling"
    const hasRootCanal = status === "root_canal"
    const hasCrown = status === "crown"
    const isImplant = status === "implant"
    const isMissing = status === "missing"

    return (
      <div className="relative w-full h-full">
        {isMissing ? (
          <div className="w-full h-full flex items-center justify-center border-4 border-dashed border-gray-400 rounded-lg bg-gray-100">
            <div className="text-gray-600 text-2xl font-bold">✕</div>
          </div>
        ) : (
          <svg viewBox="0 0 100 120" className="w-full h-full">
            {/* Tooth Crown */}
            <g>
              {isMolar && (
                <path
                  d="M 20 20 L 80 20 L 85 50 Q 80 70 50 70 Q 20 70 15 50 Z"
                  fill={hasCrown ? "#8b5cf6" : baseColor}
                  stroke={borderColor}
                  strokeWidth="3"
                />
              )}
              {isPremolar && (
                <path
                  d="M 25 20 L 75 20 L 80 45 Q 75 65 50 65 Q 25 65 20 45 Z"
                  fill={hasCrown ? "#8b5cf6" : baseColor}
                  stroke={borderColor}
                  strokeWidth="3"
                />
              )}
              {isCanine && (
                <path
                  d="M 35 20 L 65 20 L 70 40 Q 65 60 50 60 Q 35 60 30 40 Z"
                  fill={hasCrown ? "#8b5cf6" : baseColor}
                  stroke={borderColor}
                  strokeWidth="3"
                />
              )}
              {isIncisor && (
                <path
                  d="M 40 20 L 60 20 L 62 35 Q 60 55 50 55 Q 40 55 38 35 Z"
                  fill={hasCrown ? "#8b5cf6" : baseColor}
                  stroke={borderColor}
                  strokeWidth="3"
                />
              )}

              {hasCavity && (
                <>
                  <circle cx="35" cy="35" r="4" fill="#ef4444" opacity="0.8" />
                  <circle cx="65" cy="35" r="3" fill="#ef4444" opacity="0.8" />
                  <circle cx="50" cy="45" r="2" fill="#ef4444" opacity="0.8" />
                </>
              )}

              {hasFilling && <rect x="40" y="30" width="20" height="15" fill="#f59e0b" opacity="0.6" rx="2" />}

              {hasRootCanal && (
                <path d="M 50 20 L 50 70" stroke="#f97316" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
              )}

              {hasCrown && (
                <path
                  d="M 25 25 L 75 25 L 78 40 L 75 55 L 25 55 L 22 40 Z"
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="2"
                  strokeDasharray="4,2"
                />
              )}
            </g>

            {/* Tooth Roots */}
            <g>
              {isMolar && (
                <>
                  <path d="M 30 70 L 25 120" stroke="#d1d5db" strokeWidth="4" fill="none" />
                  <path d="M 50 70 L 50 120" stroke="#d1d5db" strokeWidth="4" fill="none" />
                  <path d="M 70 70 L 75 120" stroke="#d1d5db" strokeWidth="4" fill="none" />
                </>
              )}
              {(isPremolar || isCanine) && (
                <>
                  <path d="M 40 65 L 35 120" stroke="#d1d5db" strokeWidth="3" fill="none" />
                  <path d="M 60 65 L 65 120" stroke="#d1d5db" strokeWidth="3" fill="none" />
                </>
              )}
              {isIncisor && (
                <>
                  <path d="M 50 55 L 50 120" stroke="#d1d5db" strokeWidth="3" fill="none" />
                </>
              )}

              {isImplant && <rect x="45" y="80" width="10" height="25" fill="#3b82f6" opacity="0.7" rx="2" />}
            </g>

            {/* Gum Line */}
            <line
              x1="10"
              y1={isUpper ? "75" : "45"}
              x2="90"
              y2={isUpper ? "75" : "45"}
              stroke="#dc2626"
              strokeWidth="2"
              strokeDasharray="3,2"
              opacity="0.6"
            />
          </svg>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Upper Teeth */}
      <div>
        <h3 className="font-semibold text-foreground mb-3 text-sm">Upper Teeth</h3>
        <div className="grid grid-cols-8 gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
          {[18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28].map((toothNum) => (
            <button
              key={toothNum}
              onClick={() => !readOnly && onToothClick(toothNum)}
              disabled={readOnly}
              className={`aspect-[0.8] rounded-lg flex flex-col items-center justify-center font-bold text-xs transition-all overflow-hidden ${
                readOnly ? "cursor-default" : "hover:shadow-md cursor-pointer hover:scale-105"
              }`}
              title={`${getToothLabel(toothNum)} - ${teeth[toothNum]?.status || "healthy"}`}
              style={{
                borderWidth: "3px",
                borderColor: getToothColor(teeth[toothNum]?.status || "healthy"),
                backgroundColor: "white",
              }}
            >
              <div className="w-full h-full p-1">
                <ToothVisual toothNumber={toothNum} status={teeth[toothNum]?.status || "healthy"} />
              </div>
              <span className="text-[10px] font-semibold text-foreground bg-white/90 px-1 rounded mt-1">
                {getToothLabel(toothNum)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Lower Teeth */}
      <div>
        <h3 className="font-semibold text-foreground mb-3 text-sm">Lower Teeth</h3>
        <div className="grid grid-cols-8 gap-2 p-4 bg-green-50 rounded-lg border border-green-200">
          {[38, 37, 36, 35, 34, 33, 32, 31, 41, 42, 43, 44, 45, 46, 47, 48].map((toothNum) => (
            <button
              key={toothNum}
              onClick={() => !readOnly && onToothClick(toothNum)}
              disabled={readOnly}
              className={`aspect-[0.8] rounded-lg flex flex-col items-center justify-center font-bold text-xs transition-all overflow-hidden !p-0 ${
                readOnly ? "cursor-default" : "hover:shadow-md cursor-pointer hover:scale-105"
              }`}
              title={`${getToothLabel(toothNum)} - ${teeth[toothNum]?.status || "healthy"}`}
              style={{
                borderWidth: "3px",
                borderColor: getToothColor(teeth[toothNum]?.status || "healthy"),
                backgroundColor: "white",
              }}
            >
              <div className="w-full h-full ">
                <ToothVisual toothNumber={toothNum} status={teeth[toothNum]?.status || "healthy"} />
              </div>
              <span className="text-[10px] font-semibold text-foreground bg-white/90 px-1 rounded mt-0">
                {getToothLabel(toothNum)}
              </span>
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
