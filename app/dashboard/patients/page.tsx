//@ts-nocheck
"use client"

import type React from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/components/auth-context"
import { useState, useEffect } from "react"
import toast from "react-hot-toast"

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
    insuranceProvider: "",
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
        console.log("[v0] Fetched patients:", data.patients)
        setPatients(data.patients || [])
      } else {
        try {
          const error = await res.json()
          console.error("[v0] Failed to fetch patients:", error)
          toast.error(error.error || "Failed to fetch patients")
        } catch {
          console.error("[v0] Failed to fetch patients - Invalid response")
          toast.error("Failed to fetch patients")
        }
      }
    } catch (error) {
      console.error("[v0] Failed to fetch patients:", error)
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
        console.log("[v0] Fetched doctors:", data.users)
        setDoctors(data.users || [])
      } else {
        try {
          const error = await res.json()
          console.error("[v0] Failed to fetch doctors:", error)
          toast.error(error.error || "Failed to fetch doctors")
        } catch {
          console.error("[v0] Failed to fetch doctors - Invalid response")
          toast.error("Failed to fetch doctors")
        }
      }
    } catch (error) {
      console.error("[v0] Failed to fetch doctors:", error)
      toast.error("Error fetching doctors")
    }
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
      console.error("[v0] Failed to delete patient:", error)
      toast.error("Error deleting patient")
    }
  }

  const handleEditPatient = (patient: any) => {
    setEditingPatient(patient._id)
    // When patient is populated, assignedDoctorId is an object with _id property
    // We need to find the matching doctor in the doctors list to get the correct id format
    let doctorId = ""
    if (patient.assignedDoctorId) {
      const assignedDoctor = doctors.find(
        (doc) =>
          doc.id === patient.assignedDoctorId._id?.toString() || doc._id === patient.assignedDoctorId._id?.toString(),
      )
      doctorId = assignedDoctor?.id || patient.assignedDoctorId._id?.toString() || ""
    }

    console.log("[v0] Edit patient - doctor ID set to:", doctorId, "from:", patient.assignedDoctorId)

    setFormData({
      name: patient.name,
      phone: patient.phone,
      email: patient.email,
      dob: patient.dob,
      insuranceProvider: patient.insuranceProvider,
      allergies: patient.allergies?.join(", ") || "",
      medicalConditions: patient.medicalConditions?.join(", ") || "",
      assignedDoctorId: doctorId,
    })
    setShowForm(true)
  }

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.phone || !formData.email || !formData.dob || !formData.insuranceProvider) {
      toast.error("Please fill in all required fields")
      return
    }

    if (!formData.assignedDoctorId) {
      toast.error("Please select a doctor")
      return
    }

    const selectedDoctor = doctors.find((doc) => doc.id === formData.assignedDoctorId)
    if (!selectedDoctor) {
      console.error("[v0] Selected doctor not found in doctors list:", formData.assignedDoctorId)
      toast.error("Invalid doctor selection. Please select a doctor from the list.")
      return
    }

    console.log("[v0] Submitting form with doctor ID:", formData.assignedDoctorId, "doctor name:", selectedDoctor.name)

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
        console.log("[v0] Patient saved:", data.patient)
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
          insuranceProvider: "",
          allergies: "",
          medicalConditions: "",
          assignedDoctorId: "",
        })
      } else {
        let errorMessage = "Failed to save patient"
        try {
          const error = await res.json()
          console.error("[v0] Failed to save patient:", error)
          errorMessage = error.error || error.message || errorMessage
        } catch (parseError) {
          console.error("[v0] Failed to save patient - Invalid response:", res.status, res.statusText)
          errorMessage = `Failed to save patient (${res.status})`
        }
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error("[v0] Failed to add patient:", error)
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
          console.error("[v0] Failed to update medical info:", error)
          errorMessage = error.error || error.message || errorMessage
        } catch (parseError) {
          console.error("[v0] Failed to update medical info - Invalid response:", res.status, res.statusText)
          errorMessage = `Failed to update medical info (${res.status})`
        }
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error("[v0] Failed to update medical info:", error)
      toast.error(error instanceof Error ? error.message : "Error updating medical info")
    }
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold">Patients</h1>
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
                        insuranceProvider: "",
                        allergies: "",
                        medicalConditions: "",
                        assignedDoctorId: "",
                      })
                    }
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {showForm ? "Cancel" : "Add Patient"}
                </button>
              )}
            </div>

            {showForm && user?.role !== "doctor" && (
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-xl font-bold mb-4">{editingPatient ? "Edit Patient" : "Add New Patient"}</h2>
                <form onSubmit={handleAddPatient} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Full Name *"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="tel"
                      placeholder="Phone *"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="email"
                      placeholder="Email *"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="date"
                      placeholder="Date of Birth *"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Insurance Provider *"
                      value={formData.insuranceProvider}
                      onChange={(e) => setFormData({ ...formData, insuranceProvider: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <select
                      value={formData.assignedDoctorId}
                      onChange={(e) => {
                        console.log("[v0] Doctor selected:", e.target.value)
                        setFormData({ ...formData, assignedDoctorId: e.target.value })
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <textarea
                    placeholder="Medical Conditions (comma-separated)"
                    value={formData.medicalConditions}
                    onChange={(e) => setFormData({ ...formData, medicalConditions: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
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
                        className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="text-left px-6 py-3 font-semibold">Name</th>
                    <th className="text-left px-6 py-3 font-semibold">Phone</th>
                    <th className="text-left px-6 py-3 font-semibold">Email</th>
                    <th className="text-left px-6 py-3 font-semibold">Assigned Doctor</th>
                    <th className="text-left px-6 py-3 font-semibold">Status</th>
                    <th className="text-left px-6 py-3 font-semibold">Credentials</th>
                    <th className="text-left px-6 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.length > 0 ? (
                    patients.map((patient) => (
                      <tr key={patient._id} className="border-b hover:bg-gray-50">
                        <td className="px-6 py-3">{patient.name}</td>
                        <td className="px-6 py-3">{patient.phone}</td>
                        <td className="px-6 py-3">{patient.email}</td>
                        <td className="px-6 py-3">{patient.assignedDoctorId?.name || "Unassigned"}</td>
                        <td className="px-6 py-3">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                            {patient.status}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          {patient.credentialStatus === "incomplete" && (
                            <span className="text-yellow-600">⚠️ Incomplete</span>
                          )}
                          {patient.credentialStatus === "complete" && (
                            <span className="text-green-600">✓ Complete</span>
                          )}
                        </td>
                        <td className="px-6 py-3 space-x-2">
                          <button
                            onClick={() => {
                              setSelectedPatient(patient)
                              setMedicalFormData({
                                medicalHistory: patient.medicalHistory || "",
                                allergies: patient.allergies?.join(", ") || "",
                                medicalConditions: patient.medicalConditions?.join(", ") || "",
                              })
                            }}
                            className="text-blue-600 hover:underline text-sm"
                          >
                            View
                          </button>
                          {user?.role !== "doctor" && (
                            <>
                              <button
                                onClick={() => handleEditPatient(patient)}
                                className="text-green-600 hover:underline text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeletePatient(patient._id)}
                                className="text-red-600 hover:underline text-sm"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-3 text-center text-gray-500">
                        No patients found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {selectedPatient && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
                  <h2 className="text-xl font-bold mb-4">{selectedPatient.name}</h2>
                  <div className="space-y-2 mb-4">
                    <p>
                      <strong>Phone:</strong> {selectedPatient.phone}
                    </p>
                    <p>
                      <strong>Email:</strong> {selectedPatient.email}
                    </p>
                    <p>
                      <strong>DOB:</strong> {selectedPatient.dob}
                    </p>
                    <p>
                      <strong>Insurance:</strong> {selectedPatient.insuranceProvider}
                    </p>
                    <p>
                      <strong>Assigned Doctor:</strong> {selectedPatient.assignedDoctorId?.name || "Unassigned"}
                    </p>
                    <p>
                      <strong>Allergies:</strong> {selectedPatient.allergies?.join(", ") || "None"}
                    </p>
                    <p>
                      <strong>Medical Conditions:</strong> {selectedPatient.medicalConditions?.join(", ") || "None"}
                    </p>
                    <p>
                      <strong>Medical History:</strong> {selectedPatient.medicalHistory || "No history recorded"}
                    </p>
                    <p>
                      <strong>Doctor History:</strong>
                    </p>
                    <ul className="ml-4">
                      {selectedPatient.doctorHistory?.map((history, idx) => (
                        <li key={idx} className="text-sm text-gray-600">
                          {history.doctorName} - {new Date(history.startDate).toLocaleDateString()}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {user?.role === "doctor" && !editingMedicalInfo && (
                    <button
                      onClick={() => setEditingMedicalInfo(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mr-2"
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
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                      />
                      <textarea
                        placeholder="Allergies (comma-separated)"
                        value={medicalFormData.allergies}
                        onChange={(e) => setMedicalFormData({ ...medicalFormData, allergies: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <textarea
                        placeholder="Medical Conditions (comma-separated)"
                        value={medicalFormData.medicalConditions}
                        onChange={(e) => setMedicalFormData({ ...medicalFormData, medicalConditions: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                        >
                          Save Changes
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingMedicalInfo(false)}
                          className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  <button
                    onClick={() => setSelectedPatient(null)}
                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400"
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
