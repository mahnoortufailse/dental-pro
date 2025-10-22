//@ts-nocheck
"use client"

import type React from "react"

import { ProtectedRoute } from "@/components/protected-route"
import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/components/auth-context"
import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { Plus, Save, AlertCircle, History, Trash2 } from "lucide-react"
import { ToothChartVisual } from "@/components/tooth-chart-visual"
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal"

export default function ClinicalToolsPage() {
  const { user, token } = useAuth()
  const [patients, setPatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [toothChart, setToothChart] = useState(null)
  const [medicalHistory, setMedicalHistory] = useState(null)
  const [patientImages, setPatientImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [doctorHistory, setDoctorHistory] = useState([])
  const [activeTab, setActiveTab] = useState("tooth-chart")
  const [medicalEntry, setMedicalEntry] = useState({
    notes: "",
    findings: "",
    treatment: "",
    medications: "",
  })
  const [medicalErrors, setMedicalErrors] = useState<Record<string, string>>({})
  const [imageUpload, setImageUpload] = useState({
    type: "xray",
    title: "",
    description: "",
    imageUrl: "",
    notes: "",
  })
  const [imageErrors, setImageErrors] = useState<Record<string, string>>({})
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [imageToDelete, setImageToDelete] = useState<any>(null)

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
    setMedicalHistory(null)
    setPatientImages([])
    setDoctorHistory(patient?.doctorHistory || [])

    // Fetch tooth chart
    try {
      const res = await fetch("/api/tooth-chart", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        const chart = data.charts?.find((c: any) => c.patientId.toString() === patientId)
        setToothChart(chart || null)
      }
    } catch (error) {
      console.error(error)
    }

    // Fetch medical history
    try {
      const res = await fetch(`/api/medical-history?patientId=${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setMedicalHistory(data.history || null)
      }
    } catch (error) {
      console.error(error)
    }

    // Fetch patient images
    try {
      const res = await fetch(`/api/patient-images?patientId=${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setPatientImages(data.images || [])
      }
    } catch (error) {
      console.error(error)
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

  const validateMedicalEntry = (): boolean => {
    const errors: Record<string, string> = {}

    if (!medicalEntry.notes.trim()) {
      errors.notes = "Notes are required"
    }
    if (!medicalEntry.findings.trim()) {
      errors.findings = "Findings are required"
    }
    if (!medicalEntry.treatment.trim()) {
      errors.treatment = "Treatment is required"
    }

    setMedicalErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAddMedicalEntry = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient) return

    if (!validateMedicalEntry()) {
      toast.error("Please fix the errors in the form")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/medical-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientId: selectedPatient._id,
          entry: {
            notes: medicalEntry.notes,
            findings: medicalEntry.findings,
            treatment: medicalEntry.treatment,
            medications: medicalEntry.medications
              .split(",")
              .map((m) => m.trim())
              .filter(Boolean),
          },
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setMedicalHistory(data.history)
        setMedicalEntry({
          notes: "",
          findings: "",
          treatment: "",
          medications: "",
        })
        setMedicalErrors({})
        toast.success("Medical entry added successfully")
      } else {
        const errorData = await res.json()
        toast.error(errorData.error || "Failed to add medical entry")
      }
    } catch (error) {
      console.error(error)
      toast.error("Error adding medical entry")
    } finally {
      setLoading(false)
    }
  }

  const validateImageUpload = (): boolean => {
    const errors: Record<string, string> = {}

    if (!imageUpload.title.trim()) {
      errors.title = "Image title is required"
    }
    if (!imageUpload.imageUrl.trim()) {
      errors.imageUrl = "Image URL is required"
    }

    setImageErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleUploadImage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient) return

    if (!validateImageUpload()) {
      toast.error("Please fix the errors in the form")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/patient-images", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientId: selectedPatient._id,
          ...imageUpload,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setPatientImages([...patientImages, data.image])
        setImageUpload({
          type: "xray",
          title: "",
          description: "",
          imageUrl: "",
          notes: "",
        })
        setImageErrors({})
        toast.success("Image uploaded successfully")
      } else {
        const errorData = await res.json()
        toast.error(errorData.error || "Failed to upload image")
      }
    } catch (error) {
      console.error(error)
      toast.error("Error uploading image")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteImage = async (imageId: string) => {
    try {
      const res = await fetch(`/api/patient-images/${imageId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        setPatientImages(patientImages.filter((img) => img._id !== imageId))
        toast.success("Image deleted successfully")
      } else {
        toast.error("Failed to delete image")
      }
    } catch (error) {
      console.error(error)
      toast.error("Error deleting image")
    }
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "doctor"]}>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto md:pt-0 pt-16">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Clinical Tools</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Manage patient records, tooth charts, and medical history
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Patients List */}
              <div className="lg:col-span-1">
                <div className="bg-card rounded-lg shadow-md border border-border p-6">
                  <h2 className="text-lg sm:text-xl font-bold mb-4 text-foreground">Your Patients</h2>
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {patients.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No patients assigned</p>
                    ) : (
                      patients.map((patient) => (
                        <button
                          key={patient._id || patient.id}
                          onClick={() => handleSelectPatient(patient._id || patient.id)}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-colors text-sm sm:text-base font-medium ${
                            selectedPatient?._id === (patient._id || patient.id)
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted hover:bg-muted/80 text-foreground"
                          }`}
                        >
                          <div className="truncate">{patient.name}</div>
                          <div className="text-xs opacity-75 truncate">{patient.phone}</div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-2">
                {selectedPatient ? (
                  <div className="bg-card rounded-lg shadow-md border border-border p-6">
                    {/* Patient Info Header */}
                    <div className="mb-6 pb-4 border-b border-border">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <h2 className="text-xl sm:text-2xl font-bold text-foreground">{selectedPatient.name}</h2>
                          <p className="text-muted-foreground text-sm">DOB: {selectedPatient.dob}</p>
                        </div>
                        <button
                          onClick={() => setShowHistory(!showHistory)}
                          className="flex items-center gap-2 bg-muted hover:bg-muted/80 text-foreground px-3 py-2 rounded-lg transition-colors text-sm font-medium"
                        >
                          <History className="w-4 h-4" />
                          History
                        </button>
                      </div>

                      {showHistory && doctorHistory.length > 0 && (
                        <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
                          <p className="font-semibold text-foreground mb-2">Doctor History:</p>
                          <div className="space-y-1">
                            {doctorHistory.map((history, idx) => (
                              <div key={idx} className="text-muted-foreground">
                                <span className="font-medium">{history.doctorName}</span> - From{" "}
                                {new Date(history.startDate).toLocaleDateString()}
                                {history.endDate && ` to ${new Date(history.endDate).toLocaleDateString()}`}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-6 border-b border-border">
                      {["tooth-chart", "medical-history", "images"].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`px-4 py-2 font-medium text-sm transition-colors ${
                            activeTab === tab
                              ? "text-primary border-b-2 border-primary"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {tab === "tooth-chart" && "Tooth Chart"}
                          {tab === "medical-history" && "Medical History"}
                          {tab === "images" && "X-Rays & Images"}
                        </button>
                      ))}
                    </div>

                    {/* Tooth Chart Tab */}
                    {activeTab === "tooth-chart" && (
                      <>
                        {!toothChart ? (
                          <div className="text-center py-12">
                            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                            <p className="text-muted-foreground mb-4">No tooth chart created yet</p>
                            <button
                              onClick={handleCreateToothChart}
                              disabled={loading}
                              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus className="w-4 h-4" />
                              {loading ? "Creating..." : "Create Tooth Chart"}
                            </button>
                          </div>
                        ) : (
                          <>
                            <ToothChartVisual teeth={toothChart.teeth || {}} onToothClick={handleToothClick} />

                            <div className="mt-6">
                              <label className="block text-sm font-semibold text-foreground mb-2">Overall Notes</label>
                              <textarea
                                value={toothChart.overallNotes || ""}
                                onChange={(e) =>
                                  setToothChart({
                                    ...toothChart,
                                    overallNotes: e.target.value,
                                  })
                                }
                                className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm"
                                rows={4}
                                placeholder="Add clinical notes about the patient's dental condition..."
                              />
                            </div>

                            <button
                              onClick={handleSaveToothChart}
                              disabled={loading}
                              className="mt-6 inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-accent-foreground px-6 py-2 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Save className="w-4 h-4" />
                              {loading ? "Saving..." : "Save Chart"}
                            </button>
                          </>
                        )}
                      </>
                    )}

                    {/* Medical History Tab */}
                    {activeTab === "medical-history" && (
                      <div className="space-y-6">
                        {medicalHistory && medicalHistory.entries && medicalHistory.entries.length > 0 ? (
                          <div className="space-y-3">
                            <h3 className="font-semibold text-foreground">Medical History Entries</h3>
                            {medicalHistory.entries.map((entry, idx) => (
                              <div key={idx} className="p-4 bg-muted rounded-lg">
                                <p className="text-xs text-muted-foreground mb-2">
                                  {new Date(entry.date).toLocaleDateString()}
                                </p>
                                {entry.notes && (
                                  <div>
                                    <p className="text-xs font-semibold text-foreground">Notes:</p>
                                    <p className="text-sm text-foreground">{entry.notes}</p>
                                  </div>
                                )}
                                {entry.findings && (
                                  <div className="mt-2">
                                    <p className="text-xs font-semibold text-foreground">Findings:</p>
                                    <p className="text-sm text-foreground">{entry.findings}</p>
                                  </div>
                                )}
                                {entry.treatment && (
                                  <div className="mt-2">
                                    <p className="text-xs font-semibold text-foreground">Treatment:</p>
                                    <p className="text-sm text-foreground">{entry.treatment}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-sm">No medical history entries yet</p>
                        )}
                        {user?.role === "doctor" && (
                          <form onSubmit={handleAddMedicalEntry} className="space-y-4 p-4 bg-muted rounded-lg">
                            <h3 className="font-semibold text-foreground">Add Medical Entry</h3>
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">Notes *</label>
                              <textarea
                                placeholder="Clinical notes..."
                                value={medicalEntry.notes}
                                onChange={(e) => {
                                  setMedicalEntry({
                                    ...medicalEntry,
                                    notes: e.target.value,
                                  })
                                  setMedicalErrors({
                                    ...medicalErrors,
                                    notes: "",
                                  })
                                }}
                                className={`w-full px-4 py-2 bg-input border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm ${
                                  medicalErrors.notes ? "border-destructive" : "border-border"
                                }`}
                                rows={2}
                              />
                              {medicalErrors.notes && (
                                <p className="text-xs text-destructive mt-1">{medicalErrors.notes}</p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">Findings *</label>
                              <textarea
                                placeholder="Findings..."
                                value={medicalEntry.findings}
                                onChange={(e) => {
                                  setMedicalEntry({
                                    ...medicalEntry,
                                    findings: e.target.value,
                                  })
                                  setMedicalErrors({
                                    ...medicalErrors,
                                    findings: "",
                                  })
                                }}
                                className={`w-full px-4 py-2 bg-input border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm ${
                                  medicalErrors.findings ? "border-destructive" : "border-border"
                                }`}
                                rows={2}
                              />
                              {medicalErrors.findings && (
                                <p className="text-xs text-destructive mt-1">{medicalErrors.findings}</p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-foreground mb-1">Treatment *</label>
                              <textarea
                                placeholder="Treatment..."
                                value={medicalEntry.treatment}
                                onChange={(e) => {
                                  setMedicalEntry({
                                    ...medicalEntry,
                                    treatment: e.target.value,
                                  })
                                  setMedicalErrors({
                                    ...medicalErrors,
                                    treatment: "",
                                  })
                                }}
                                className={`w-full px-4 py-2 bg-input border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm ${
                                  medicalErrors.treatment ? "border-destructive" : "border-border"
                                }`}
                                rows={2}
                              />
                              {medicalErrors.treatment && (
                                <p className="text-xs text-destructive mt-1">{medicalErrors.treatment}</p>
                              )}
                            </div>
                            <input
                              type="text"
                              placeholder="Medications (comma-separated)"
                              value={medicalEntry.medications}
                              onChange={(e) =>
                                setMedicalEntry({
                                  ...medicalEntry,
                                  medications: e.target.value,
                                })
                              }
                              className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm"
                            />
                            <button
                              type="submit"
                              disabled={loading}
                              className="bg-accent hover:bg-accent/90 text-accent-foreground px-4 py-2 rounded-lg transition-colors font-medium text-sm disabled:opacity-50"
                            >
                              {loading ? "Adding..." : "Add Entry"}
                            </button>
                          </form>
                        )}
                      </div>
                    )}

                    {/* Images Tab */}
                    {activeTab === "images" && (
                      <div className="space-y-6">
                        {patientImages.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {patientImages.map((image) => (
                              <div key={image._id} className="p-4 bg-muted rounded-lg">
                                {image.imageUrl && (
                                  <img
                                    src={image.imageUrl || "/placeholder.svg"}
                                    alt={image.title}
                                    className="w-full h-40 object-cover rounded-lg mb-3"
                                  />
                                )}
                                <p className="font-semibold text-foreground text-sm">{image.title}</p>
                                <p className="text-xs text-muted-foreground">{image.type.toUpperCase()}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {new Date(image.uploadedAt).toLocaleDateString()}
                                </p>
                                {image.notes && <p className="text-xs text-foreground mt-2">{image.notes}</p>}
                                <button
                                  onClick={() => {
                                    setImageToDelete(image)
                                    setShowDeleteModal(true)
                                  }}
                                  className="mt-3 text-xs text-destructive hover:underline flex items-center gap-1"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  Delete
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-sm">No images uploaded yet</p>
                        )}
                        <form onSubmit={handleUploadImage} className="space-y-4 p-4 bg-muted rounded-lg">
                          <h3 className="font-semibold text-foreground">Upload X-Ray or Image</h3>
                          <select
                            value={imageUpload.type}
                            onChange={(e) =>
                              setImageUpload({
                                ...imageUpload,
                                type: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                          >
                            <option value="xray">X-Ray</option>
                            <option value="photo">Photo</option>
                            <option value="scan">Scan</option>
                          </select>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Image Title *</label>
                            <input
                              type="text"
                              placeholder="Image title"
                              value={imageUpload.title}
                              onChange={(e) => {
                                setImageUpload({
                                  ...imageUpload,
                                  title: e.target.value,
                                })
                                setImageErrors({ ...imageErrors, title: "" })
                              }}
                              className={`w-full px-4 py-2 bg-input border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm ${
                                imageErrors.title ? "border-destructive" : "border-border"
                              }`}
                            />
                            {imageErrors.title && <p className="text-xs text-destructive mt-1">{imageErrors.title}</p>}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-1">Image URL *</label>
                            <textarea
                              placeholder="Image URL (paste image URL here)"
                              value={imageUpload.imageUrl}
                              onChange={(e) => {
                                setImageUpload({
                                  ...imageUpload,
                                  imageUrl: e.target.value,
                                })
                                setImageErrors({
                                  ...imageErrors,
                                  imageUrl: "",
                                })
                              }}
                              className={`w-full px-4 py-2 bg-input border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm ${
                                imageErrors.imageUrl ? "border-destructive" : "border-border"
                              }`}
                              rows={2}
                            />
                            {imageErrors.imageUrl && (
                              <p className="text-xs text-destructive mt-1">{imageErrors.imageUrl}</p>
                            )}
                          </div>
                          <textarea
                            placeholder="Notes..."
                            value={imageUpload.notes}
                            onChange={(e) =>
                              setImageUpload({
                                ...imageUpload,
                                notes: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm"
                            rows={2}
                          />
                          <button
                            type="submit"
                            disabled={loading || !imageUpload.imageUrl}
                            className="bg-accent hover:bg-accent/90 text-accent-foreground px-4 py-2 rounded-lg transition-colors font-medium text-sm disabled:opacity-50"
                          >
                            {loading ? "Uploading..." : "Upload Image"}
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-card rounded-lg shadow-md border border-border p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground">Select a patient to view their clinical records</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
        <ConfirmDeleteModal
          isOpen={showDeleteModal}
          title="Delete Image"
          description="Are you sure you want to delete this image? This action cannot be undone."
          itemName={imageToDelete?.title || "Untitled Image"}
          onConfirm={() => {
            handleDeleteImage(imageToDelete._id)
            setShowDeleteModal(false)
            setImageToDelete(null)
          }}
          onCancel={() => {
            setShowDeleteModal(false)
            setImageToDelete(null)
          }}
        />
      </div>
    </ProtectedRoute>
  )
}
