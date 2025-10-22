//@ts-nocheck
"use client"

import type React from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/components/auth-context"
import { useState, useEffect } from "react"
import { toast } from "react-hot-toast"
import { AlertCircle, Plus, Edit2, Trash2, Eye, X } from "lucide-react"

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
    idNumber: "", // added ID number field for credential tracking
    address: "", // added address field for credential tracking
    insuranceProvider: "",
    insuranceNumber: "", // added insurance number field for credential tracking
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

  useEffect(() => {
    if (token) {
      fetchPatients()
      if (user?.role !== "doctor") {
        fetchDoctors()
      }
    }
  }, [token, user?.role])

  const fetchPatients = async () => {
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
    }
  }

  const fetchDoctors = async () => {
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
    }
  }

  const validatePatientCredentials = (data: any) => {
    const missingCredentials: string[] = []
    const warnings: string[] = []

    // Critical credentials
    if (!data.idNumber?.trim()) missingCredentials.push("ID Number")
    if (!data.phone?.trim()) missingCredentials.push("Phone Number")
    if (!data.email?.trim()) missingCredentials.push("Email Address")
    if (!data.dob?.trim()) missingCredentials.push("Date of Birth")

    // Important credentials
    if (!data.insuranceProvider?.trim()) warnings.push("Insurance Provider")
    if (!data.insuranceNumber?.trim()) warnings.push("Insurance Number")
    if (!data.address?.trim()) warnings.push("Address")

    return { isComplete: missingCredentials.length === 0, missingCredentials, warnings }
  }

  const handleDeletePatient = async (patientId: string) => {
    if (!window.confirm("Are you sure you want to delete this patient?")) return

    try {
      const res = await fetch(`/api/patients/${patientId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        setPatients(patients.filter((p) => p._id !== patientId))
        toast.success("Patient deleted successfully")
      } else {
        const error = await res.json()
        toast.error(error.error || "Failed to delete patient")
      }
    } catch (error) {
      toast.error("Error deleting patient")
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

    setFormData({
      name: patient.name,
      phone: patient.phone,
      email: patient.email,
      dob: patient.dob,
      idNumber: patient.idNumber || "", // populate ID number
      address: patient.address || "", // populate address
      insuranceProvider: patient.insuranceProvider,
      insuranceNumber: patient.insuranceNumber || "", // populate insurance number
      allergies: patient.allergies?.join(", ") || "",
      medicalConditions: patient.medicalConditions?.join(", ") || "",
      assignedDoctorId: doctorId,
    })
    setShowForm(true)
  }

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault()

    const validation = validatePatientCredentials(formData)

    if (validation.missingCredentials.length > 0) {
      toast.error(`Missing critical credentials: ${validation.missingCredentials.join(", ")}`)
      return
    }

    if (!formData.assignedDoctorId) {
      toast.error("Please select a doctor")
      return
    }

    const selectedDoctor = doctors.find((doc) => doc.id === formData.assignedDoctorId)
    if (!selectedDoctor) {
      toast.error("Invalid doctor selection. Please select a doctor from the list.")
      return
    }

    if (validation.warnings.length > 0) {
      const proceed = window.confirm(`Warning: Missing ${validation.warnings.join(", ")}. Do you want to continue?`)
      if (!proceed) return
    }

    try {
      const method = editingPatient ? "PUT" : "POST"
      const url = editingPatient ? `/api/patients/${editingPatient}` : "/api/patients"

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
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
          toast.success("Patient updated successfully")
          setEditingPatient(null)
        } else {
          setPatients([...patients, data.patient])
          toast.success("Patient added successfully")
        }

        setShowForm(false)
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
      } else {
        let errorMessage = "Failed to save patient"
        try {
          const error = await res.json()
          errorMessage = error.error || error.message || errorMessage
        } catch (parseError) {
          errorMessage = `Failed to save patient (${res.status})`
        }
        toast.error(errorMessage)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error saving patient")
    }
  }

  const handleUpdateMedicalInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient) return

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
    }
  }

  const incompleteCredentials = patients.filter((p) => p.credentialStatus === "incomplete")

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="flex-1 overflow-auto md:pt-0 pt-16">
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
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
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors text-sm sm:text-base font-medium"
                >
                  <Plus className="w-4 h-4" />
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

            {/* Add/Edit Form */}
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
                      className="px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm"
                      required
                    />
                    <input
                      type="text"
                      placeholder="ID Number *"
                      value={formData.idNumber}
                      onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                      className="px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm"
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Phone *"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm"
                      required
                    />
                    <input
                      type="email"
                      placeholder="Email *"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm"
                      required
                    />
                    <input
                      type="date"
                      placeholder="Date of Birth *"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      className="px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Insurance Provider *"
                      value={formData.insuranceProvider}
                      onChange={(e) => setFormData({ ...formData, insuranceProvider: e.target.value })}
                      className="px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Insurance Number"
                      value={formData.insuranceNumber}
                      onChange={(e) => setFormData({ ...formData, insuranceNumber: e.target.value })}
                      className="px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm"
                    />
                    <select
                      value={formData.assignedDoctorId}
                      onChange={(e) => setFormData({ ...formData, assignedDoctorId: e.target.value })}
                      className="px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                      required
                    >
                      <option value="">Select Doctor *</option>
                      {doctors.length > 0 ? (
                        doctors.map((doc) => (
                          <option key={doc.id} value={doc.id}>
                            {doc.name}
                          </option>
                        ))
                      ) : (
                        <option disabled>No doctors available</option>
                      )}
                    </select>
                  </div>
                  <textarea
                    placeholder="Allergies (comma-separated)"
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm"
                    rows={2}
                  />
                  <textarea
                    placeholder="Medical Conditions (comma-separated)"
                    value={formData.medicalConditions}
                    onChange={(e) => setFormData({ ...formData, medicalConditions: e.target.value })}
                    className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm"
                    rows={2}
                  />
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="submit"
                      className="bg-accent hover:bg-accent/90 text-accent-foreground px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                    >
                      {editingPatient ? "Update Patient" : "Add Patient"}
                    </button>
                    {editingPatient && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPatient(null)
                          setShowForm(false)
                        }}
                        className="bg-muted hover:bg-muted/80 text-muted-foreground px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

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
                    {patients.length > 0 ? (
                      patients.map((patient) => (
                        <tr key={patient._id} className="border-b border-border hover:bg-muted/50 transition-colors">
                          <td className="px-4 sm:px-6 py-3 font-medium text-foreground">{patient.name}</td>
                          <td className="px-4 sm:px-6 py-3 text-muted-foreground hidden sm:table-cell">
                            {patient.phone}
                          </td>
                          <td className="px-4 sm:px-6 py-3 text-muted-foreground hidden md:table-cell">
                            {patient.assignedDoctorId?.name || "Unassigned"}
                          </td>
                          <td className="px-4 sm:px-6 py-3">
                            {patient.credentialStatus === "incomplete" ? (
                              <span className="flex items-center gap-1 text-destructive text-xs font-medium">
                                <AlertCircle className="w-4 h-4" />
                                Incomplete
                              </span>
                            ) : (
                              <span className="text-accent text-xs font-medium">Complete</span>
                            )}
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
                                }}
                                className="text-primary hover:text-primary/80 transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {user?.role !== "doctor" && (
                                <>
                                  <button
                                    onClick={() => handleEditPatient(patient)}
                                    className="text-accent hover:text-accent/80 transition-colors"
                                    title="Edit"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeletePatient(patient._id)}
                                    className="text-destructive hover:text-destructive/80 transition-colors"
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
                          No patients found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Patient Detail Modal */}
            {selectedPatient && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <div className="bg-card rounded-lg shadow-lg border border-border p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground">{selectedPatient.name}</h2>
                    <button
                      onClick={() => setSelectedPatient(null)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Phone</p>
                        <p className="text-foreground">{selectedPatient.phone}</p>
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
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Medical History</p>
                      <p className="text-foreground">{selectedPatient.medicalHistory || "No history recorded"}</p>
                    </div>
                  </div>

                  {user?.role === "doctor" && !editingMedicalInfo && (
                    <button
                      onClick={() => setEditingMedicalInfo(true)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg transition-colors text-sm font-medium mb-4"
                    >
                      Edit Medical Info
                    </button>
                  )}

                  {editingMedicalInfo && user?.role === "doctor" && (
                    <form onSubmit={handleUpdateMedicalInfo} className="space-y-4 mb-4">
                      <textarea
                        placeholder="Medical History"
                        value={medicalFormData.medicalHistory}
                        onChange={(e) => setMedicalFormData({ ...medicalFormData, medicalHistory: e.target.value })}
                        className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm"
                        rows={3}
                      />
                      <textarea
                        placeholder="Allergies (comma-separated)"
                        value={medicalFormData.allergies}
                        onChange={(e) => setMedicalFormData({ ...medicalFormData, allergies: e.target.value })}
                        className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm"
                      />
                      <textarea
                        placeholder="Medical Conditions (comma-separated)"
                        value={medicalFormData.medicalConditions}
                        onChange={(e) => setMedicalFormData({ ...medicalFormData, medicalConditions: e.target.value })}
                        className="w-full px-4 py-2 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder-muted-foreground text-sm"
                      />
                      <div className="flex gap-2 flex-wrap">
                        <button
                          type="submit"
                          className="bg-accent hover:bg-accent/90 text-accent-foreground px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                        >
                          Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingMedicalInfo(false)}
                          className="bg-muted hover:bg-muted/80 text-muted-foreground px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  <button
                    onClick={() => setSelectedPatient(null)}
                    className="w-full bg-muted hover:bg-muted/80 text-muted-foreground px-4 py-2 rounded-lg transition-colors text-sm font-medium"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
