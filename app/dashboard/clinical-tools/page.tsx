//@ts-nocheck
"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/components/auth-context"
import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { AlertCircle, History, Trash2, Loader2, FileText } from "lucide-react"
import { ToothChartVisual } from "@/components/tooth-chart-visual"
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal"
import { XrayFileUpload } from "@/components/xray-file-upload"
import { XrayDisplayViewer } from "@/components/xray-display-viewer"
import { MedicalHistorySection } from "@/components/medical-history-section"
import { PatientReportsSection } from "@/components/patient-reports-section"

export default function ClinicalToolsPage() {
  const { user, token } = useAuth()
  const [patients, setPatients] = useState([])
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [toothChart, setToothChart] = useState(null)
  const [patientImages, setPatientImages] = useState([])
  const [loading, setLoading] = useState({
    patients: false,
    toothChart: false,
    medicalHistory: false,
    patientImages: false,
    createChart: false,
    saveChart: false,
    addMedical: false,
    uploadImage: false,
    deleteImage: false,
  })
  const [showHistory, setShowHistory] = useState(false)
  const [doctorHistory, setDoctorHistory] = useState([])
  const [activeTab, setActiveTab] = useState("tooth-chart")
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null)
  const [editingEntry, setEditingEntry] = useState({
    notes: "",
    findings: "",
    treatment: "",
    medications: "",
  })
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
  const [showMedicalDeleteModal, setShowMedicalDeleteModal] = useState(false)
  const [medicalEntryToDelete, setMedicalEntryToDelete] = useState<number | null>(null)
  const [showFileUpload, setShowFileUpload] = useState(false)
  const [selectedImage, setSelectedImage] = useState<any>(null)
  const [patientSearch, setPatientSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const PATIENTS_PER_PAGE = 10

  useEffect(() => {
    if (token) {
      if (user?.role === "doctor") {
        fetchPatientsWithAppointments()
      } else {
        fetchPatients()
      }
    }
  }, [token, user])

  const fetchPatientsWithAppointments = async () => {
    setLoading((prev) => ({ ...prev, patients: true }))
    try {
      const patientsRes = await fetch("/api/patients", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (patientsRes.ok) {
        const patientsData = await patientsRes.json()
        const allPatientsList = patientsData.patients || []
        setPatients(allPatientsList)
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to fetch patients")
    } finally {
      setLoading((prev) => ({ ...prev, patients: false }))
    }
  }

  const fetchPatients = async () => {
    setLoading((prev) => ({ ...prev, patients: true }))
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
    } finally {
      setLoading((prev) => ({ ...prev, patients: false }))
    }
  }

  const handleSelectPatient = async (patientId: string) => {
    const patient = patients.find((p) => (p._id || p.id).toString() === patientId)
    setSelectedPatient(patient)
    setToothChart(null)
    setPatientImages([])
    setDoctorHistory(patient?.doctorHistory || [])

    setLoading((prev) => ({
      ...prev,
      toothChart: true,
      patientImages: true,
    }))

    try {
      const res = await fetch(`/api/tooth-chart?patientId=${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        const chart = data.toothChart || (data.charts && data.charts[0])
        if (chart && chart.patientId.toString() === patientId) {
          setToothChart(chart)
          console.log("  Tooth chart loaded:", chart)
        }
      } else {
        console.log("  No tooth chart found for patient:", patientId)
      }
    } catch (error) {
      console.error("  Error fetching tooth chart:", error)
    } finally {
      setLoading((prev) => ({ ...prev, toothChart: false }))
    }

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
    } finally {
      setLoading((prev) => ({ ...prev, patientImages: false }))
    }
  }

  const handleCreateToothChart = async () => {
    if (!selectedPatient) return toast.error("Please select a patient first")
    setLoading((prev) => ({ ...prev, createChart: true }))

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
      setLoading((prev) => ({ ...prev, createChart: false }))
    }
  }

  const handleToothClick = (toothNumber: number) => {
    if (!toothChart) return
    const statuses = ["healthy", "cavity", "filling", "implant", "missing", "root_canal", "treated", "crown"]
    const currentTeeth = toothChart.teeth || {}
    const currentStatus = currentTeeth[toothNumber]?.status || "healthy"

    const normalizedStatus = currentStatus.replace("-", "_")
    const currentIndex = statuses.indexOf(normalizedStatus)

    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % statuses.length
    const nextStatus = statuses[nextIndex]

    console.log("[v0] Tooth click debug:", {
      toothNumber,
      currentStatus,
      normalizedStatus,
      currentIndex,
      nextIndex,
      nextStatus,
      availableStatuses: statuses,
    })

    setToothChart({
      ...toothChart,
      teeth: {
        ...currentTeeth,
        [toothNumber]: {
          ...(currentTeeth[toothNumber] || {}),
          status: nextStatus,
          lastUpdated: new Date(),
        },
      },
    })
  }

  const handleToothStatusChange = (toothNumber: number, newStatus: string) => {
    if (!toothChart) return
    setToothChart({
      ...toothChart,
      teeth: {
        ...(toothChart.teeth || {}),
        [toothNumber]: {
          ...(toothChart.teeth?.[toothNumber] || {}),
          status: newStatus,
          lastUpdated: new Date(),
        },
      },
    })
  }

  const handleSaveToothChart = async () => {
    if (!toothChart) return
    setLoading((prev) => ({ ...prev, saveChart: true }))

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
      setLoading((prev) => ({ ...prev, saveChart: false }))
    }
  }

  const handleEditMedicalEntry = (index: number, entry: any) => {
    setEditingEntryId(index.toString())
    setEditingEntry({
      notes: entry.notes || "",
      findings: entry.findings || "",
      treatment: entry.treatment || "",
      medications: (entry.medications || []).join(", "),
    })
  }

  const handleFileUploadSuccess = (fileUrl: string, fileName: string) => {
    setImageUpload({
      ...imageUpload,
      imageUrl: fileUrl,
      title: imageUpload.title || fileName.split(".")[0],
    })
    setShowFileUpload(false)
  }

  const filteredPatients = patients.filter((p) => p.name.toLowerCase().includes(patientSearch.toLowerCase()))

  const totalPages = Math.ceil(filteredPatients.length / PATIENTS_PER_PAGE)
  const startIndex = (currentPage - 1) * PATIENTS_PER_PAGE
  const paginatedPatients = filteredPatients.slice(startIndex, startIndex + PATIENTS_PER_PAGE)

  return (
    <ProtectedRoute allowedRoles={["admin", "doctor"]}>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto md:pt-0 pt-16">
          <div className="p-3 sm:p-4 md:p-6 lg:p-8">
            <div className="mb-6 sm:mb-8">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Clinical Tools</h1>
              <p className="text-xs sm:text-sm mt-1 text-muted-foreground">
                Manage patient records, tooth charts, and medical history
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
              {/* Patients List */}
              <div className="lg:col-span-1">
                <div className="bg-card rounded-lg shadow-md border border-border p-3 sm:p-4 md:p-6">
                  <h2 className="text-base sm:text-lg md:text-xl font-bold mb-3 sm:mb-4 text-foreground">
                    Your Patients
                  </h2>
                  <input
                    type="text"
                    placeholder="Search patients..."
                    value={patientSearch}
                    onChange={(e) => {
                      setPatientSearch(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="w-full px-3 sm:px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-xs sm:text-sm mb-3 sm:mb-4 cursor-text"
                  />
                  <div className="space-y-1.5 sm:space-y-2 max-h-[400px] sm:max-h-[500px] overflow-y-auto">
                    {loading.patients ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      </div>
                    ) : paginatedPatients.length === 0 ? (
                      <p className="text-muted-foreground text-xs sm:text-sm">No patients found</p>
                    ) : (
                      paginatedPatients.map((patient) => (
                        <button
                          key={patient._id || patient.id}
                          onClick={() => handleSelectPatient(patient._id || patient.id)}
                          disabled={loading.toothChart || loading.patientImages}
                          className={`w-full text-left px-3 sm:px-4 py-2 sm:py-3 rounded-lg transition-colors text-xs sm:text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                            selectedPatient?._id === (patient._id || patient.id)
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted hover:bg-muted/80 text-foreground"
                          }`}
                        >
                          <div className="truncate">{patient.name}</div>
                          <div className="text-xs opacity-75 truncate">{patient.idNumber}</div>
                        </button>
                      ))
                    )}
                  </div>
                  {totalPages > 1 && (
                    <div className="mt-3 sm:mt-4 flex items-center justify-between gap-2 text-xs sm:text-sm">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-2 sm:px-3 py-1 sm:py-1.5 bg-muted hover:bg-muted/80 disabled:bg-muted/50 text-foreground rounded transition-colors disabled:cursor-not-allowed cursor-pointer"
                      >
                        Prev
                      </button>
                      <span className="text-muted-foreground">
                        {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-2 sm:px-3 py-1 sm:py-1.5 bg-muted hover:bg-muted/80 disabled:bg-muted/50 text-foreground rounded transition-colors disabled:cursor-not-allowed cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-2">
                {selectedPatient ? (
                  <div className="bg-card rounded-lg shadow-md border border-border p-3 sm:p-4 md:p-6">
                    {/* Patient Info Header */}
                    <div className="mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-border">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                        <div className="min-w-0">
                          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground truncate">
                            {selectedPatient.name}
                          </h2>
                          <p className="text-xs sm:text-sm text-muted-foreground">DOB: {selectedPatient.dob}</p>
                        </div>
                        <button
                          onClick={() => setShowHistory(!showHistory)}
                          disabled={loading.toothChart || loading.patientImages}
                          className="flex-shrink-0 flex items-center gap-2 bg-muted hover:bg-muted/80 disabled:bg-muted/50 text-foreground px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg transition-colors text-xs sm:text-sm font-medium disabled:cursor-not-allowed cursor-pointer"
                        >
                          <History className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">History</span>
                        </button>
                      </div>

                      {showHistory && doctorHistory.length > 0 && (
                        <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-muted rounded-lg text-xs sm:text-sm">
                          <p className="font-semibold text-foreground mb-2">Doctor History:</p>
                          <div className="space-y-0.5 sm:space-y-1">
                            {doctorHistory.map((history, idx) => (
                              <div key={idx} className="text-muted-foreground text-xs sm:text-sm">
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
                    <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-6 border-b border-border overflow-x-auto">
                      {["tooth-chart", "history", "reports", "images"].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          disabled={loading.toothChart || loading.patientImages}
                          className={`px-2 sm:px-4 py-2 font-medium text-xs sm:text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap ${
                            activeTab === tab
                              ? "text-primary border-b-2 border-primary"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {tab === "tooth-chart" && "Teeth"}
                          {tab === "history" && "History"}
                          {tab === "reports" && "Reports"}
                          {tab === "images" && "Images"}
                        </button>
                      ))}
                    </div>

                    {/* Tooth Chart Tab */}
                    {activeTab === "tooth-chart" && (
                      <>
                        {loading.toothChart ? (
                          <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : !toothChart ? (
                          <div className="text-center py-12">
                            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                            <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                              No tooth chart created yet
                            </p>
                            <button
                              onClick={handleCreateToothChart}
                              disabled={loading.createChart}
                              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground px-4 sm:px-6 py-2 rounded-lg transition-colors font-medium text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                              {loading.createChart && <Loader2 className="w-4 h-4 animate-spin" />}
                              {loading.createChart ? "Creating..." : "Create Tooth Chart"}
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-3 sm:mb-4">
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                ⚠️ Save after updating tooth status
                              </p>
                              <button
                                onClick={handleSaveToothChart}
                                disabled={loading.saveChart}
                                className="flex-shrink-0 inline-flex items-center gap-2 bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-accent-foreground px-3 sm:px-6 py-2 rounded-lg transition-colors font-medium text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                              >
                                {loading.saveChart && <Loader2 className="w-4 h-4 animate-spin" />}
                                {loading.saveChart ? "Saving..." : "Save Chart"}
                              </button>
                            </div>

                            <ToothChartVisual
                              teeth={toothChart.teeth || {}}
                              onToothClick={handleToothClick}
                              onToothStatusChange={handleToothStatusChange}
                            />

                            <div className="mt-4 sm:mt-6">
                              <label className="block text-xs sm:text-sm font-semibold text-foreground mb-2">
                                Overall Notes
                              </label>
                              <textarea
                                value={toothChart.overallNotes || ""}
                                onChange={(e) =>
                                  setToothChart({
                                    ...toothChart,
                                    overallNotes: e.target.value,
                                  })
                                }
                                disabled={loading.saveChart}
                                className="w-full px-3 sm:px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                rows={4}
                                placeholder="Add clinical notes..."
                              />
                            </div>
                          </>
                        )}
                      </>
                    )}

                    {/* Medical History Tab */}
                    {activeTab === "history" && (
                      <MedicalHistorySection
                        patientId={selectedPatient._id || selectedPatient.id}
                        token={token}
                        isDoctor={user?.role === "doctor"}
                        currentDoctorId={user?.id}
                      />
                    )}

                    {/* Reports Tab */}
                    {activeTab === "reports" && (
                      <PatientReportsSection
                        patientId={selectedPatient._id || selectedPatient.id}
                        token={token}
                        isDoctor={user?.role === "doctor"}
                        currentDoctorId={user?.id}
                      />
                    )}

                    {/* Images Tab */}
                    {activeTab === "images" && (
                      <div className="space-y-4 sm:space-y-6">
                        {loading.patientImages ? (
                          <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : patientImages.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            {patientImages.map((image) => {
                              const isPdf = image.imageUrl?.toLowerCase().includes(".pdf")
                              const canDeleteImage = () => {
                                if (user?.role !== "doctor") return false
                                if (!image.uploadedBy) return false
                                const uploadedById = String(image.uploadedBy._id || image.uploadedBy)
                                const currentUserId = String(user.id)
                                return uploadedById === currentUserId
                              }

                              return (
                                <div
                                  key={image._id}
                                  className="p-3 sm:p-4 bg-muted rounded-lg cursor-pointer hover:shadow-md transition-shadow"
                                  onClick={() => setSelectedImage(image)}
                                >
                                  {isPdf ? (
                                    <div className="w-full h-32 sm:h-40 bg-gradient-to-br from-muted to-muted/50 rounded-lg mb-2 sm:mb-3 flex items-center justify-center">
                                      <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-destructive/50" />
                                    </div>
                                  ) : (
                                    <img
                                      src={image.imageUrl || "/placeholder.svg"}
                                      alt={image.title}
                                      className="w-full h-32 sm:h-40 object-cover rounded-lg mb-2 sm:mb-3"
                                    />
                                  )}
                                  <p className="font-semibold text-foreground text-xs sm:text-sm truncate">
                                    {image.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground">{image.type.toUpperCase()}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1">
                                    {new Date(image.uploadedAt).toLocaleDateString()}
                                  </p>
                                  {image.notes && (
                                    <p className="text-xs text-foreground mt-1.5 sm:mt-2">{image.notes}</p>
                                  )}
                                  {canDeleteImage() && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        setImageToDelete(image)
                                        setShowDeleteModal(true)
                                      }}
                                      disabled={loading.deleteImage}
                                      className="mt-2 sm:mt-3 text-xs text-destructive hover:underline flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      Delete
                                    </button>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-xs sm:text-sm">No images uploaded yet</p>
                        )}
                        <form
                          onSubmit={(e) => {
                            e.preventDefault()
                            if (!selectedPatient) return

                            const validateImageUpload = (): boolean => {
                              const errors: Record<string, string> = {}
                              if (!imageUpload.title.trim()) errors.title = "Image title is required"
                              if (!imageUpload.imageUrl.trim()) errors.imageUrl = "Image URL is required"
                              setImageErrors(errors)
                              return Object.keys(errors).length === 0
                            }

                            if (!validateImageUpload()) {
                              toast.error("Please fix the errors in the form")
                              return
                            }

                            setLoading((prev) => ({ ...prev, uploadImage: true }))
                            fetch("/api/patient-images", {
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
                              .then(async (res) => {
                                const data = await res.json()
                                return { ok: res.ok, data }
                              })
                              .then(({ ok, data }) => {
                                if (ok) {
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
                                  toast.error(data.error || "Failed to upload image")
                                }
                              })
                              .catch((error) => {
                                console.error(error)
                                toast.error("Error uploading image")
                              })
                              .finally(() => setLoading((prev) => ({ ...prev, uploadImage: false })))
                          }}
                          className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-muted rounded-lg border border-border"
                        >
                          <h3 className="font-semibold text-foreground text-sm sm:text-base">Upload X-Ray or Image</h3>

                          {!imageUpload.imageUrl && (
                            <div className="mb-3 sm:mb-4">
                              <h4 className="text-xs sm:text-sm font-medium text-foreground mb-2 sm:mb-3">
                                Step 1: Upload File
                              </h4>
                              <XrayFileUpload
                                onUploadSuccess={handleFileUploadSuccess}
                                isLoading={loading.uploadImage}
                              />
                            </div>
                          )}

                          {imageUpload.imageUrl && (
                            <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-accent/10 border border-accent rounded-lg">
                              <p className="text-xs sm:text-sm text-foreground">
                                <span className="font-medium">File uploaded:</span> {imageUpload.title}
                              </p>
                              <button
                                onClick={() => setImageUpload({ ...imageUpload, imageUrl: "", title: "" })}
                                className="text-xs text-accent hover:underline mt-1 sm:mt-2 cursor-pointer"
                              >
                                Change file
                              </button>
                            </div>
                          )}

                          <select
                            value={imageUpload.type}
                            onChange={(e) =>
                              setImageUpload({
                                ...imageUpload,
                                type: e.target.value,
                              })
                            }
                            disabled={loading.uploadImage}
                            className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <option value="xray">X-Ray</option>
                            <option value="photo">Photo</option>
                            <option value="scan">Scan</option>
                          </select>
                          <div>
                            <label className="block text-xs sm:text-sm font-medium text-foreground mb-1">
                              Image Title *
                            </label>
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
                              disabled={loading.uploadImage}
                              className={`w-full px-4 py-2 bg-input border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                                imageErrors.title ? "border-destructive" : "border-border"
                              }`}
                            />
                            {imageErrors.title && <p className="text-xs text-destructive mt-1">{imageErrors.title}</p>}
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
                            disabled={loading.uploadImage}
                            className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            rows={2}
                          />
                          <button
                            type="submit"
                            disabled={loading.uploadImage || !imageUpload.imageUrl}
                            className="flex items-center gap-2 bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-accent-foreground px-3 py-2 rounded-lg transition-colors font-medium text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          >
                            {loading.uploadImage && <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />}
                            {loading.uploadImage ? "Uploading..." : "Upload Image"}
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-card rounded-lg shadow-md border border-border p-6 sm:p-8 text-center">
                    <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-muted-foreground text-sm sm:text-base">
                      Select a patient to view their clinical records
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
        {selectedImage && (
          <XrayDisplayViewer
            imageUrl={selectedImage.imageUrl}
            title={selectedImage.title || "Document"}
            type={selectedImage.type}
            description={selectedImage.description}
            notes={selectedImage.notes}
            uploadedBy={selectedImage.uploadedBy?.name}
            uploadedAt={selectedImage.uploadedAt}
            onClose={() => setSelectedImage(null)}
          />
        )}
        <ConfirmDeleteModal
          isOpen={showMedicalDeleteModal}
          title="Delete Medical Entry"
          description="Are you sure you want to delete this medical history entry? This action cannot be undone."
          itemName="Medical Entry"
          onConfirm={() => {
            setShowMedicalDeleteModal(false)
            setMedicalEntryToDelete(null)
          }}
          onCancel={() => {
            setShowMedicalDeleteModal(false)
            setMedicalEntryToDelete(null)
          }}
          isLoading={loading.addMedical}
        />
        <ConfirmDeleteModal
          isOpen={showDeleteModal}
          title="Delete Image"
          description="Are you sure you want to delete this image? This action cannot be undone."
          itemName={imageToDelete?.title || "Untitled Image"}
          onConfirm={() => {
            setShowDeleteModal(false)
            setImageToDelete(null)
          }}
          onCancel={() => {
            setShowDeleteModal(false)
            setImageToDelete(null)
          }}
          isLoading={loading.deleteImage}
        />
      </div>
    </ProtectedRoute>
  )
}
