//@ts-nocheck
"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/components/auth-context"
import { useState, useEffect } from "react"
import toast from "react-hot-toast"

export default function ClinicalToolsPage() {
  const { user, token } = useAuth()
  const [patients, setPatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [toothChart, setToothChart] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (token) fetchPatients()
  }, [token])

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
      console.error(error)
      toast.error("Failed to fetch patients")
    }
  }

  const handleSelectPatient = async (patientId: string) => {
    const patient = patients.find((p) => (p._id || p.id).toString() === patientId)
    setSelectedPatient(patient)
    setToothChart(null)

    try {
      const res = await fetch("/api/tooth-chart", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        const chart = data.charts?.find(
          (c: any) =>
            c.patientId.toString() === patientId &&
            c.doctorId.toString() === user?.id
        )
        setToothChart(chart || null)
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to fetch tooth chart")
    }
  }

  const handleCreateToothChart = async () => {
    if (!selectedPatient) return toast.error("Please select a patient first")
    setLoading(true)

    try {
      const patientId = selectedPatient._id || selectedPatient.id
      const res = await fetch("/api/tooth-chart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientId,
          overallNotes: "",
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setToothChart(data.chart)
        toast.success("Tooth chart created successfully!")
      } else {
        toast.error(data.error || "Failed to create tooth chart")
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to create tooth chart")
    } finally {
      setLoading(false)
    }
  }

  const handleToothClick = (toothNumber: number) => {
    if (!toothChart) return
    const statuses = ["healthy", "cavity", "missing", "treated", "root_canal", "crown"]
    const currentStatus = toothChart.teeth[toothNumber]?.status || "healthy"
    const nextStatus = statuses[(statuses.indexOf(currentStatus) + 1) % statuses.length]

    setToothChart({
      ...toothChart,
      teeth: {
        ...toothChart.teeth,
        [toothNumber]: {
          ...toothChart.teeth[toothNumber],
          status: nextStatus,
          lastUpdated: new Date(),
        },
      },
    })
  }

  const handleSaveToothChart = async () => {
    if (!toothChart) return
    setLoading(true)

    try {
      const chartId = toothChart._id || toothChart.id
      const res = await fetch(`/api/tooth-chart/${chartId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          teeth: toothChart.teeth,
          overallNotes: toothChart.overallNotes,
        }),
      })

      const data = await res.json()
      if (res.ok) {
        toast.success("Tooth chart saved successfully!")
      } else {
        toast.error(data.error || "Failed to save tooth chart")
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to save tooth chart")
    } finally {
      setLoading(false)
    }
  }

  const getToothColor = (status: string) => {
    const colors: Record<string, string> = {
      healthy: "#3b82f6",
      cavity: "#ef4444",
      missing: "#9ca3af",
      treated: "#10b981",
      root_canal: "#f97316",
      crown: "#8b5cf6",
    }
    return colors[status] || "#3b82f6"
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "doctor"]}>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-auto p-8">
          <h1 className="text-3xl font-bold mb-8">Clinical Tools - Tooth Chart</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Patients List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">Select Patient</h2>
                <div className="space-y-2">
                  {patients.length === 0 ? (
                    <p className="text-gray-500 text-sm">No patients assigned</p>
                  ) : (
                    patients.map((patient) => (
                      <button
                        key={patient._id || patient.id}
                        onClick={() => handleSelectPatient(patient._id || patient.id)}
                        className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                          selectedPatient?._id === (patient._id || patient.id)
                            ? "bg-blue-500 text-white"
                            : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                        }`}
                      >
                        {patient.name}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Tooth Chart */}
            <div className="lg:col-span-2">
              {selectedPatient ? (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-xl font-bold mb-4">{selectedPatient.name} - Tooth Chart</h2>

                  {!toothChart ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">No tooth chart created yet</p>
                      <button
                        onClick={handleCreateToothChart}
                        disabled={loading}
                        className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading ? "Creating..." : "Create Tooth Chart"}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-8 gap-2 mb-6">
                        {Array.from({ length: 32 }, (_, i) => i + 1).map((toothNum) => (
                          <button
                            key={toothNum}
                            onClick={() => handleToothClick(toothNum)}
                            className="w-full aspect-square rounded-lg border-2 border-gray-300 flex items-center justify-center font-bold text-sm hover:opacity-80 transition-opacity"
                            style={{
                              backgroundColor: getToothColor(toothChart.teeth[toothNum]?.status || "healthy"),
                              color: "white",
                            }}
                            title={toothChart.teeth[toothNum]?.status || "healthy"}
                          >
                            {toothNum}
                          </button>
                        ))}
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-2">Overall Notes</label>
                        <textarea
                          value={toothChart.overallNotes || ""}
                          onChange={(e) => setToothChart({ ...toothChart, overallNotes: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={4}
                        />
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveToothChart}
                          disabled={loading}
                          className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {loading ? "Saving..." : "Save Chart"}
                        </button>
                      </div>
                       <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                          <h3 className="font-bold mb-2">Legend</h3>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded" style={{ backgroundColor: getToothColor("healthy") }} />
                              <span>Healthy</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded" style={{ backgroundColor: getToothColor("cavity") }} />
                              <span>Cavity</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded" style={{ backgroundColor: getToothColor("missing") }} />
                              <span>Missing</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded" style={{ backgroundColor: getToothColor("treated") }} />
                              <span>Treated</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: getToothColor("root_canal") }}
                              />
                              <span>Root Canal</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 rounded" style={{ backgroundColor: getToothColor("crown") }} />
                              <span>Crown</span>
                            </div>
                          </div>
                        </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                  Select a patient to view or create their tooth chart
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
