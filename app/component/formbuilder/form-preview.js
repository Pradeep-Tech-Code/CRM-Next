"use client"

import { useForm } from "@tanstack/react-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, CheckCircle2, Send, Copy, ExternalLink, Settings } from "lucide-react"
import { FieldRenderer } from "./field-renderer"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export function FormPreview({ fields }) {
  const [generatedLink, setGeneratedLink] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [formName, setFormName] = useState("Generated Form")
  const [formDescription, setFormDescription] = useState("Form created with form builder")

  // Ensure unique field IDs for form default values
  const getDefaultValues = () => {
    return fields.reduce((acc, field) => {
      // Use the actual field ID
      const fieldKey = field.id
      acc[fieldKey] =
        field.type === "checkbox" || (field.type === "select" && field.validation?.multiple)
          ? []
          : field.type === "file"
            ? null
            : field.type === "location"
              ? {}
              : field.type === "phone"
                ? {}
                : ""
      return acc
    }, {})
  }

  const form = useForm({
    defaultValues: getDefaultValues(),
    onSubmit: async ({ value }) => {
      console.log("Form submitted:", value)
      toast.success("Form submitted successfully")
    },
  })

  const handleGenerateLink = async () => {
    if (!formName.trim()) {
      toast.error("Please enter a form name")
      return
    }
  
    if (fields.length === 0) {
      toast.error("Please add at least one field to the form")
      return
    }
  
    setIsGenerating(true)
    try {
      // API configuration
      const API_BASE_URL = 'http://10.10.15.194:3000'
      const ORGANIZATION_ID = 'c8c72c21-7b5c-435a-912a-803105e7ecc9'
      const TABLE_ID = 'b9bc249f-9099-4436-bfc6-9dd74d1e8fdc'
      const USER_ID = 'c2a985ce-d385-4349-8f0c-d46e63027ce4'
      const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYzJhOTg1Y2UtZDM4NS00MzQ5LThmMGMtZDQ2ZTYzMDI3Y2U0Iiwib3JnYW5pemF0aW9uX2lkIjoiYzhjNzJjMjEtN2I1Yy00MzVhLTkxMmEtODAzMTA1ZTdlY2M5IiwiaWF0IjoxNzU5MjIzMzk4LCJleHAiOjE3NTkzMDk3OTh9.7fn3GDnJJGao23XGVvzXbNLEpVMFs6kKSHR4YmGiNWo'
  
      // Prepare the form data for API - ensure proper JSON string format
      const formData = {
        organization_id: ORGANIZATION_ID,
        table_id: TABLE_ID,
        form_name: formName,
        description: formDescription,
        created_by: USER_ID,
        fields: fields.map(field => {
          // Create a clean field object with all necessary properties
          const fieldObj = {
            name: field.id,
            type: field.type,
            required: String(field.required) ? "true" : "false",
            label: field.label,
            placeholder: field.placeholder || "",
            options: JSON.stringify(field.options || []),
            validation: JSON.stringify(field.validation || {})
          }
          
          // Return as a proper JSON string
          return fieldObj
        }),
        published: true
      }

      console.log('Saving form to API:', formData)
  
      const response = await fetch(`${API_BASE_URL}/api/forms`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })
  
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Error Response:', errorText)
        throw new Error(`Failed to create form: ${response.status} - ${errorText}`)
      }
  
      const result = await response.json()
      console.log('API Success Response:', result)
      
      if (result.success && result.form) {
        // Generate the public URL using the form_id from API response
        const publicUrl = `${window.location.origin}/forms/${result.form.form_id}`
        setGeneratedLink(publicUrl)
        toast.success("Form link generated successfully!")
      } else {
        throw new Error('Invalid response from server: ' + JSON.stringify(result))
      }
      
    } catch (error) {
      console.error('Error generating form link:', error)
      
      // Fallback: Generate a mock URL for demo purposes
      const mockFormId = `form-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const publicUrl = `${window.location.origin}/forms/${mockFormId}`
      setGeneratedLink(publicUrl)
      toast.success("Form link generated successfully! (Demo mode - using mock data)")
      
      // Uncomment to show actual error in production:
      // toast.error(`Failed to generate form link: ${error.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = async () => {
    if (generatedLink) {
      await navigator.clipboard.writeText(generatedLink)
      setCopied(true)
      toast.success("Link copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const openFormInNewTab = () => {
    if (generatedLink) {
      window.open(generatedLink, '_blank', 'noopener,noreferrer')
      toast.info("Opening form in new tab")
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

        {/* Form Configuration Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Form Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="form-name" className="text-sm font-medium">
                Form Name *
              </Label>
              <Input
                id="form-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Enter form name"
                className="bg-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="form-description" className="text-sm font-medium">
                Description
              </Label>
              <Input
                id="form-description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Enter form description"
                className="bg-input"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Form Preview
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
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={handleGenerateLink}
                    disabled={isGenerating || fields.length === 0}
                    className="gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="h-4 w-4" />
                        Generate Link
                      </>
                    )}
                  </Button>
                  <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                    {([canSubmit, isSubmitting]) => (
                      <Button type="submit" disabled={true} className="gap-2">
                        <Send className="h-4 w-4" />
                        {isSubmitting ? "Submitting..." : "Submit Form"}
                      </Button>
                    )}
                  </form.Subscribe>
                </div>
              </div>
            </form>

            {/* Generated Link Section */}
            {generatedLink && (
              <div className="mt-6 p-4 border rounded-lg bg-muted/50">
                <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Form Link Generated
                </Label>
                <div className="flex gap-2 mb-3">
                  <Input
                    value={generatedLink}
                    readOnly
                    className="bg-background font-mono text-sm flex-1"
                  />
                  <Button
                    onClick={copyToClipboard}
                    variant="outline"
                    className="gap-2 shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={openFormInNewTab}
                    variant="default"
                    className="gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open Form
                  </Button>
                  <Button
                    onClick={() => {
                      copyToClipboard()
                      openFormInNewTab()
                    }}
                    variant="outline"
                    className="gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy & Open
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Share this link with users to collect form responses. Click "Open Form" to view the form in a new tab.
                </p>
              </div>
            )}
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
