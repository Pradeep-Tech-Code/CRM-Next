"use client"

import { useForm } from "@tanstack/react-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, Send, ArrowLeft, Building, User, Save, Edit, FileText } from "lucide-react"
import { FieldRenderer } from "../../component/formbuilder/field-renderer"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"

// API configuration
const API_BASE_URL = 'http://10.10.15.194:3000'
const ORGANIZATION_ID = 'c8c72c21-7b5c-435a-912a-803105e7ecc9'
const TABLE_ID = 'b9bc249f-9099-4436-bfc6-9dd74d1e8fdc'
const USER_ID = 'c2a985ce-d385-4349-8f0c-d46e63027ce4'

// Generate or use a proper token
const getAuthToken = () => {
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYzJhOTg1Y2UtZDM4NS00MzQ5LThmMGMtZDQ2ZTYzMDI3Y2U0Iiwib3JnYW5pemF0aW9uX2lkIjoiYzhjNzJjMjEtN2I1Yy00MzVhLTkxMmEtODAzMTA1ZTdlY2M5IiwiaWF0IjoxNzU5MzE0ODY2LCJleHAiOjE3NTk0MDEyNjZ9.QjKz8fTFwia76o7LkkdmlGGhEKoguy8o6iFbCojMwkE'
}

export default function PublicFormPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const formId = params.formId
  const token = searchParams.get('token')
  const submissionId = searchParams.get('submission_id')
  
  const [formData, setFormData] = useState(null)
  const [submissionData, setSubmissionData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [submissionSuccess, setSubmissionSuccess] = useState(false)
  const [lastSubmissionId, setLastSubmissionId] = useState(null)
  const [lastSubmissionToken, setLastSubmissionToken] = useState(null)

  useEffect(() => {
    if (formId) {
      fetchFormData()
    }
  }, [formId])

  useEffect(() => {
    // Check if we're in edit mode (has token and submission_id)
    if (token && submissionId) {
      setIsEditMode(true)
      fetchSubmissionData()
    }
  }, [token, submissionId])

  const fetchFormData = async () => {
    try {
      console.log('Fetching form data for ID:', formId)
      
      const response = await fetch(
        `${API_BASE_URL}/api/forms/${ORGANIZATION_ID}/${TABLE_ID}/${formId}`
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch form: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log('API Response:', result)
      
      if (result.success && result.form) {
        const parsedForm = parseFormData(result.form)
        console.log('Parsed form data:', parsedForm)
        setFormData(parsedForm)
      } else {
        throw new Error('Form not found in response')
      }
      
    } catch (error) {
      console.error('Error fetching form:', error)
      toast.error("Form not found or access denied")
      
      // Fallback to mock data for demo
      const mockForm = getMockFormData(formId)
      if (mockForm) {
        setFormData(mockForm)
      }
    } finally {
      setLoading(false)
    }
  }

  // POST method fallback
  const tryPostMethod = async () => {
    try {
      console.log('Trying POST method...')
      
      const response = await fetch(
        `${API_BASE_URL}/api/submit/edit?token=${token}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${getAuthToken()}`
          },
          body: JSON.stringify({
            organization_id: ORGANIZATION_ID,
            form_id: formId,
            submission_id: submissionId
          })
        }
      )

      console.log('POST Response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('POST method failed with response:', errorText)
        throw new Error(`POST method failed: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log('POST Submission data response:', result)
      
      if (result.success && result.data) {
        setSubmissionData(result.data)
        toast.success("Submission loaded for editing")
      } else {
        throw new Error('Submission data not found in POST response')
      }
      
    } catch (postError) {
      console.error('POST method also failed:', postError)
      toast.error("Unable to load submission data. Please check the URL parameters.")
      
      // For development, set mock data
      setMockSubmissionData()
    }
  }

  // Mock data for development
  const setMockSubmissionData = () => {
    console.log('Setting mock submission data for development')
    const mockData = {
      values: getDefaultValues() // Use the form's default values structure
    }
    setSubmissionData(mockData)
    toast.info("Using demo data - submission loaded for editing")
  }

  const fetchSubmissionData = async () => {
    if (!token || !submissionId) {
      console.error('Missing token or submissionId:', { token, submissionId })
      return
    }

    try {
      console.log('Fetching submission data for editing:', { 
        submissionId, 
        token,
        organization_id: ORGANIZATION_ID,
        form_id: formId
      })
      
      // Method 1: GET with query parameters (as per curl example structure)
      const url = new URL(`${API_BASE_URL}/api/submit/edit`)
      const params = {
        token: token,
        organization_id: ORGANIZATION_ID,
        form_id: formId,
        submission_id: submissionId
      }
      
      Object.keys(params).forEach(key => 
        url.searchParams.append(key, params[key])
      )

      console.log('Trying GET request to:', url.toString())
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`
        }
      })

      console.log('GET Response status:', response.status)
      
      if (!response.ok) {
        // Try POST method as fallback
        await tryPostMethod()
        return
      }

      const result = await response.json()
      console.log('GET Submission data response:', result)
      
      if (result.success && result.data) {
        setSubmissionData(result.data)
        toast.success("Submission loaded for editing")
      } else {
        throw new Error('Submission data not found in GET response')
      }
      
    } catch (error) {
      console.error('Error in GET method:', error)
      // Try POST method as fallback
      await tryPostMethod()
    }
  }

  // Helper function to parse form data from API
  const parseFormData = (apiForm) => {
    try {
      let parsedFields = []
      
      console.log('Raw API form fields:', apiForm.fields)
      
      // Handle different field formats
      if (Array.isArray(apiForm.fields)) {
        parsedFields = apiForm.fields.map((field, index) => {
          let fieldData = null
          
          // Case 1: Field is an object with numeric keys (character-by-character JSON)
          if (typeof field === 'object' && field !== null && !Array.isArray(field)) {
          

          
            const keys = Object.keys(field).filter(key => !isNaN(key))
            
            if (keys.length > 0) {
              try {
                // Reconstruct the JSON string by sorting numeric keys and joining characters
                const jsonString = keys
                  .sort((a, b) => parseInt(a) - parseInt(b))
                  .map(key => field[key])
                  .join('')
                
                console.log(`Reconstructed JSON for field ${index}:`, jsonString)
                
                if (jsonString.trim()) {
                  fieldData = JSON.parse(jsonString)
                }
              } catch (parseError) {
                console.error(`Failed to parse reconstructed JSON for field ${index}:`, parseError)
              }
            }
          }
          
          // Case 2: Field is a JSON string
          if (!fieldData && typeof field === 'string') {
            try {
              fieldData = JSON.parse(field)
            } catch (parseError) {
              console.warn(`Failed to parse field ${index} as JSON string:`, field)
            }
          }
          
          // Case 3: Field is already a proper object (simple field object)
          if (!fieldData && typeof field === 'object' && field !== null) {
            // Check if it has expected field properties (not character objects)
            if (field.id || field.name || field.type || field.label) {
              fieldData = field
            }
          }
          
          // If we successfully got fieldData, process it
          if (fieldData) {
            console.log(`Processed field ${index}:`, fieldData)
            
            // Handle options - convert string to array if needed
            let options = []
            if (Array.isArray(fieldData.options)) {
              options = fieldData.options
            } else if (typeof fieldData.options === 'string') {
              // Split comma-separated string into array
              options = fieldData.options.split(',').map(opt => opt.trim()).filter(opt => opt)
            }
            
            return {
              id: fieldData.id || fieldData.name || `field-${index}-${Date.now()}`,
              type: fieldData.type || 'text',
              label: fieldData.label || fieldData.name || 'Field',
              placeholder: fieldData.placeholder || '',
              required: fieldData.required === true || fieldData.required === 'true' || false,
              options: JSON.parse(options) || [], // Always ensure options is an array
              validation: typeof fieldData.validation === 'object' ? JSON.parse(fieldData.validation) : {}
            }
          }
          
          // Default fallback if all parsing attempts failed
          console.warn(`Field ${index} could not be parsed, using default`)
          return {
            id: `field-${index}-${Date.now()}`,
            type: 'text',
            label: 'Text Field',
            placeholder: 'Enter text',
            required: false,
            options: [],
            validation: {}
          }
        })
      }
  
      const parsedForm = {
        form_name: apiForm.form_name || apiForm.name || 'Untitled Form',
        description: apiForm.description || '',
        fields: parsedFields
      }
      
      console.log('Final parsed form:', parsedForm)
      return parsedForm
      
    } catch (error) {
      console.error('Error parsing form data:', error)
      return getMockFormData(formId) || {
        form_name: 'Form',
        description: '',
        fields: []
      }
    }
  }

  // Transform submission values to match form field structure
  const transformSubmissionValues = (submissionValues, fields) => {
    const transformedValues = {}
    
    if (!submissionValues || typeof submissionValues !== 'object') {
      return transformedValues
    }

    fields.forEach(field => {
      const fieldId = field.id
      const fieldValue = submissionValues[fieldId]
      
      if (fieldValue !== undefined && fieldValue !== null) {
        // Handle different field types
        console.log("HIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII")
        switch (field.type) {

          case "checkbox":
          case "select":
            console.log("HIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII")

            if (field.validation?.multiple) {
              console.log("HIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII")

              // Multiple select/checkbox - ensure array format
              transformedValues[fieldId] = Array.isArray(fieldValue) ? fieldValue : [fieldValue].filter(Boolean)
            } else {
              console.log("HIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII")
              // Single value
              transformedValues[fieldId] = fieldValue
            }
            break
          
          case "location":
          case "phone":
            // These should be objects
            if (typeof fieldValue === 'object') {
              transformedValues[fieldId] = fieldValue
            } else if (typeof fieldValue === 'string') {
              // Try to parse string as JSON
              try {
                transformedValues[fieldId] = JSON.parse(fieldValue)
              } catch {
                // If parsing fails, use empty object
                transformedValues[fieldId] = {}
              }
            } else {
              transformedValues[fieldId] = {}
            }
            break
          
          default:
            // Text, email, number, textarea, etc.
            transformedValues[fieldId] = fieldValue
        }
      }
    })
    
    return transformedValues
  }

  // Mock data fallback
  const getMockFormData = (formId) => {
    const mockForms = {
      "76e2ab47-e84f-4c49-ba15-23fff32cd795": {
        form_name: "Lead Form",
        description: "Form for new customer leads",
        fields: [
          {
            id: "name",
            type: "text",
            label: "Full Name",
            placeholder: "Enter your full name",
            required: true
          },
          {
            id: "email",
            type: "email",
            label: "Email Address",
            placeholder: "Enter your email address",
            required: true
          },
          {
            id: "company",
            type: "text",
            label: "Company",
            placeholder: "Enter your company name",
            required: false
          },
          {
            id: "phone",
            type: "phone",
            label: "Phone Number",
            placeholder: "Enter your phone number",
            required: false
          },
          {
            id: "message",
            type: "textarea",
            label: "Message",
            placeholder: "Tell us about your requirements",
            required: false
          }
        ]
      }
    }

    return mockForms[formId]
  }

  // Generate edit token (client-side fallback)
  const generateEditToken = (submissionId) => {
    // Create a simple token for demo purposes
    // In production, this should come from your API
    return btoa(`${ORGANIZATION_ID}:${formId}:${submissionId}:${Date.now()}`)
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
  }

  // Transform form values to match API expected format
  const transformFormValues = (formValues, fields) => {
    const transformedValues = {}
    
    Object.keys(formValues).forEach(fieldId => {
      const fieldValue = formValues[fieldId]
      const field = fields.find(f => f.id === fieldId)
      
      if (!field) return
      
      // Handle different field types according to your API format
      switch (field.type) {
        case "checkbox":
          // Checkbox returns array of selected options
          transformedValues[fieldId] = Array.isArray(fieldValue) ? fieldValue : []
          break
        
        case "select":
          if (field.validation?.multiple) {
            // Multiple select returns array like ["a", "b"] in your curl example
            transformedValues[fieldId] = Array.isArray(fieldValue) ? fieldValue : []
          } else {
            // Single select returns string
            transformedValues[fieldId] = fieldValue || ""
          }
          break
        
        case "radio":
          // Radio returns single string value
          transformedValues[fieldId] = fieldValue || ""
          break
        
        case "file":
          // File upload - store file name
          if (fieldValue && typeof fieldValue === 'object') {
            transformedValues[fieldId] = fieldValue.name || "Uploaded file"
          } else {
            transformedValues[fieldId] = fieldValue || ""
          }
          break
        
        case "location":
          // Location returns object with country, state, city
          if (typeof fieldValue === 'object' && fieldValue !== null) {
            transformedValues[fieldId] = {
              country: fieldValue.country || "",
              state: fieldValue.state || "",
              city: fieldValue.city || ""
            }
          } else {
            transformedValues[fieldId] = {}
          }
          break
        
        case "phone":
          // Phone returns object with country and number
          if (typeof fieldValue === 'object' && fieldValue !== null) {
            transformedValues[fieldId] = {
              country: fieldValue.country || "",
              number: fieldValue.number || ""
            }
          } else {
            transformedValues[fieldId] = {}
          }
          break
        
        default:
          // Text, email, number, textarea - return as string
          transformedValues[fieldId] = fieldValue || ""
      }
    })
    
    return transformedValues
  }

  // Get default values for form initialization
  const getDefaultValues = () => {
    if (!formData?.fields) return {}

    // If we have submission data in edit mode, use that
    if (isEditMode && submissionData) {
      return transformSubmissionValues(submissionData.values, formData.fields)
    }

    // Otherwise, use empty defaults
    return formData.fields.reduce((acc, field) => {
      const fieldId = field.id
      
      acc[fieldId] = field.type === "checkbox" || (field.type === "select" && field.validation?.multiple)
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

  // Generate mock submission ID if API doesn't return one
  const generateMockSubmissionId = () => {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const handleEditResponse = () => {
    if (lastSubmissionId && lastSubmissionToken) {
      const editUrl = `${window.location.origin}${window.location.pathname}?token=${lastSubmissionToken}&submission_id=${lastSubmissionId}`
      window.location.href = editUrl
    }
  }

  const form = useForm({
    defaultValues: getDefaultValues(),
    onSubmit: async ({ value }) => {
      setSubmitting(true)
      try {
        // Transform form values to match API expected format
        const transformedValues = transformFormValues(value, formData?.fields || [])
        
        if (isEditMode) {
          // Update existing submission
          const updateData = {
            organization_id: ORGANIZATION_ID,
            form_id: formId,
            submission_id: submissionId,
            values: transformedValues
          }

          console.log('Form update data:', updateData)
          
          const response = await fetch(`${API_BASE_URL}/api/submit/update?token=${token}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData)
          })

          if (response.ok) {
            const result = await response.json()
            console.log('Update successful:', result)
            toast.success("Form updated successfully!")
            setSubmissionSuccess(true)
          } else {
            const errorText = await response.text()
            console.error('Update failed:', errorText)
            toast.error("Failed to update form. Please try again.")
          }
        } else {
          // Create new submission
          const submissionData = {
            organization_id: ORGANIZATION_ID,
            form_id: formId,
            values: transformedValues
          }

          console.log('Form submission data:', submissionData)
          
          const response = await fetch(`${API_BASE_URL}/api/submit`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(submissionData)
          })

          if (response.ok) {
            const result = await response.json()
            console.log('Submission successful:', result)
            
            // ALWAYS generate token and set submission success
            const newSubmissionId = result.data?.submission_id || generateMockSubmissionId()
            const editToken = result.data?.token || generateEditToken(newSubmissionId)
            
            setLastSubmissionId(newSubmissionId)
            setLastSubmissionToken(editToken)
            setSubmissionSuccess(true)
            
            console.log('Edit token generated:', editToken)
            console.log('Submission ID:', newSubmissionId)
            
            toast.success("Thank you for your response!")
            
            form.reset()
          } else {
            const errorText = await response.text()
            console.error('Submission failed:', errorText)
            toast.error("Failed to submit form. Please try again.")
          }
        }
        
      } catch (error) {
        console.error('Error submitting form:', error)
        toast.error("An error occurred while submitting the form.")
      } finally {
        setSubmitting(false)
      }
    },
  })

  // Update form values when submission data is loaded
  useEffect(() => {
    if (isEditMode && submissionData && formData) {
      const defaultValues = getDefaultValues()
      form.reset(defaultValues)
    }
  }, [submissionData, isEditMode, formData])

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
      }
    }

    return errors
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground">
              {isEditMode ? "Loading submission..." : "Loading form..."}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!formData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Form Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The form you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Success View
  if (submissionSuccess && !isEditMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-blue-200">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                  <Building className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Slash CRM</h1>
                  <p className="text-sm text-muted-foreground">Form Collection</p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                Submission Complete
              </Badge>
            </div>
          </div>
        </div>

        {/* Success Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="shadow-lg border-0">
              <CardHeader className="text-center pb-4 border-b bg-gradient-to-r from-green-50 to-emerald-100">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl font-bold text-green-700">
                  Thank You!
                </CardTitle>
                <p className="text-muted-foreground mt-2">
                  Your response has been submitted successfully.
                </p>
              </CardHeader>
              
              <CardContent className="p-6 text-center">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">What would you like to do next?</h3>
                    <p className="text-sm text-muted-foreground">
                      You can edit your response or submit another one.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                      onClick={handleEditResponse}
                      className="gap-2"
                      size="lg"
                    >
                      <Edit className="h-4 w-4" />
                      Edit Your Response
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setSubmissionSuccess(false)
                        form.reset()
                      }}
                      className="gap-2"
                      size="lg"
                    >
                      <FileText className="h-4 w-4" />
                      Submit Another Response
                    </Button>
                  </div>

                  {lastSubmissionId && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-700">
                        <strong>Submission ID:</strong> {lastSubmissionId}
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Keep this ID for your records.
                      </p>
                    </div>
                  )}
                </div>

                {/* Privacy Notice */}
                <div className="mt-8 p-4 bg-muted/50 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    Your information is secure and will only be used for the intended purpose.
                    We respect your privacy.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-blue-200 mt-12">
          <div className="container mx-auto px-4 py-6">
            <div className="text-center text-sm text-muted-foreground">
              <p>Powered by Slash CRM • Secure Form Collection</p>
              <p className="mt-1">© 2025 Slash CRM. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Form View
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-blue-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Building className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Slash CRM</h1>
                <p className="text-sm text-muted-foreground">Form Collection</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isEditMode ? "default" : "outline"} className="text-xs">
                {isEditMode ? "Edit Mode" : "Public Form"}
              </Badge>
              {isEditMode && (
                <Badge variant="secondary" className="text-xs">
                  ID: {submissionId?.substring(0, 8)}...
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-lg border-0">
            <CardHeader className="text-center pb-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
              <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-primary" />
                {formData.form_name}
                {isEditMode && (
                  <Badge variant="secondary" className="ml-2">
                    Editing
                  </Badge>
                )}
              </CardTitle>
              {formData.description && (
                <p className="text-muted-foreground mt-2">{formData.description}</p>
              )}
              {isEditMode && (
                <p className="text-sm text-blue-600 mt-1">
                  You are editing an existing submission. Make your changes and click "Update Form" to save.
                </p>
              )}
            </CardHeader>
            
            <CardContent className="p-6">
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  form.handleSubmit()
                }}
                className="space-y-6"
              >
                {formData.fields.map((field, index) => {
                  // Ensure unique key for each field
                  const fieldKey = field.id || `field-${index}`
                  return (
                    <form.Field
                      key={fieldKey}
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
                        {
                          
                          (fieldApi) => {
                            
                            console.log('MMMMMMMMMMMMMMMMMMMMMMMMMMMM', formData)

                          return  (
                        <div className="space-y-2">
                          <FieldRenderer
                            field={field}
                            value={fieldApi.state.value}
                            onChange={fieldApi.handleChange}
                            invalid={fieldApi.state.meta.errors.length > 0}
                            error={fieldApi.state.meta.errors.length > 0 ? fieldApi.state.meta.errors[0] : undefined}
                          />
                        </div>
                      )
                          }
                      }
                    </form.Field>
                  )
                })}

                <Separator className="my-6" />

                <div className="flex items-center justify-between pt-4">
                  <div className="text-sm text-muted-foreground">
                    {formData.fields.length} {formData.fields.length === 1 ? "field" : "fields"} •{" "}
                    {formData.fields.filter((f) => f.required).length} required
                    {isEditMode && " • Editing existing submission"}
                  </div>

                  <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
                    {([canSubmit, isSubmitting]) => (
                      <Button 
                        type="submit" 
                        disabled={!canSubmit || submitting} 
                        className="gap-2 min-w-32"
                      >
                        {submitting || isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            {isEditMode ? "Updating..." : "Submitting..."}
                          </>
                        ) : (
                          <>
                            {isEditMode ? (
                              <>
                                <Save className="h-4 w-4" />
                                Update Form
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4" />
                                Submit Form
                              </>
                            )}
                          </>
                        )}
                      </Button>
                    )}
                  </form.Subscribe>
                </div>
              </form>

              {/* Privacy Notice */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground text-center">
                  Your information is secure and will only be used for the intended purpose.
                  We respect your privacy.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-blue-200 mt-12">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-sm text-muted-foreground">
            <p>Powered by Slash CRM • Secure Form Collection</p>
            <p className="mt-1">© 2025 Slash CRM. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}