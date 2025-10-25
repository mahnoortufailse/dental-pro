//@ts-nocheck
import mongoose from "mongoose"
import { hashPassword } from "./encryption"
import dotenv from "dotenv"

dotenv.config()
const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  throw new Error("Please add your MONGODB_URI to environment variables")
}

// Define Schemas
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, sparse: true },
  password: { type: String, required: true }, // Will be hashed
  name: { type: String, required: true },
  role: { type: String, enum: ["admin", "doctor", "receptionist", "staff"], required: true },
  phone: String,
  specialty: String,
  active: { type: Boolean, default: true },
  resetToken: { type: String, default: null },
  resetTokenExpiry: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
})

userSchema.index({ email: 1 }, { unique: true, sparse: true })

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()
  try {
    this.password = await hashPassword(this.password)
    next()
  } catch (error) {
    next(error)
  }
})

const patientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true, unique: true, sparse: true },
  dob: { type: String, required: true },
  idNumber: { type: String },
  address: { type: String },
  insuranceProvider: String,
  insuranceNumber: String,
  allergies: [String],
  medicalConditions: [String],
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  balance: { type: Number, default: 0 },
  lastVisit: Date,
  nextAppt: Date,
  password: { type: String, required: true },
  assignedDoctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  doctorHistory: [
    {
      doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      doctorName: String,
      startDate: Date,
      endDate: Date,
    },
  ],
  medicalHistory: String,
  credentialStatus: { type: String, enum: ["complete", "incomplete"], default: "incomplete" },
  missingCredentials: [String],
  resetToken: { type: String, default: null },
  resetTokenExpiry: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
})

patientSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()
  try {
    this.password = await hashPassword(this.password)
    next()
  } catch (error) {
    next(error)
  }
})

const appointmentSchema = new mongoose.Schema({
  patientId: { type: String, required: true },
  patientName: { type: String, required: true },
  doctorId: { type: String, required: true },
  doctorName: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  type: { type: String, enum: ["Consultation", "Cleaning", "Filling", "Root Canal"], required: true },
  status: { type: String, enum: ["pending", "confirmed", "completed"], default: "pending" },
  chair: String,
  duration: Number,
  createdAt: { type: Date, default: Date.now },
})

const toothChartSchema = new mongoose.Schema({
  patientId: { type: String, required: true },
  doctorId: { type: String, required: true },
  teeth: mongoose.Schema.Types.Mixed,
  overallNotes: String,
  lastReview: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

const billingSchema = new mongoose.Schema({
  patientId: { type: String, required: true },
  appointmentId: String,
  treatments: [
    {
      name: String,
      cost: Number,
      quantity: Number,
    },
  ],
  totalAmount: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ["Pending", "Paid", "Partially Paid"], default: "Pending" },
  paymentDate: Date,
  notes: String,
  createdBy: String,
  createdAt: { type: Date, default: Date.now },
})

const inventorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  minStock: { type: Number, required: true },
  unit: String,
  supplier: String,
  lastRestocked: Date,
  createdAt: { type: Date, default: Date.now },
})

const medicalHistorySchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  entries: [
    {
      date: { type: Date, default: Date.now },
      notes: String,
      findings: String,
      treatment: String,
      medications: [String],
      doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

const patientImageSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  type: { type: String, enum: ["xray", "photo", "scan"], required: true },
  title: String,
  description: String,
  imageUrl: String,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  uploadedAt: { type: Date, default: Date.now },
  notes: String,
})

const appointmentReportSchema = new mongoose.Schema({
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  procedures: [
    {
      name: String,
      description: String,
      tooth: String,
      status: String,
    },
  ],
  findings: String,
  notes: String,
  nextVisit: Date,
  followUpDetails: String,
  createdAt: { type: Date, default: Date.now },
})

// Create or get models
export const User = mongoose.models.User || mongoose.model("User", userSchema)
export const Patient = mongoose.models.Patient || mongoose.model("Patient", patientSchema)
export const Appointment = mongoose.models.Appointment || mongoose.model("Appointment", appointmentSchema)
export const ToothChart = mongoose.models.ToothChart || mongoose.model("ToothChart", toothChartSchema)
export const Billing = mongoose.models.Billing || mongoose.model("Billing", billingSchema)
export const Inventory = mongoose.models.Inventory || mongoose.model("Inventory", inventorySchema)

export const MedicalHistory = mongoose.models.MedicalHistory || mongoose.model("MedicalHistory", medicalHistorySchema)
export const PatientImage = mongoose.models.PatientImage || mongoose.model("PatientImage", patientImageSchema)
export const AppointmentReport =
  mongoose.models.AppointmentReport || mongoose.model("AppointmentReport", appointmentReportSchema)

// Connect to MongoDB
const cached = global as any

if (!cached.mongoose) {
  cached.mongoose = { conn: null, promise: null }
}

export async function connectDB() {
  if (cached.mongoose.conn) {
    return cached.mongoose.conn
  }

  if (!cached.mongoose.promise) {
    cached.mongoose.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
      })
      .then((mongoose) => {
        return mongoose
      })
  }

  try {
    cached.mongoose.conn = await cached.mongoose.promise
  } catch (e) {
    cached.mongoose.promise = null
    throw e
  }

  return cached.mongoose.conn
}

// Initialize default users
export async function initializeDB() {
  try {
    await connectDB()

    const adminExists = await User.findOne({ email: "admin@dentalcare.com" })
    if (!adminExists) {
      const createdUsers = await User.create([
        {
          email: "admin@dentalcare.com",
          password: "Admin@123456", // Will be hashed by pre-save hook
          name: "Admin User",
          role: "admin",
          phone: "1234567890",
          active: true,
        },
        {
          email: "doctor@dentalcare.com",
          password: "Doctor@123456", // Will be hashed by pre-save hook
          name: "Dr. John Smith",
          role: "doctor",
          phone: "1234567891",
          specialty: "General Dentistry",
          active: true,
        },
        {
          email: "receptionist@dentalcare.com",
          password: "Receptionist@123456", // Will be hashed by pre-save hook
          name: "Jane Doe",
          role: "receptionist",
          phone: "1234567892",
          active: true,
        },
      ])

      const doctor = createdUsers.find((u) => u.role === "doctor")
      if (doctor) {
        const patientExists = await Patient.findOne({ email: "john@example.com" })
        if (!patientExists) {
          await Patient.create({
            name: "John Doe",
            phone: "9876543210",
            email: "john@example.com",
            dob: "1990-05-15",
            idNumber: "ID123456",
            address: "123 Main St, City, State",
            insuranceProvider: "Blue Cross",
            insuranceNumber: "BC123456789",
            allergies: ["Penicillin"],
            medicalConditions: ["Diabetes"],
            status: "active",
            balance: 500,
            assignedDoctorId: doctor._id,
            doctorHistory: [{ doctorId: doctor._id, doctorName: doctor.name, startDate: new Date() }],
            medicalHistory: "Patient has diabetes, monitor blood sugar levels",
            credentialStatus: "complete",
            missingCredentials: [],
          })
        }
      }
    }

    const inventoryExists = await Inventory.findOne({ name: "Dental Filling Material" })
    if (!inventoryExists) {
      await Inventory.create([
        {
          name: "Dental Filling Material",
          quantity: 50,
          minStock: 10,
          unit: "units",
          supplier: "Dental Supplies Inc",
          lastRestocked: new Date(),
        },
        {
          name: "Anesthetic Injection",
          quantity: 5,
          minStock: 20,
          unit: "boxes",
          supplier: "Medical Supplies Co",
          lastRestocked: new Date(),
        },
      ])
    }
  } catch (error) {
    console.error("Database initialization error:", error)
  }
}
