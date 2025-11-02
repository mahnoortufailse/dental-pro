"use client"

import { useState } from "react"
import { Copy, ExternalLink, Loader } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function TestReportLinkPage() {
  const [appointmentId, setAppointmentId] = useState("")
  const [loading, setLoading] = useState(false)
  const [link, setLink] = useState("")
  const [error, setError] = useState("")
  const [copied, setCopied] = useState(false)

  const generateLink = async () => {
    if (!appointmentId.trim()) {
      setError("Please enter an appointment ID")
      return
    }

    try {
      setLoading(true)
      setError("")
      setLink("")

      const response = await fetch("/api/test/generate-report-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: appointmentId.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to generate link")
        return
      }

      setLink(data.link)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-card rounded-lg shadow-lg border border-border p-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Test Medical Report Link</h1>
          <p className="text-muted-foreground mb-6">
            Generate a public link to view and download a patient's medical report without authentication.
          </p>

          <div className="space-y-4">
            {/* Input Section */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Appointment ID</label>
              <Input
                placeholder="Enter the appointment ID (e.g., 507f1f77bcf86cd799439011)"
                value={appointmentId}
                onChange={(e) => setAppointmentId(e.target.value)}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Find the appointment ID in your database or from the appointment details page.
              </p>
            </div>

            {/* Generate Button */}
            <Button onClick={generateLink} disabled={loading} className="w-full" size="lg">
              {loading ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Generating Link...
                </>
              ) : (
                "Generate Public Link"
              )}
            </Button>

            {/* Error Message */}
            {error && (
              <div className="bg-destructive/10 border border-destructive rounded-lg p-4">
                <p className="text-destructive text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Link Display */}
            {link && (
              <div className="space-y-3">
                <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-xs font-semibold text-green-900 dark:text-green-300 uppercase tracking-wide mb-2">
                    Success
                  </p>
                  <p className="text-sm text-green-800 dark:text-green-200">Report link generated successfully!</p>
                </div>

                {/* Link Display Box */}
                <div className="bg-muted rounded-lg p-4 border border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Public Report Link
                  </p>
                  <div className="flex items-center gap-2 break-all font-mono text-sm bg-background rounded p-2">
                    <code className="flex-1 text-foreground">{link}</code>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button onClick={copyToClipboard} variant="outline" className="flex-1 bg-transparent">
                    <Copy className="w-4 h-4 mr-2" />
                    {copied ? "Copied!" : "Copy Link"}
                  </Button>
                  <Button onClick={() => window.open(link, "_blank")} className="flex-1">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open in Browser
                  </Button>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-xs font-semibold text-blue-900 dark:text-blue-300 uppercase tracking-wide mb-2">
                    How to Test
                  </p>
                  <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                    <li>Copy the link using the button above</li>
                    <li>Paste it in your browser's address bar</li>
                    <li>View the medical report without logging in</li>
                    <li>Click "Download PDF" to download the report</li>
                  </ol>
                </div>
              </div>
            )}
          </div>

          {/* Instructions Section */}
          <div className="mt-8 pt-8 border-t border-border">
            <h2 className="text-lg font-semibold text-foreground mb-4">How to Use</h2>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground mb-1">1. Get Appointment ID</p>
                <p>
                  Go to your dashboard appointments page, click on an appointment with a medical report, and copy the ID
                  from the URL or details.
                </p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">2. Generate Link</p>
                <p>Paste the appointment ID above and click "Generate Public Link"</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">3. Open Link</p>
                <p>Click "Open in Browser" or copy and paste the link in a new tab</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">4. Download PDF</p>
                <p>The report page will load. Click "Download PDF" to save the report as a PDF file.</p>
              </div>
            </div>
          </div>

          {/* Security Note */}
          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-xs font-semibold text-amber-900 dark:text-amber-300 uppercase tracking-wide mb-1">
              Security Note
            </p>
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Each link is encrypted and unique to one appointment. Only share links with the actual patient via
              WhatsApp.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
