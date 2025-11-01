//@ts-nocheck
"use client"

import type React from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/components/auth-context"
import { ConfirmDeleteModal } from "@/components/confirm-delete-modal"
import { SearchableDropdown } from "@/components/searchable-dropdown"
import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { AlertCircle, Plus, Edit2, Trash2, Eye, X, Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { formatPhoneForDisplay, formatPhoneForDatabase } from "@/lib/validation"
import PhoneInput from "react-phone-number-input"
import "react-phone-number-input/style.css"

const formErrors = {
  assignedDoctorId: "Assigned Doctor is required",
}

export default function PatientsPage() {
  const { user, token } = useAuth()
  const [patients, setPatients] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [editingPatient, setEditingPatient] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    dob: "",
    idNumber: "",
    address: "",
    insuranceProvider: "",
    insuranceNumber: "",
    allergies: "",
    medicalConditions: "",
    assignedDoctorId: "",
  })
  const [doctors, setDoctors] = useState([])
  const [editingMedicalInfo, setEditingMedicalInfo] = useState(false)
  const [medicalFormData, setMedicalFormData] = useState({
    medicalHistory: "",
    allergies: "",
    medicalConditions: "",
  })
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [patientToDelete, setPatientToDelete] = useState<any>(null)

  // New state for credential warning modal
  const [showCredentialWarning, setShowCredentialWarning] = useState(false)
  const [credentialWarnings, setCredentialWarnings] = useState<string[]>([])
  const [pendingSubmit, setPendingSubmit] = useState<(() => void) | null>(null)

  // Search and pagination state
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Loading states
  const [loading, setLoading] = useState({
    patients: false,
    doctors: false,
    addPatient: false,
    updatePatient: false,
    deletePatient: false,
    updateMedicalInfo: false,
  })

  const [medicalHistoryEntries, setMedicalHistoryEntries] = useState<any[]>([])
  const [loadingMedicalHistory, setLoadingMedicalHistory] = useState(false)

  useEffect(() => {
    if (token) {
      fetchPatients()
      if (user?.role !== "doctor") {
        fetchDoctors()
      }
    }
  }, [token, user?.role])

  const fetchPatients = async () => {
    setLoading((prev) => ({ ...prev, patients: true }))
    try {
      const res = await fetch("/api/patients", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setPatients(data.patients || [])
      } else {
        try {
          const error = await res.json()
          toast.error(error.error || "Failed to fetch patients")
        } catch {
          toast.error("Failed to fetch patients")
        }
      }
    } catch (error) {
      toast.error("Error fetching patients")
    } finally {
      setLoading((prev) => ({ ...prev, patients: false }))
    }
  }

  const fetchDoctors = async () => {
    setLoading((prev) => ({ ...prev, doctors: true }))
    try {
      const res = await fetch("/api/users?role=doctor", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setDoctors(data.users || [])
      } else {
        try {
          const error = await res.json()
          toast.error(error.error || "Failed to fetch doctors")
        } catch {
          toast.error("Failed to fetch doctors")
        }
      }
    } catch (error) {
      toast.error("Error fetching doctors")
    } finally {
      setLoading((prev) => ({ ...prev, doctors: false }))
    }
  }

  // Filter patients based on search term
  const filteredPatients = patients.filter((patient) => {
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()
    return (
      patient.name?.toLowerCase().includes(searchLower) ||
      patient.phone?.toLowerCase().includes(searchLower) ||
      patient.email?.toLowerCase().includes(searchLower) ||
      patient.idNumber?.toLowerCase().includes(searchLower) ||
      patient.assignedDoctorId?.name?.toLowerCase().includes(searchLower) ||
      patient.allergies?.some((allergy: string) => allergy.toLowerCase().includes(searchLower)) ||
      patient.medicalConditions?.some((condition: string) => condition.toLowerCase().includes(searchLower))
    )
  })

  // Calculate pagination
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPatients = filteredPatients.slice(startIndex, endIndex)

  // Reset to first page when search term or items per page changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, itemsPerPage])

  const validatePatientCredentials = (data: any) => {
    const criticalCredentials: string[] = []
    const warningCredentials: string[] = []

    if (!data.idNumber?.trim()) criticalCredentials.push("ID Number")
    if (!data.phone?.trim()) criticalCredentials.push("Phone Number")
    if (!data.dob?.trim()) criticalCredentials.push("Date of Birth")
    if (!data.name?.trim()) criticalCredentials.push("Name")

    if (!data.insuranceProvider?.trim()) warningCredentials.push("Insurance Provider")
    if (!data.insuranceNumber?.trim()) warningCredentials.push("Insurance Number")
    if (!data.address?.trim()) warningCredentials.push("Address")

    return {
      isComplete: criticalCredentials.length === 0,
      criticalCredentials,
      warningCredentials,
    }
  }

  // Enhanced handleAddPatient function with credential warnings modal
  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault()

    const loadingKey = editingPatient ? "updatePatient" : "addPatient"
    setLoading((prev) => ({ ...prev, [loadingKey]: true }))

    // Ensure phone number starts with +
    let phoneNumber = formData.phone
    if (phoneNumber && !phoneNumber.startsWith("+")) {
      phoneNumber = "+" + phoneNumber.replace(/\D/g, "")
      console.log("[v0] Fixed phone number format:", phoneNumber)
    }

    const phoneValidation = validatePhoneInputStrict(phoneNumber)
    if (!phoneValidation.valid) {
      toast.error(phoneValidation.error)
      setLoading((prev) => ({ ...prev, [loadingKey]: false }))
      return
    }

    // Validate credentials
    const validation = validatePatientCredentials({ ...formData, phone: phoneNumber })

    // Block if critical credentials are missing
    if (validation.criticalCredentials.length > 0) {
      toast.error(`Missing critical credentials: ${validation.criticalCredentials.join(", ")}`)
      setLoading((prev) => ({ ...prev, [loadingKey]: false }))
      return
    }

    if (!formData.assignedDoctorId) {
      toast.error(formErrors.assignedDoctorId)
      setLoading((prev) => ({ ...prev, [loadingKey]: false }))
      return
    }

    const selectedDoctor = doctors.find((doc) => doc.id === formData.assignedDoctorId)
    if (!selectedDoctor) {
      toast.error("Invalid doctor selection. Please select a doctor from the list.")
      setLoading((prev) => ({ ...prev, [loadingKey]: false }))
      return
    }

    // Show modal for missing non-critical credentials - DON'T reset loading here
    if (validation.warningCredentials.length > 0) {
      setCredentialWarnings(validation.warningCredentials)
      setPendingSubmit(() => () => submitPatientData(loadingKey, phoneNumber))
      setShowCredentialWarning(true)
      // DON'T reset loading state here - keep it true so the button shows loading
      return
    }

    // If no warnings, proceed directly
    await submitPatientData(loadingKey, phoneNumber)
  }

  // Separate function to handle the actual submission
  const submitPatientData = async (loadingKey: string, phoneNumber: string) => {
    try {
      const method = editingPatient ? "PUT" : "POST"
      const url = editingPatient ? `/api/patients/${editingPatient}` : "/api/patients"

      const formattedPhone = formatPhoneForDatabase(phoneNumber)
      console.log("  Submitting phone:", phoneNumber, "Formatted:", formattedPhone)

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          phone: formattedPhone,
          email: formData.email || "", // Ensure empty string if not provided
          address: formData.address || "",
          insuranceProvider: formData.insuranceProvider || "", // Ensure empty string if not provided
          insuranceNumber: formData.insuranceNumber || "",
          allergies: formData.allergies
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean),
          medicalConditions: formData.medicalConditions
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (editingPatient) {
          setPatients(patients.map((p) => (p._id === editingPatient ? data.patient : p)))
        } else {
          setPatients([...patients, data.patient])
        }
        setEditingPatient(null)
        setShowForm(false)
        toast.success(`Patient ${editingPatient ? "updated" : "added"} successfully.`)
      } else {
        const error = await res.json()
        toast.error(error.error || "Failed to save patient")
      }
    } catch (error) {
      console.log("  Fetch error:", error)
      toast.error(error instanceof Error ? error.message : "Error saving patient")
    } finally {
      setLoading((prev) => ({ ...prev, [loadingKey]: false }))
    }
  }

  // Handle proceed with warnings
  const handleProceedWithWarnings = () => {
    setShowCredentialWarning(false)
    if (pendingSubmit) {
      // Re-enable loading state when proceeding with warnings
      const loadingKey = editingPatient ? "updatePatient" : "addPatient"
      setLoading((prev) => ({ ...prev, [loadingKey]: true }))
      pendingSubmit()
    }
    setPendingSubmit(null)
    setCredentialWarnings([])
  }

  // Handle cancel with warnings
  const handleCancelWithWarnings = () => {
    setShowCredentialWarning(false)
    setPendingSubmit(null)
    setCredentialWarnings([])
  }

  const validatePhoneInput = (phone: string): { valid: boolean; error?: string } => {
    if (!phone) {
      return { valid: false, error: "Phone number is required" }
    }

    const phoneStr = String(phone).trim()

    if (phoneStr === "") {
      return { valid: false, error: "Phone number is required" }
    }

    // Check if it starts with +
    if (!phoneStr.startsWith("+")) {
      return {
        valid: false,
        error: "Phone must start with + (country code, e.g., +1234567890)",
      }
    }

    // Get digits after +
    const digitsOnly = phoneStr.slice(1)

    // Check if contains only digits
    if (!/^\d+$/.test(digitsOnly)) {
      return { valid: false, error: "Phone must contain only digits after +" }
    }

    return { valid: true }
  }

  const validatePhoneInputStrict = (phone: string): { valid: boolean; error?: string } => {
    const basicValidation = validatePhoneInput(phone)
    if (!basicValidation.valid) {
      return basicValidation
    }

    const phoneStr = String(phone).trim()
    const digitsOnly = phoneStr.slice(1)

    // Check length only on form submission
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
      return { valid: false, error: "Phone must be 10-15 digits after +" }
    }

    return { valid: true }
  }

  const handleDeletePatient = async (patientId: string) => {
    setLoading((prev) => ({ ...prev, deletePatient: true }))
    try {
      const res = await fetch(`/api/patients/${patientId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setPatients(patients.filter((p) => p._id !== patientId))
        toast.success(`Patient deleted successfully.`)
      } else {
        const error = await res.json()
        toast.error(error.error || "Failed to delete patient")
      }
    } catch (error) {
      toast.error("Error deleting patient")
    } finally {
      setLoading((prev) => ({ ...prev, deletePatient: false }))
    }
  }

  const handleEditPatient = (patient: any) => {
    setEditingPatient(patient._id)
    let doctorId = ""
    if (patient.assignedDoctorId) {
      const assignedDoctor = doctors.find(
        (doc) =>
          doc.id === patient.assignedDoctorId._id?.toString() || doc._id === patient.assignedDoctorId._id?.toString(),
      )
      doctorId = assignedDoctor?.id || patient.assignedDoctorId._id?.toString() || ""
    }

    const displayPhone = formatPhoneForDisplay(patient.phone)

    console.log("Editing patient data:", {
      // Debug log
      insuranceNumber: patient.insuranceNumber,
      insuranceProvider: patient.insuranceProvider,
      address: patient.address,
    })

    setFormData({
      name: patient.name,
      phone: displayPhone,
      email: patient.email,
      dob: patient.dob,
      idNumber: patient.idNumber || "",
      address: patient.address || "",
      insuranceProvider: patient.insuranceProvider || "",
      insuranceNumber: patient.insuranceNumber || "", // Ensure this is set
      allergies: patient.allergies?.join(", ") || "",
      medicalConditions: patient.medicalConditions?.join(", ") || "",
      assignedDoctorId: doctorId,
    })
    setShowForm(true)
  }

  const handleUpdateMedicalInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient) return

    setLoading((prev) => ({ ...prev, updateMedicalInfo: true }))

    try {
      const res = await fetch(`/api/patients/${selectedPatient._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          medicalHistory: medicalFormData.medicalHistory,
          allergies: medicalFormData.allergies
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean),
          medicalConditions: medicalFormData.medicalConditions
            .split(",")
            .map((c) => c.trim())
            .filter(Boolean),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setPatients(patients.map((p) => (p._id === selectedPatient._id ? data.patient : p)))
        setSelectedPatient(data.patient)
        setEditingMedicalInfo(false)
        toast.success("Medical info updated successfully")
      } else {
        let errorMessage = "Failed to update medical info"
        try {
          const error = await res.json()
          errorMessage = error.error || error.message || errorMessage
        } catch (parseError) {
          errorMessage = `Failed to update medical info (${res.status})`
        }
        toast.error(errorMessage)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error updating medical info")
    } finally {
      setLoading((prev) => ({ ...prev, updateMedicalInfo: false }))
    }
  }

  const fetchMedicalHistory = async (patientId: string) => {
    setLoadingMedicalHistory(true)
    console.log("[v0] Fetching medical history for patient:", patientId)
    try {
      const res = await fetch(`/api/medical-history?patientId=${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        console.log("[v0] Medical history response:", data)
        const entries = data.history?.entries || []
        console.log("[v0] Extracted entries:", entries)
        setMedicalHistoryEntries(entries)
      } else {
        console.error("[v0] Failed to fetch medical history, status:", res.status)
        const errorData = await res.json().catch(() => ({}))
        console.error("[v0] Error response:", errorData)
        setMedicalHistoryEntries([])
      }
    } catch (error) {
      console.error("[v0] Error fetching medical history:", error)
      setMedicalHistoryEntries([])
    } finally {
      setLoadingMedicalHistory(false)
    }
  }

  const incompleteCredentials = patients.filter((p) => p.credentialStatus === "incomplete")

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto md:pt-0 pt-16">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Patients</h1>
                <p className="text-muted-foreground text-sm mt-1">Manage patient records and medical information</p>
              </div>
              {user?.role !== "doctor" && (
                <button
                  onClick={() => {
                    setEditingPatient(null)
                    setShowForm(!showForm)
                    if (!showForm) {
                      setFormData({
                        name: "",
                        phone: "",
                        email: "",
                        dob: "",
                        idNumber: "",
                        address: "",
                        insuranceProvider: "",
                        insuranceNumber: "",
                        allergies: "",
                        medicalConditions: "",
                        assignedDoctorId: "",
                      })
                    }
                  }}
                  disabled={loading.patients || loading.doctors || loading.addPatient || loading.updatePatient}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-primary-foreground px-4 py-2 rounded-lg transition-colors text-sm sm:text-base font-medium cursor-pointer disabled:cursor-not-allowed"
                >
                  {loading.addPatient || loading.updatePatient ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {showForm ? "Cancel" : "Add Patient"}
                </button>
              )}
            </div>

            {incompleteCredentials.length > 0 && (
              <div className="mb-6 bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-destructive mb-1">Incomplete Patient Credentials</h3>
                  <p className="text-sm text-destructive/80">
                    {incompleteCredentials.length} patient(s) have missing critical information. Please update their
                    records.
                  </p>
                </div>
              </div>
            )}

            {showForm && user?.role !== "doctor" && (
              <div className="bg-card rounded-lg shadow-md border border-border p-6 mb-8">
                <h2 className="text-lg sm:text-xl font-bold mb-6 text-foreground">
                  {editingPatient ? "Edit Patient" : "Add New Patient"}
                </h2>
                <form onSubmit={handleAddPatient} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Full Name *"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm cursor-text"
                      required
                      disabled={loading.addPatient || loading.updatePatient}
                    />
                    <input
                      type="text"
                      placeholder="ID Number *"
                      value={formData.idNumber}
                      onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                      className="px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm cursor-text"
                      required
                      disabled={loading.addPatient || loading.updatePatient}
                    />
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-foreground mb-2">Phone Number *</label>
                      <PhoneInput
                        international
                        countryCallingCodeEditable={false}
                        defaultCountry="US"
                        value={formData.phone}
                        onChange={(value) => {
                          console.log("PhoneInput onChange:", value)
                          setFormData({ ...formData, phone: value || "" })
                        }}
                        onBlur={() => {
                          console.log("PhoneInput onBlur:", formData.phone)
                          if (formData.phone && formData.phone.trim()) {
                            const validation = validatePhoneInput(formData.phone)
                            if (!validation.valid) {
                              toast.error(validation.error)
                            }
                          }
                        }}
                        className="phone-input-wrapper"
                        disabled={loading.addPatient || loading.updatePatient}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Format: + followed by country code and number (e.g., +1234567890)
                      </p>
                    </div>
                    <input
                      type="email"
                      placeholder="Email"
                      value={formData.email || ""}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm cursor-text"
                      disabled={loading.addPatient || loading.updatePatient}
                    />
                    <input
                      type="date"
                      placeholder="Date of Birth *"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      className="px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm cursor-text"
                      required
                      disabled={loading.addPatient || loading.updatePatient}
                    />
                    <input
                      type="text"
                      placeholder="Address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm cursor-text"
                      disabled={loading.addPatient || loading.updatePatient}
                    />
                    <input
                      type="text"
                      placeholder="Insurance Provider"
                      value={formData.insuranceProvider}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          insuranceProvider: e.target.value,
                        })
                      }
                      className="px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm cursor-text"
                      disabled={loading.addPatient || loading.updatePatient}
                    />
                    <input
                      type="text"
                      placeholder="Insurance Number"
                      value={formData.insuranceNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          insuranceNumber: e.target.value,
                        })
                      }
                      className="px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm cursor-text"
                      disabled={loading.addPatient || loading.updatePatient}
                    />
                    <SearchableDropdown
                      items={doctors.map((doc) => ({
                        id: doc.id,
                        name: doc.name,
                        ...doc,
                      }))}
                      selectedItem={
                        formData.assignedDoctorId ? doctors.find((doc) => doc.id === formData.assignedDoctorId) : null
                      }
                      onSelect={(doctor) => {
                        console.log("[v0] Doctor selected:", doctor?.name)
                        setFormData({
                          ...formData,
                          assignedDoctorId: doctor ? doctor.id : "",
                        })
                      }}
                      placeholder="Select Doctor *"
                      searchPlaceholder="Search doctors..."
                      label="Assigned Doctor"
                      required
                      disabled={loading.addPatient || loading.updatePatient || loading.doctors}
                    />
                  </div>
                  <textarea
                    placeholder="Allergies (comma-separated)"
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm cursor-text disabled:cursor-not-allowed"
                    rows={2}
                    disabled={loading.addPatient || loading.updatePatient}
                  />
                  <textarea
                    placeholder="Medical Conditions (comma-separated)"
                    value={formData.medicalConditions}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        medicalConditions: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm cursor-text disabled:cursor-not-allowed"
                    rows={2}
                    disabled={loading.addPatient || loading.updatePatient}
                  />
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="submit"
                      disabled={loading.addPatient || loading.updatePatient}
                      className="flex items-center gap-2 bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-accent-foreground px-4 py-2 rounded-lg transition-colors text-sm font-medium cursor-pointer disabled:cursor-not-allowed"
                    >
                      {(loading.addPatient || loading.updatePatient) && <Loader2 className="w-4 h-4 animate-spin" />}
                      {editingPatient ? "Update Patient" : "Add Patient"}
                    </button>
                    {editingPatient && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPatient(null)
                          setShowForm(false)
                        }}
                        disabled={loading.addPatient || loading.updatePatient}
                        className="bg-muted hover:bg-muted/80 disabled:bg-muted/50 text-muted-foreground px-4 py-2 rounded-lg transition-colors text-sm font-medium cursor-pointer disabled:cursor-not-allowed"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            {/* Search and Controls */}
            <div className="bg-card rounded-lg shadow-md border border-border p-4 mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search patients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm"
                  />
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex items-center gap-2">
                    <label htmlFor="itemsPerPage" className="text-sm text-muted-foreground whitespace-nowrap">
                      Rows:
                    </label>
                    <select
                      id="itemsPerPage"
                      value={itemsPerPage}
                      onChange={(e) => setItemsPerPage(Number(e.target.value))}
                      className="px-2 py-1 bg-input border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary text-foreground text-sm"
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                    </select>
                  </div>

                  <button
                    onClick={fetchPatients}
                    disabled={loading.patients}
                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors font-medium text-sm disabled:opacity-50 cursor-pointer"
                  >
                    <Loader2 className={`w-4 h-4 ${loading.patients ? "animate-spin" : ""}`} />
                    {loading.patients ? "Loading..." : "Refresh"}
                  </button>
                </div>
              </div>
            </div>

            {/* Patients Table */}
            <div className="bg-card rounded-lg shadow-md border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted border-b border-border">
                    <tr>
                      <th className="text-left px-4 sm:px-6 py-3 font-semibold text-muted-foreground">Name</th>
                      <th className="text-left px-4 sm:px-6 py-3 font-semibold text-muted-foreground hidden sm:table-cell">
                        Phone
                      </th>
                      <th className="text-left px-4 sm:px-6 py-3 font-semibold text-muted-foreground hidden md:table-cell">
                        Doctor
                      </th>
                      <th className="text-left px-4 sm:px-6 py-3 font-semibold text-muted-foreground">Credentials</th>
                      <th className="text-left px-4 sm:px-6 py-3 font-semibold text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading.patients ? (
                      <tr>
                        <td colSpan={5} className="px-4 sm:px-6 py-8 text-center">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <div className="flex justify-center items-center gap-2">
                              <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
                              <div
                                className="w-3 h-3 bg-primary rounded-full animate-bounce"
                                style={{ animationDelay: "0.1s" }}
                              ></div>
                              <div
                                className="w-3 h-3 bg-primary rounded-full animate-bounce"
                                style={{ animationDelay: "0.2s" }}
                              ></div>
                            </div>
                            <span className="text-muted-foreground text-sm">Loading patients...</span>
                          </div>
                        </td>
                      </tr>
                    ) : currentPatients.length > 0 ? (
                      currentPatients.map((patient) => (
                        <tr key={patient._id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="px-4 sm:px-6 py-3 font-medium text-foreground">
                            <div>
                              <div className="sm:hidden text-xs text-muted-foreground mb-1">Name</div>
                              {patient.name}
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-muted-foreground hidden sm:table-cell">
                            <div>
                              <div className="md:hidden text-xs text-muted-foreground mb-1">Phone</div>
                              {formatPhoneForDisplay(patient.phone)}
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-muted-foreground hidden md:table-cell">
                            <div>
                              <div className="lg:hidden text-xs text-muted-foreground mb-1">Doctor</div>
                              {patient.assignedDoctorId?.name || "Unassigned"}
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-3">
                            <div>
                              <div className="sm:hidden text-xs text-muted-foreground mb-1">Credentials</div>
                              {patient.credentialStatus === "incomplete" ? (
                                <span className="flex items-center gap-1 text-destructive text-xs font-medium">
                                  <AlertCircle className="w-4 h-4" />
                                  Incomplete
                                </span>
                              ) : (
                                <span className="text-accent text-xs font-medium">Complete</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setSelectedPatient(patient)
                                  setMedicalFormData({
                                    medicalHistory: patient.medicalHistory || "",
                                    allergies: patient.allergies?.join(", ") || "",
                                    medicalConditions: patient.medicalConditions?.join(", ") || "",
                                  })
                                  fetchMedicalHistory(patient._id)
                                }}
                                disabled={loading.deletePatient || loading.addPatient || loading.updatePatient}
                                className="text-primary hover:text-primary/80 disabled:text-primary/50 transition-colors cursor-pointer disabled:cursor-not-allowed"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {user?.role !== "doctor" && (
                                <>
                                  <button
                                    onClick={() => handleEditPatient(patient)}
                                    disabled={loading.deletePatient || loading.addPatient || loading.updatePatient}
                                    className="text-accent hover:text-accent/80 disabled:text-accent/50 transition-colors cursor-pointer disabled:cursor-not-allowed"
                                    title="Edit"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setPatientToDelete(patient)
                                      setShowDeleteModal(true)
                                    }}
                                    disabled={loading.deletePatient || loading.addPatient || loading.updatePatient}
                                    className="text-destructive hover:text-destructive/80 disabled:text-destructive/50 transition-colors cursor-pointer disabled:cursor-not-allowed"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 sm:px-6 py-8 text-center text-muted-foreground">
                          {searchTerm ? "No patients found matching your search" : "No patients found"}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredPatients.length > 0 && (
                <div className="px-4 sm:px-6 py-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-muted-foreground">
                    Showing <span className="font-medium">{filteredPatients.length === 0 ? 0 : startIndex + 1}</span> to{" "}
                    <span className="font-medium">{Math.min(endIndex, filteredPatients.length)}</span> of{" "}
                    <span className="font-medium">{filteredPatients.length}</span> results
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded border border-border bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                        .map((page, index, array) => {
                          const showEllipsis = index < array.length - 1 && array[index + 1] - page > 1
                          return (
                            <div key={page} className="flex items-center">
                              <button
                                onClick={() => setCurrentPage(page)}
                                className={`min-w-[2rem] h-8 px-2 rounded text-sm font-medium transition-colors ${
                                  currentPage === page
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-background text-foreground hover:bg-muted border border-border"
                                }`}
                              >
                                {page}
                              </button>
                              {showEllipsis && <span className="px-1 text-muted-foreground">...</span>}
                            </div>
                          )
                        })}
                    </div>

                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages || totalPages === 0}
                      className="p-2 rounded border border-border bg-background hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Credential Warning Modal */}
            {showCredentialWarning && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-card rounded-lg shadow-lg border border-border p-6 max-w-md w-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-warning/20 rounded-full flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-warning" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Missing Patient Information</h3>
                      <p className="text-sm text-muted-foreground">The following information is missing:</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <ul className="space-y-2">
                      {credentialWarnings.map((warning, index) => (
                        <li key={index} className="flex items-center gap-2 text-warning">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />
                          <span className="text-sm">{warning}</span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-sm text-muted-foreground mt-4">
                      You can proceed to save the patient record, but it's recommended to complete all information for
                      better patient management.
                    </p>
                  </div>

                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={handleCancelWithWarnings}
                      className="px-4 py-2 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg transition-colors text-sm font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleProceedWithWarnings}
                      className="px-4 py-2 bg-warning hover:bg-warning/90 text-warning-foreground rounded-lg transition-colors text-sm font-medium cursor-pointer"
                    >
                      Proceed Anyway
                    </button>
                  </div>
                </div>
              </div>
            )}

            {selectedPatient && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-card rounded-lg shadow-lg border border-border p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground">{selectedPatient.name}</h2>
                    <button
                      onClick={() => {
                        setSelectedPatient(null)
                        setMedicalHistoryEntries([])
                      }}
                      disabled={loading.updateMedicalInfo}
                      className="text-muted-foreground hover:text-foreground disabled:text-muted-foreground/50 transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Phone</p>
                        <p className="text-foreground">{formatPhoneForDisplay(selectedPatient.phone)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Email</p>
                        <p className="text-foreground">{selectedPatient.email}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase">DOB</p>
                        <p className="text-foreground">{selectedPatient.dob}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase">ID Number</p>
                        <p className="text-foreground">{selectedPatient.idNumber || "Not provided"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Address</p>
                        <p className="text-foreground">{selectedPatient.address || "Not provided"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Insurance</p>
                        <p className="text-foreground">{selectedPatient.insuranceProvider}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Insurance Number</p>
                        <p className="text-foreground">{selectedPatient.insuranceNumber || "Not provided"}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Assigned Doctor</p>
                      <p className="text-foreground">{selectedPatient.assignedDoctorId?.name || "Unassigned"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Allergies</p>
                      <p className="text-foreground">{selectedPatient.allergies?.join(", ") || "None"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Medical Conditions</p>
                      <p className="text-foreground">{selectedPatient.medicalConditions?.join(", ") || "None"}</p>
                    </div>
                  </div>

                  <div className="mb-6 border-t border-border pt-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Medical History Entries</h3>
                    {loadingMedicalHistory ? (
                      <div className="flex justify-center items-center gap-2 py-4">
                        <div className="w-3 h-3 bg-primary rounded-full animate-bounce"></div>
                        <div
                          className="w-3 h-3 bg-primary rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-3 h-3 bg-primary rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    ) : medicalHistoryEntries.length > 0 ? (
                      <div className="space-y-4">
                        {medicalHistoryEntries.map((entry: any, index: number) => (
                          <div key={index} className="bg-muted/50 border border-border rounded-lg p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase">Date</p>
                                <p className="text-foreground text-sm">
                                  {entry.date ? new Date(entry.date).toLocaleDateString() : "N/A"}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase">Created By</p>
                                <p className="text-foreground text-sm">{entry.createdByName || "Unknown"}</p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              {entry.findings && (
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground uppercase">Findings</p>
                                  <p className="text-foreground text-sm">{entry.findings}</p>
                                </div>
                              )}
                              {entry.treatment && (
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground uppercase">Treatment</p>
                                  <p className="text-foreground text-sm">{entry.treatment}</p>
                                </div>
                              )}
                              {entry.medications && entry.medications.length > 0 && (
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground uppercase">Medications</p>
                                  <p className="text-foreground text-sm">{entry.medications.join(", ")}</p>
                                </div>
                              )}
                              {entry.notes && (
                                <div>
                                  <p className="text-xs font-semibold text-muted-foreground uppercase">Notes</p>
                                  <p className="text-foreground text-sm">{entry.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-muted/50 border border-border rounded-lg p-4 text-center">
                        <p className="text-muted-foreground text-sm">No medical history entries found</p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedPatient(null)
                      setMedicalHistoryEntries([])
                    }}
                    disabled={loading.updateMedicalInfo}
                    className="w-full bg-muted hover:bg-muted/80 disabled:bg-muted/50 text-muted-foreground px-4 py-2 rounded-lg transition-colors text-sm font-medium cursor-pointer disabled:cursor-not-allowed"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            <ConfirmDeleteModal
              isOpen={showDeleteModal}
              title="Delete Patient"
              description="Are you sure you want to delete this patient? This action cannot be undone and will remove all associated records including tooth charts, x-rays, medical reports, and appointments."
              itemName={patientToDelete?.name}
              onConfirm={() => {
                handleDeletePatient(patientToDelete._id)
                setShowDeleteModal(false)
                setPatientToDelete(null)
              }}
              onCancel={() => {
                setShowDeleteModal(false)
                setPatientToDelete(null)
              }}
              isLoading={loading.deletePatient}
            />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
