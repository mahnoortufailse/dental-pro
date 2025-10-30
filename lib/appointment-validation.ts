//@ts-nocheck
import { Appointment } from "./db"

/**
 * Converts time string (HH:MM) to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

/**
 * Converts date and time to absolute minutes from epoch for cross-day comparison
 * @param date Date in YYYY-MM-DD format
 * @param time Time in HH:MM format
 * @returns Total minutes from a reference point
 */
function dateTimeToAbsoluteMinutes(date: string, time: string): number {
  const [year, month, day] = date.split("-").map(Number)
  const [hours, minutes] = time.split(":").map(Number)

  // Create a date object and get days since epoch
  const dateObj = new Date(year, month - 1, day)
  const daysSinceEpoch = Math.floor(dateObj.getTime() / (1000 * 60 * 60 * 24))

  // Return total minutes from epoch
  return daysSinceEpoch * 24 * 60 + hours * 60 + minutes
}

/**
 * Checks if two time ranges overlap, accounting for date boundaries
 * @param date1 Start date in YYYY-MM-DD format
 * @param start1 Start time in HH:MM format
 * @param duration1 Duration in minutes
 * @param date2 Start date in YYYY-MM-DD format
 * @param start2 Start time in HH:MM format
 * @param duration2 Duration in minutes
 * @returns true if ranges overlap
 */
function appointmentsOverlap(
  date1: string,
  start1: string,
  duration1: number,
  date2: string,
  start2: string,
  duration2: number,
): boolean {
  const start1Abs = dateTimeToAbsoluteMinutes(date1, start1)
  const end1Abs = start1Abs + duration1
  const start2Abs = dateTimeToAbsoluteMinutes(date2, start2)
  const end2Abs = start2Abs + duration2

  // Two ranges overlap if: start1 < end2 AND start2 < end1
  return start1Abs < end2Abs && start2Abs < end1Abs
}

/**
 * Formats absolute minutes back to readable time for error messages
 */
function formatAbsoluteMinutesToTime(absoluteMinutes: number): { date: string; time: string } {
  const minutesPerDay = 24 * 60

  const dayOffset = Math.floor(absoluteMinutes / minutesPerDay)
  const minutesInDay = absoluteMinutes % minutesPerDay

  const hours = Math.floor(minutesInDay / 60)
  const minutes = minutesInDay % 60

  const referenceDate = new Date(1970, 0, 1)
  const resultDate = new Date(referenceDate.getTime() + dayOffset * 24 * 60 * 60 * 1000)

  const year = resultDate.getFullYear()
  const month = String(resultDate.getMonth() + 1).padStart(2, "0")
  const day = String(resultDate.getDate()).padStart(2, "0")

  const time = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
  const date = `${year}-${month}-${day}`

  return { date, time }
}

/**
 * Validates appointment scheduling to prevent conflicts
 * Excludes cancelled and closed appointments from validation
 * Handles appointments that cross midnight boundaries
 * @param doctorId Doctor ID
 * @param date Appointment date (YYYY-MM-DD)
 * @param time Appointment time (HH:MM)
 * @param duration Duration in minutes
 * @param excludeAppointmentId Optional ID of appointment to exclude (for updates)
 * @returns Object with validation result and error message if any
 */
export async function validateAppointmentScheduling(
  doctorId: string,
  date: string,
  time: string,
  duration: number,
  excludeAppointmentId?: string,
): Promise<{ isValid: boolean; error?: string }> {
  try {
    console.log("[v0] ===== VALIDATION START =====")
    console.log("[v0] Input parameters:", { doctorId, date, time, duration, excludeAppointmentId })

    const query: any = {
      doctorId: doctorId.toString(),
    }

    // Exclude the current appointment if updating
    if (excludeAppointmentId) {
      query._id = { $ne: excludeAppointmentId }
    }

    console.log("[v0] MongoDB query (before status filter):", JSON.stringify(query))

    // Fetch ALL appointments first to debug
    const allAppointments = await Appointment.find(query).lean()
    console.log("[v0] Total appointments found for doctor:", allAppointments.length)
    console.log(
      "[v0] All appointments:",
      allAppointments.map((a) => ({
        id: a._id.toString(),
        status: a.status,
        date: a.date,
        time: a.time,
        duration: a.duration,
      })),
    )

    const activeAppointments = allAppointments.filter((apt) => {
      const isActive = apt.status !== "closed" && apt.status !== "cancelled" && apt.status !== "completed"
      console.log(`[v0] Appointment ${apt._id}: status="${apt.status}" -> isActive=${isActive}`)
      return isActive
    })

    console.log("[v0] Active appointments after filtering:", activeAppointments.length)
    console.log(
      "[v0] Active appointments details:",
      activeAppointments.map((a) => ({
        id: a._id.toString(),
        status: a.status,
        date: a.date,
        time: a.time,
        duration: a.duration,
      })),
    )

    // Check for conflicts with active appointments only
    for (const existing of activeAppointments) {
      const existingDuration = existing.duration || 30
      const newDuration = duration || 30

      console.log("[v0] Checking overlap with appointment:", {
        existingId: existing._id.toString(),
        existing: { date: existing.date, time: existing.time, duration: existingDuration, status: existing.status },
        new: { date, time, duration: newDuration },
      })

      if (appointmentsOverlap(date, time, newDuration, existing.date, existing.time, existingDuration)) {
        const newStartMin = dateTimeToAbsoluteMinutes(date, time)
        const newEndMin = newStartMin + newDuration
        const existingStartMin = dateTimeToAbsoluteMinutes(existing.date, existing.time)
        const existingEndMin = existingStartMin + existingDuration

        const newEndFormatted = formatAbsoluteMinutesToTime(newEndMin)
        const existingEndFormatted = formatAbsoluteMinutesToTime(existingEndMin)

        console.log("[v0] ❌ OVERLAP DETECTED!")
        console.log("[v0] Existing appointment end time:", existingEndFormatted)
        console.log("[v0] New appointment end time:", newEndFormatted)

        const errorMsg = `Doctor has a conflicting appointment from ${existing.time} to ${existingEndFormatted.time} on ${existing.date}. Your appointment would be from ${time} to ${newEndFormatted.time} on ${date}.`
        console.log("[v0] Error message:", errorMsg)
        console.log("[v0] ===== VALIDATION END (CONFLICT) =====")

        return {
          isValid: false,
          error: errorMsg,
        }
      }
    }

    console.log("[v0] ✅ No conflicts found - appointment is valid")
    console.log("[v0] ===== VALIDATION END (SUCCESS) =====")
    return { isValid: true }
  } catch (error) {
    console.error("[v0] ❌ Appointment validation error:", error)
    return {
      isValid: false,
      error: "Error validating appointment scheduling",
    }
  }
}
