"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface ToothRecord {
  toothNumber: number
  sides: string[]
  procedure: string
  diagnosis: string
  comments: string
  date: string
  fillingType?: string
}

interface ToothChartResultsTableProps {
  teeth: Record<number, any>
}

const ITEMS_PER_PAGE = 5

export function ToothChartResultsTable({ teeth }: ToothChartResultsTableProps) {
  const [currentPage, setCurrentPage] = useState(1)

  const tableData = useMemo(() => {
    const data: ToothRecord[] = []

    // Filter teeth that have procedures
    for (const [toothNum, toothData] of Object.entries(teeth)) {
      // Skip if toothData is not an object or doesn't have procedure
      if (!toothData || typeof toothData !== 'object' || !toothData.procedure) {
        continue
      }
      
      // Handle different possible data structures
      const sides = Array.isArray(toothData.sides) ? toothData.sides : 
                   typeof toothData.sides === 'string' ? [toothData.sides] : 
                   []
      
      const procedure = toothData.procedure || ""
      const diagnosis = toothData.diagnosis || ""
      const comments = toothData.notes || toothData.comments || ""
      const date = toothData.date || new Date().toISOString().split("T")[0]
      const fillingType = toothData.fillingType || ""

      data.push({
        toothNumber: parseInt(toothNum),
        sides,
        procedure,
        diagnosis,
        comments,
        date,
        fillingType,
      })
    }

    return data.sort((a, b) => a.toothNumber - b.toothNumber)
  }, [teeth])

  const totalPages = Math.ceil(tableData.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedData = tableData.slice(startIndex, endIndex)

  if (tableData.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 text-center">
        <p className="text-muted-foreground text-sm">
          No procedures recorded yet. Click on a tooth to add a procedure.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4 mt-6">
      <h3 className="font-semibold text-foreground">Procedure Records</h3>
      <div className="rounded-lg border border-border overflow-hidden">
        {/* Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="text-left py-3 px-4 font-semibold text-foreground">Tooth #</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Side(s)</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Procedure</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Filling Type</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Diagnosis</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Comments</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((record, index) => (
                <tr
                  key={`${record.toothNumber}-${index}`}
                  className="border-b border-border hover:bg-muted/50 transition-colors"
                >
                  <td className="py-3 px-4 font-medium text-foreground">#{record.toothNumber}</td>
                  <td className="py-3 px-4 text-foreground">
                    <div className="flex flex-wrap gap-1">
                      {record.sides.map((side) => (
                        <span
                          key={side}
                          className="inline-block bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium"
                        >
                          {side}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-foreground">{record.procedure}</td>
                  <td className="py-3 px-4 text-foreground text-sm">
                    {record.fillingType && record.procedure.toLowerCase() === "filling" ? record.fillingType : "-"}
                  </td>
                  <td className="py-3 px-4 text-foreground">{record.diagnosis || "-"}</td>
                  <td className="py-3 px-4 text-foreground text-xs max-w-xs truncate">
                    {record.comments || "-"}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">{record.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-3 p-4">
          {paginatedData.map((record, index) => (
            <div
              key={`${record.toothNumber}-${index}`}
              className="bg-muted/50 border border-border rounded-lg p-3 space-y-2"
            >
              <div className="flex justify-between items-start gap-2">
                <span className="font-semibold text-foreground">Tooth #{record.toothNumber}</span>
                <span className="text-xs text-muted-foreground">{record.date}</span>
              </div>
              
              <div className="space-y-1 text-sm">
                <div>
                  <span className="font-medium text-foreground">Sides:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {record.sides.map((side) => (
                      <span
                        key={side}
                        className="inline-block bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium"
                      >
                        {side}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <span className="font-medium text-foreground">Procedure:</span>
                  <p className="text-foreground">{record.procedure}</p>
                </div>

                {record.fillingType && record.procedure.toLowerCase() === "filling" && (
                  <div>
                    <span className="font-medium text-foreground">Filling Type:</span>
                    <p className="text-foreground">{record.fillingType}</p>
                  </div>
                )}
                
                <div>
                  <span className="font-medium text-foreground">Diagnosis:</span>
                  <p className="text-foreground">{record.diagnosis || "-"}</p>
                </div>

                {record.comments && (
                  <div>
                    <span className="font-medium text-foreground">Comments:</span>
                    <p className="text-foreground text-xs">{record.comments}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 mt-4">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-foreground rounded-lg transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <div className="text-sm text-muted-foreground">
            Page <span className="font-medium text-foreground">{currentPage}</span> of{" "}
            <span className="font-medium text-foreground">{totalPages}</span>
          </div>

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium bg-muted hover:bg-muted/80 disabled:opacity-50 disabled:cursor-not-allowed text-foreground rounded-lg transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}