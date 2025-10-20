//@ts-nocheck
"use client"

import type React from "react"

import { ProtectedRoute } from "@/components/protected-route"
import { Sidebar } from "@/components/sidebar"
import { useAuth } from "@/components/auth-context"
import { useState, useEffect } from "react"
import toast from "react-hot-toast"

export default function AppointmentsPage() {
  const { user, token } = useAuth()
  const [appointments, setAppointments] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    patientId: "",
    patientName: "",
    doctorId: "",
    doctorName: "",
    date: "",
    time: "",
    type: "Consultation",
    chair: "",
    duration: 30,
  })
  const [patients, setPatients] = useState([])
  const [doctors, setDoctors] = useState([])

  useEffect(() => {
    if (token) {
      fetchAppointments()
      if (user?.role !== "doctor") {
        fetchPatients()
        fetchDoctors()
      }
    }
  }, [token, user])

  const fetchAppointments = async () => {
    try {
      const res = await fetch("/api/appointments", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setAppointments(data.appointments || [])
      }
    } catch (error) {
      console.error("Failed to fetch appointments:", error)
    }
  }

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
      console.error("Failed to fetch patients:", error)
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
      }
    } catch (error) {
      console.error("Failed to fetch doctors:", error)
    }
  }

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!window.confirm("Are you sure you want to delete this appointment?")) return

    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        setAppointments(appointments.filter((a) => a._id !== appointmentId && a.id !== appointmentId))
        toast.success("Appointment deleted successfully")
      } else {
        toast.error("Failed to delete appointment")
      }
    } catch (error) {
      console.error("Failed to delete appointment:", error)
      toast.error("Error deleting appointment")
    }
  }

  const handleEditAppointment = (appointment: any) => {
    setEditingId(appointment._id || appointment.id)
    setFormData({
      patientId: appointment.patientId,
      patientName: appointment.patientName,
      doctorId: appointment.doctorId,
      doctorName: appointment.doctorName,
      date: appointment.date,
      time: appointment.time,
      type: appointment.type,
      chair: appointment.chair,
      duration: appointment.duration,
    })
    setShowForm(true)
  }

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Sending appointment data:", formData)
    try {
      const method = editingId ? "PUT" : "POST"
      const url = editingId ? `/api/appointments/${editingId}` : "/api/appointments"

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        const data = await res.json()
        if (editingId) {
          setAppointments(appointments.map((a) => (a._id === editingId || a.id === editingId ? data.appointment : a)))
          toast.success("Appointment updated successfully")
          setEditingId(null)
        } else {
          setAppointments([...appointments, data.appointment])
          toast.success("Appointment scheduled successfully")
        }
        setShowForm(false)
        setFormData({
          patientId: "",
          patientName: "",
          doctorId: "",
          doctorName: "",
          date: "",
          time: "",
          type: "Consultation",
          chair: "",
          duration: 30,
        })
      } else {
        toast.error("Failed to save appointment")
      }
    } catch (error) {
      console.error("Failed to add appointment:", error)
      toast.error("Error saving appointment")
    }
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold">Appointments</h1>
              {user?.role !== "doctor" && (
                <button
                  onClick={() => {
                    setEditingId(null)
                    setShowForm(!showForm)
                    if (!showForm) {
                      setFormData({
                        patientId: "",
                        patientName: "",
                        doctorId: "",
                        doctorName: "",
                        date: "",
                        time: "",
                        type: "Consultation",
                        chair: "",
                        duration: 30,
                      })
                    }
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {showForm ? "Cancel" : "Schedule Appointment"}
                </button>
              )}
            </div>

            {showForm && user?.role !== "doctor" && (
              <div className="bg-white rounded-lg shadow p-6 mb-8">
                <h2 className="text-xl font-bold mb-4">
                  {editingId ? "Edit Appointment" : "Schedule New Appointment"}
                </h2>
                <form onSubmit={handleAddAppointment} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <select
                      value={formData.patientId}
                      onChange={(e) => {
                        const patient = patients.find((p) => p._id === e.target.value)
                        setFormData({
                          ...formData,
                          patientId: e.target.value,
                          patientName: patient?.name || "",
                        })
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Patient</option>
                      {patients.map((p, index) => (
                        <option key={p._id || index} value={p._id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                    <select
                      value={formData.doctorId}
                      onChange={(e) => {
                        const selectedId = e.target.value
                        const doctor = doctors.find((d) => d.id === selectedId)
                        console.log("Selected doctor:", doctor)
                        setFormData({
                          ...formData,
                          doctorId: selectedId,
                          doctorName: doctor?.name || "",
                        })
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Doctor</option>
                      {doctors.map((d, index) => (
                        <option key={d.id || index} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>

                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Consultation">Consultation</option>
                      <option value="Cleaning">Cleaning</option>
                      <option value="Filling">Filling</option>
                      <option value="Root Canal">Root Canal</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Chair (e.g., Chair 1)"
                      value={formData.chair}
                      onChange={(e) => setFormData({ ...formData, chair: e.target.value })}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      {editingId ? "Update Appointment" : "Schedule Appointment"}
                    </button>
                    {editingId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null)
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
                    <th className="text-left px-6 py-3 font-semibold">Date</th>
                    <th className="text-left px-6 py-3 font-semibold">Time</th>
                    <th className="text-left px-6 py-3 font-semibold">Patient</th>
                    <th className="text-left px-6 py-3 font-semibold">Doctor</th>
                    <th className="text-left px-6 py-3 font-semibold">Type</th>
                    <th className="text-left px-6 py-3 font-semibold">Chair</th>
                    <th className="text-left px-6 py-3 font-semibold">Status</th>
                    <th className="text-left px-6 py-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((apt) => (
                    <tr key={apt._id || apt.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-3">{apt.date}</td>
                      <td className="px-6 py-3">{apt.time}</td>
                      <td className="px-6 py-3">{apt.patientName}</td>
                      <td className="px-6 py-3">{apt.doctorName}</td>
                      <td className="px-6 py-3">{apt.type}</td>
                      <td className="px-6 py-3">{apt.chair}</td>
                      <td className="px-6 py-3">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">{apt.status}</span>
                      </td>
                      <td className="px-6 py-3 space-x-2">
                        {user?.role !== "doctor" && (
                          <>
                            <button
                              onClick={() => handleEditAppointment(apt)}
                              className="text-green-600 hover:underline text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteAppointment(apt._id || apt.id)}
                              className="text-red-600 hover:underline text-sm"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}
