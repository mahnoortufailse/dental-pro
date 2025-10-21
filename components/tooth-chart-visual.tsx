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
      treated: "#3b82f6",
      root_canal: "#f97316",
      crown: "#8b5cf6",
    }
    return colors[status] || "#3b82f6"
  }

  const getToothLabel = (toothNumber: number) => {
    const toothNames: Record<number, string> = {
      // Upper Right (UR): 18-11
      18: "UR8",
      17: "UR7",
      16: "UR6",
      15: "UR5",
      14: "UR4",
      13: "UR3",
      12: "UR2",
      11: "UR1",
      // Upper Left (UL): 21-28
      21: "UL1",
      22: "UL2",
      23: "UL3",
      24: "UL4",
      25: "UL5",
      26: "UL6",
      27: "UL7",
      28: "UL8",
      // Lower Left (LL): 38-31
      38: "LL8",
      37: "LL7",
      36: "LL6",
      35: "LL5",
      34: "LL4",
      33: "LL3",
      32: "LL2",
      31: "LL1",
      // Lower Right (LR): 41-48
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
    // Molars: 18,17,16 (UR), 26,27,28 (UL), 36,37,38 (LL), 46,47,48 (LR)
    const isMolar = [16, 17, 18, 26, 27, 28, 36, 37, 38, 46, 47, 48].includes(toothNumber)
    // Premolars: 15,14 (UR), 24,25 (UL), 34,35 (LL), 44,45 (LR)
    const isPremolar = [14, 15, 24, 25, 34, 35, 44, 45].includes(toothNumber)
    // Canines: 13 (UR), 23 (UL), 33 (LL), 43 (LR)
    const isCanine = [13, 23, 33, 43].includes(toothNumber)
    // Incisors: 12,11 (UR), 21,22 (UL), 31,32 (LL), 41,42 (LR)
    const isIncisor = [11, 12, 21, 22, 31, 32, 41, 42].includes(toothNumber)

    return { isMolar, isPremolar, isCanine, isIncisor }
  }

  const ToothShape = ({ toothNumber, status }: { toothNumber: number; status: string }) => {
    const color = getToothColor(status)
    const { isMolar, isPremolar, isCanine, isIncisor } = getToothType(toothNumber)

    return (
      <svg viewBox="0 0 60 100" className="w-full h-full">
        {/* Molar shape - wider, more rectangular */}
        {isMolar && (
          <>
            <path d="M 12 15 L 48 15 L 50 50 L 48 85 L 12 85 L 10 50 Z" fill={color} stroke="#333" strokeWidth="1" />
            {/* Molar cusps */}
            <line x1="24" y1="15" x2="22" y2="50" stroke="#333" strokeWidth="0.5" opacity="0.3" />
            <line x1="36" y1="15" x2="38" y2="50" stroke="#333" strokeWidth="0.5" opacity="0.3" />
          </>
        )}

        {/* Premolar shape - medium, slightly pointed */}
        {isPremolar && (
          <>
            <path d="M 15 15 L 45 15 L 48 45 L 30 85 L 12 45 Z" fill={color} stroke="#333" strokeWidth="1" />
            {/* Premolar cusp */}
            <line x1="30" y1="15" x2="30" y2="45" stroke="#333" strokeWidth="0.5" opacity="0.3" />
          </>
        )}

        {/* Canine shape - pointed, narrow */}
        {isCanine && <path d="M 18 15 L 42 15 L 45 40 L 30 90 L 15 40 Z" fill={color} stroke="#333" strokeWidth="1" />}

        {/* Incisor shape - narrow, rectangular with slight point */}
        {isIncisor && <path d="M 20 15 L 40 15 L 42 50 L 30 85 L 18 50 Z" fill={color} stroke="#333" strokeWidth="1" />}

        {/* Root lines */}
        <path
          d="M 22 85 Q 20 92 18 100 M 30 85 L 30 100 M 38 85 Q 40 92 42 100"
          stroke="#999"
          strokeWidth="1"
          fill="none"
          opacity="0.5"
        />
      </svg>
    )
  }

  return (
    <div className="space-y-6">
      {/* Upper Teeth */}
      <div>
        <h3 className="font-semibold text-foreground mb-3 text-sm">Upper Teeth</h3>
        <div className="grid grid-cols-8 gap-2">
          {[18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28].map((toothNum) => (
            <button
              key={toothNum}
              onClick={() => !readOnly && onToothClick(toothNum)}
              disabled={readOnly}
              className={`aspect-square rounded-lg border-2 border-border flex flex-col items-center justify-center font-bold text-xs transition-all overflow-hidden ${
                readOnly ? "cursor-default" : "hover:opacity-80 cursor-pointer hover:scale-105"
              }`}
              title={`${getToothLabel(toothNum)} - ${teeth[toothNum]?.status || "healthy"}`}
            >
              <div className="w-full h-3/4">
                <ToothShape toothNumber={toothNum} status={teeth[toothNum]?.status || "healthy"} />
              </div>
              <span className="text-[10px] font-semibold text-foreground bg-white/80 w-full text-center">
                {getToothLabel(toothNum)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Lower Teeth */}
      <div>
        <h3 className="font-semibold text-foreground mb-3 text-sm">Lower Teeth</h3>
        <div className="grid grid-cols-8 gap-2">
          {[38, 37, 36, 35, 34, 33, 32, 31, 41, 42, 43, 44, 45, 46, 47, 48].map((toothNum) => (
            <button
              key={toothNum}
              onClick={() => !readOnly && onToothClick(toothNum)}
              disabled={readOnly}
              className={`aspect-square rounded-lg border-2 border-border flex flex-col items-center justify-center font-bold text-xs transition-all overflow-hidden ${
                readOnly ? "cursor-default" : "hover:opacity-80 cursor-pointer hover:scale-105"
              }`}
              title={`${getToothLabel(toothNum)} - ${teeth[toothNum]?.status || "healthy"}`}
            >
              <div className="w-full h-3/4">
                <ToothShape toothNumber={toothNum} status={teeth[toothNum]?.status || "healthy"} />
              </div>
              <span className="text-[10px] font-semibold text-foreground bg-white/80 w-full text-center">
                {getToothLabel(toothNum)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 bg-muted rounded-lg">
        <h3 className="font-semibold text-foreground mb-3 text-sm">Tooth Status Legend</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: getToothColor("healthy") }} />
            <span className="text-foreground">Healthy</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: getToothColor("cavity") }} />
            <span className="text-foreground">Cavity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: getToothColor("missing") }} />
            <span className="text-foreground">Missing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: getToothColor("treated") }} />
            <span className="text-foreground">Treated</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: getToothColor("root_canal") }} />
            <span className="text-foreground">Root Canal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: getToothColor("crown") }} />
            <span className="text-foreground">Crown</span>
          </div>
        </div>
      </div>
    </div>
  )
}
