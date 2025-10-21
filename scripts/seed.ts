//@ts-nocheck
import { connectDB, User } from "../lib/db"

async function seedAdmin() {
  try {
    await connectDB()
    console.log("[v0] Connected to database")

    const adminExists = await User.findOne({ email: "admin@dentalcare.com" })
    if (adminExists) {
      console.log("[v0] Admin user already exists")
      return
    }

    await User.create({
      username: "admin",
      email: "admin@dentalcare.com",
      password: "Admin@123456", // password hashing should be handled in schema
      name: "Admin User",
      role: "admin",
      phone: "1234567890",
      active: true,
    })

    console.log("[v0] Admin user created successfully!")
    console.log("Email: admin@dentalcare.com")
    console.log("Password: Admin@123456")
  } catch (error) {
    console.error("[v0] Seed error:", error)
    process.exit(1)
  }
}

seedAdmin()
