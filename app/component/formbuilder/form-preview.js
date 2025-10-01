"use client"

import { useForm } from "@tanstack/react-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
// import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, CheckCircle2, Send } from "lucide-react"
import { FieldRenderer } from "./field-renderer"

export function FormPreview({ fields }) {
  const form = useForm({
    defaultValues: fields.reduce((acc, field) => {
      acc[field.id] =
        field.type === "checkbox" || (field.type === "select" && field.validation?.multiple)
          ? []
          : field.type === "file"
            ? null
            : field.type === "location"
              ? {}
              : field.type === "phone"
                ? {} // phone stores { country, number }
                : ""
      return acc
    }, {}),
    onSubmit: async ({ value }) => {
      // Simulate form submission
      console.log("Form submitted:", value)
      // toast({ title: "Submitted", description: "Form submitted successfully." })
    },
  })

  // const { toast } = useToast()

  const base64urlEncode = (input) => {
    const b64 = typeof window !== "undefined" ? window.btoa(input) : ""
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
  }

  const handleGenerateLink = async () => {
    try {
      const payload = { fields }
      const json = JSON.stringify(payload)
      const base64 = base64urlEncode(encodeURIComponent(json))
      const origin = typeof window !== "undefined" ? window.location.origin : ""
      const url = `${origin}/p/${base64}`
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(url)
        // toast({ title: "Link copied", description: "Public form link copied to clipboard." })
      } else {
        const manual = prompt("Copy the public link:", url)
        if (manual !== null) {
          // toast({ title: "Link ready", description: "You can share the copied link." })
        }
      }
    } catch (e) {
      console.error("Failed to generate link", e)
      // toast({ title: "Failed to generate link", variant: "destructive" })
    }
  }

  const PHONE_COUNTRIES = {
    US: { dial: "+1", len: 10 },
    IN: { dial: "+91", len: 10 },
    GB: { dial: "+44", len: 10 },
    CA: { dial: "+1", len: 10 },
    AU: { dial: "+61", len: 9 },
  }

  const validateField = (field, value) => {
    const errors = []

    // Required validation
    if (field.required) {
      if (field.type === "checkbox" || (field.type === "select" && field.validation?.multiple)) {
        if (!Array.isArray(value) || value.length === 0) {
          errors.push("This field is required")
        }
      } else if (field.type === "file") {
        if (!value) {
          errors.push("Please select a file")
        }
      } else if (field.type === "location") {
        const v = value || {}
        if (!v.country) {
          errors.push("Please select a country")
        } else if (!v.state) {
          errors.push("Please select a state")
        } else if (!v.city) {
          errors.push("Please select a city")
        }
      } else if (field.type === "phone") {
        const v = value || {}
        if (!v.country) {
          errors.push("Please select a country code")
        } else if (!v.number || String(v.number).trim() === "") {
          errors.push("Please enter a phone number")
        }
      } else if (!value || (typeof value === "string" && value.trim() === "")) {
        errors.push("This field is required")
      }
    }

    // File type validation
    if (field.type === "file" && value && field.validation?.accept) {
      const acceptedTypes = field.validation.accept.split(",").map((type) => type.trim())
      const fileName = value.name || ""
      const fileType = value.type || ""

      const isAccepted = acceptedTypes.some((acceptType) => {
        if (acceptType.startsWith(".")) {
          // File extension check
          return fileName.toLowerCase().endsWith(acceptType.toLowerCase())
        } else if (acceptType.includes("*")) {
          // MIME type wildcard check (e.g., image/*)
          const baseType = acceptType.split("/")[0]
          return fileType.startsWith(baseType + "/")
        } else {
          // Exact MIME type check
          return fileType === acceptType
        }
      })

      if (!isAccepted) {
        errors.push(`File type not allowed. Accepted types: ${field.validation.accept}`)
      }
    }

    // Type-specific validation
    if (value && ((typeof value === "string" && value.trim() !== "") || field.type === "phone")) {
      switch (field.type) {
        case "email":
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(value)) {
            errors.push("Please enter a valid email address")
          }
          break

        case "number":
          const numValue = Number(value)
          if (isNaN(numValue)) {
            errors.push("Please enter a valid number")
          } else {
            if (field.validation?.min !== undefined && numValue < field.validation.min) {
              errors.push(`Value must be at least ${field.validation.min}`)
            }
            if (field.validation?.max !== undefined && numValue > field.validation.max) {
              errors.push(`Value must be at most ${field.validation.max}`)
            }
          }
          break

        case "text":
        case "textarea":
          if (field.validation?.pattern && field.validation.pattern.trim() !== "") {
            try {
              const pattern = field.validation.pattern.trim()
              if (pattern) {
                const regex = new RegExp(pattern)
                if (!regex.test(value)) {
                  errors.push("Value does not match the required pattern")
                }
              }
            } catch (e) {
              console.warn("Invalid regex pattern:", field.validation.pattern, e.message)
              // Don't add validation error for invalid regex, just warn
            }
          }
          break

        case "phone": {
          const v = value || {}
          const meta = PHONE_COUNTRIES[v.country || "US"]
          const digits = String(v.number || "").replace(/\D/g, "")
          const minLen =
            typeof field.validation?.minLength === "number" ? field.validation.minLength : (meta?.len ?? 10)
          const maxLen =
            typeof field.validation?.maxLength === "number" ? field.validation.maxLength : (meta?.len ?? 10)
          if (digits.length < minLen || digits.length > maxLen) {
            if (minLen === maxLen) {
              errors.push(`Phone number must be ${minLen} digits for ${v.country || "selected country"}`)
            } else {
              errors.push(`Phone number must be ${minLen}-${maxLen} digits`)
            }
          }
          break
        }
      }
    }

    return errors
  }

  if (fields.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No Fields to Preview</h3>
          <p className="text-muted-foreground mb-4">
            Switch back to builder mode and add some fields to see the form preview.
          </p>
          <Badge variant="outline" className="text-xs">
            Add fields from the palette to get started
          </Badge>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">Form Preview</h2>
          <p className="text-muted-foreground">
            This is how your form will appear to users. All validation rules are active.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Generated Form
            </CardTitle>
            <p className="text-sm text-muted-foreground">Fill out the form below to test validation and submission.</p>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
                form.handleSubmit()
              }}
              className="space-y-6"
            >
              {fields.map((field) => (
                <form.Field
                  key={field.id}
                  name={field.id}
                  validators={{
                    onChange: ({ value }) => {
                      const errors = validateField(field, value)
                      return errors.length > 0 ? errors[0] : undefined
                    },
                    onSubmit: ({ value }) => {
                      const errors = validateField(field, value)
                      return errors.length > 0 ? errors[0] : undefined
                    },
                  }}
                >
                  {(fieldApi) => (
                    <div className="space-y-1">
                      <FieldRenderer
                        field={field}
                        value={fieldApi.state.value}
                        onChange={fieldApi.handleChange}
                        invalid={fieldApi.state.meta.errors.length > 0}
                        error={fieldApi.state.meta.errors.length > 0 ? fieldApi.state.meta.errors[0] : undefined}
                      />
                    </div>
                  )}
                </form.Field>
              ))}

              <Separator />

              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                  {fields.length} {fields.length === 1 ? "field" : "fields"} • {fields.filter((f) => f.required).length}{" "}
                  required
                </div>

                <div className="flex items-center gap-2">
                  <Button type="button" variant="secondary" onClick={handleGenerateLink}>
                    Generate Link
                  </Button>
                  <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                    {([canSubmit, isSubmitting]) => (
                      <Button type="submit" disabled={!canSubmit} className="gap-2">
                        <Send className="h-4 w-4" />
                        {isSubmitting ? "Submitting..." : "Submit Form"}
                      </Button>
                    )}
                  </form.Subscribe>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Form Data Debug Panel */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Form State (Debug)</CardTitle>
          </CardHeader>
          <CardContent>
            <form.Subscribe>
              {(state) => (
                <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-40">
                  {JSON.stringify(
                    {
                      values: state.values,
                      errors: state.errors,
                      canSubmit: state.canSubmit,
                      isSubmitting: state.isSubmitting,
                    },
                    null,
                    2,
                  )}
                </pre>
              )}
            </form.Subscribe>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}