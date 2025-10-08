"use client"

import { useForm } from "@tanstack/react-form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CheckCircle2, Send, ArrowLeft, Building, User, Save, Edit, FileText, Trash2 } from "lucide-react"
import { FieldRenderer } from "../../component/formbuilder/field-renderer"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import Link from "next/link"
import Image from "next/image"
import { useParams, useSearchParams } from "next/navigation"

// API configuration
const API_BASE_URL = 'http://10.10.15.194:3000'
const ORGANIZATION_ID = 'c8c72c21-7b5c-435a-912a-803105e7ecc9'
const TABLE_ID = '040e899d-583a-454e-92e6-d0d5a8095587'
const USER_ID = 'c2a985ce-d385-4349-8f0c-d46e63027ce4'

// Phone countries constant
const PHONE_COUNTRIES = [
  { code: '+1', label: 'US/Canada', len: 10 },
  { code: '+44', label: 'UK', len: 10 },
  { code: '+91', label: 'India', len: 10 },
  { code: '+61', label: 'Australia', len: 9 },
  { code: '+81', label: 'Japan', len: 10 }
]

// Generate or use a proper token
const getAuthToken = () => {
  return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYzJhOTg1Y2UtZDM4NS00MzQ5LThmMGMtZDQ2ZTYzMDI3Y2U0Iiwib3JnYW5pemF0aW9uX2lkIjoiYzhjNzJjMjEtN2I1Yy00MzVhLTkxMmEtODAzMTA1ZTdlY2M5IiwiaWF0IjoxNzU5MzE0ODY2LCJleHAiOjE3NTk0MDEyNjZ9.QjKz8fTFwia76o7LkkdmlGGhEKoguy8o6iFbCojMwkE'
}

// Helper functions
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Improved base64 detection
const isBase64File = (str) => {
  if (typeof str !== 'string') return false
  return str.startsWith('data:') && str.includes('base64,')
}

// Create a proper file object from base64
const createFileFromBase64 = (base64String, filename = 'uploaded_file') => {
  if (!base64String) return null

  try {
    // Extract mime type and base64 data
    const matches = base64String.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.*)$/)
    if (!matches || matches.length !== 3) {
      console.warn('Invalid base64 format:', base64String?.substring(0, 100))
      return null
    }

    const mimeType = matches[1]
    const base64Data = matches[2]

    // Get file extension from mime type
    const extension = mimeType.split('/')[1] || 'bin'
    const finalFilename = filename.includes('.') ? filename : `${filename}.${extension}`

    // Calculate approximate size
    const size = Math.floor((base64Data.length * 3) / 4)

    return {
      name: finalFilename,
      type: mimeType,
      size: size,
      base64: base64String,
      previewUrl: base64String,
      lastModified: Date.now(),
      isFromBase64: true // Flag to identify base64-originated files
    }
  } catch (error) {
    console.error('Error creating file from base64:', error)
    return null
  }
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
  const [hasExistingSubmission, setHasExistingSubmission] = useState(false)

  useEffect(() => {
    if (formId) {
      checkExistingSubmission()
      fetchFormData()
    }
  }, [formId])

  useEffect(() => {
    if (token && submissionId) {
      console.log('Edit mode activated with:', { token, submissionId })
      setIsEditMode(true)
      fetchSubmissionData()
    } else {
      console.log('Not in edit mode, checking for existing submission')
      checkExistingSubmission()
    }
  }, [token, submissionId])

  // Add this for debugging - moved after form initialization

  const checkExistingSubmission = () => {
    try {
      const savedFormId = localStorage.getItem("FORM_ID")
      const savedSubmissionId = localStorage.getItem("SUBMISSION_ID")
      const savedEditToken = localStorage.getItem("EDIT_TOKEN")
      const isSubmitted = localStorage.getItem("FORM_SUBMITTED") === 'true'

      console.log('Checking existing submission from localStorage:', {
        savedFormId,
        savedSubmissionId: savedSubmissionId ? `${savedSubmissionId.substring(0, 8)}...` : null,
        savedEditToken: savedEditToken ? `${savedEditToken.substring(0, 8)}...` : null,
        isSubmitted,
        currentFormId: formId
      })

      if (savedFormId === formId && savedSubmissionId && savedEditToken && isSubmitted) {
        setHasExistingSubmission(true)
        setLastSubmissionId(savedSubmissionId)
        setLastSubmissionToken(savedEditToken)
        setSubmissionSuccess(true)

        console.log('Found existing submission for this form')
      } else {
        console.log('No valid existing submission found')
        setHasExistingSubmission(false)
        setSubmissionSuccess(false)
      }
    } catch (error) {
      console.error('Error checking localStorage:', error)
      setHasExistingSubmission(false)
      setSubmissionSuccess(false)
    }
  }

  const saveSubmissionToStorage = (submissionId, editToken) => {
    try {
      localStorage.setItem("SUBMISSION_ID", submissionId)
      localStorage.setItem("EDIT_TOKEN", editToken)
      localStorage.setItem("FORM_SUBMITTED", 'true')
      localStorage.setItem("FORM_ID", formId)

      console.log('Successfully saved to localStorage:', {
        submissionId,
        editToken,
        formId
      })
    } catch (error) {
      console.error('Error saving to localStorage:', error)
      toast.error("Failed to save submission data locally")
    }
  }

  const clearSubmissionFromStorage = () => {
    try {
      localStorage.removeItem("SUBMISSION_ID")
      localStorage.removeItem("EDIT_TOKEN")
      localStorage.removeItem("FORM_SUBMITTED")
      localStorage.removeItem("FORM_ID")

      setHasExistingSubmission(false)
      setSubmissionSuccess(false)
      setLastSubmissionId(null)
      setLastSubmissionToken(null)
      setSubmissionData(null)
      setIsEditMode(false)

      console.log('Cleared submission data from localStorage')
    } catch (error) {
      console.error('Error clearing localStorage:', error)
    }
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

      // Use the exact API format from your curl request
      const response = await fetch(
        `${API_BASE_URL}/api/submit/edit?token=${token}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            organization_id: ORGANIZATION_ID,
            form_id: formId,
            submission_id: submissionId
          })
        }
      )

      console.log('Submission data response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to fetch submission data:', errorText)
        throw new Error(`Failed to fetch submission: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log('Full API response:', result)

      // Handle different response formats
      if (result.success && result.submission) {
        console.log('Submission data found:', result.submission)
        setSubmissionData(result.submission)
        toast.success("Submission loaded for editing")
      } else if (result.data) {
        // Handle case where submission data is in result.data
        console.log('Submission data found in result.data:', result.data)
        setSubmissionData(result.data)
        toast.success("Submission loaded for editing")
      } else if (result.values) {
        // Handle case where values are directly in result
        console.log('Submission values found:', result.values)
        setSubmissionData({ values: result.values })
        toast.success("Submission loaded for editing")
      } else {
        console.warn('Unexpected response format:', result)
        throw new Error('Submission data not found in response')
      }

    } catch (error) {
      console.error('Error fetching submission data:', error)
      toast.error(`Unable to load submission data: ${error.message}`)
    }
  }

  const fetchFormData = async () => {
    try {
      console.log('🔍 Fetching form data for ID:', formId)
      console.log('🌐 API URL:', `${API_BASE_URL}/api/forms/${ORGANIZATION_ID}/${TABLE_ID}/${formId}`)

      const response = await fetch(
        `${API_BASE_URL}/api/forms/${ORGANIZATION_ID}/${TABLE_ID}/${formId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json',
          }
        }
      )

      console.log('📡 Response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Error Response:', errorText)

        if (response.status === 404) {
          throw new Error(`Form not found (404). The form with ID "${formId}" does not exist or has been deleted.`)
        } else if (response.status === 401) {
          throw new Error('Authentication failed (401). Please check your authentication token.')
        } else if (response.status === 403) {
          throw new Error('Access forbidden (403). You do not have permission to access this form.')
        } else {
          throw new Error(`Failed to fetch form: ${response.status} ${response.statusText}`)
        }
      }

      const result = await response.json()
      console.log('✅ API Response:', result)

      if (result.success && result.form) {
        const parsedForm = parseFormData(result.form)
        console.log('✅ Parsed form data:', parsedForm)
        setFormData(parsedForm)
      } else {
        throw new Error('Form not found in response: ' + JSON.stringify(result))
      }

    } catch (error) {
      console.error('❌ Error fetching form:', error)

      if (error.message.includes('404') || error.message.includes('not found')) {
        toast.error("Form not found. The form may have been deleted or the URL is incorrect.")
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        toast.error("Network error. Please check your connection and try again.")
      } else {
        toast.error("Form not found or access denied")
      }

    } finally {
      setLoading(false)
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

            // Parse validation - ensure it's an object
            let validation = {}
            if (typeof fieldData.validation === 'string') {
              try {
                validation = JSON.parse(fieldData.validation)
              } catch (e) {
                console.warn('Failed to parse validation as JSON:', fieldData.validation)
              }
            } else if (typeof fieldData.validation === 'object') {
              validation = fieldData.validation
            }

            let nestedFields = []
            if (typeof fieldData.nested_fields === 'string') {
              try {
                nestedFields = JSON.parse(fieldData.nested_fields)
              } catch (e) {
                console.warn('Failed to parse nested_fields as JSON:', fieldData.nested_fields)
              }
            } else if (typeof fieldData.nested_fields === 'object') {
              nestedFields = fieldData.nested_fields
            }

            // Ensure required is properly set in both field and validation
            const isRequired = fieldData.required === true || fieldData.required === 'true' || false

            return {
              id: fieldData.id || fieldData.name || `field-${index}-${Date.now()}`,
              type: fieldData.type || 'text',
              label: fieldData.label || fieldData.name || 'Field',
              placeholder: fieldData.placeholder || '',
              required: isRequired,
              options: options,
              nestedFields: nestedFields,
              validation: {
                required: isRequired,
                multiple: validation.multiple || false,
                min: validation.min,
                max: validation.max,
                accept: validation.accept,
                pattern: validation.pattern,
                ...validation
              }
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
            nestedFields: [],
            validation: {
              required: false,
              multiple: false
            }
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
      console.log('No submission values to transform')
      return transformedValues
    }

    console.log('🔄 Raw submission values from API:', submissionValues)
    console.log('📋 Form fields:', fields.map(f => ({
      id: f.id,
      name: f.name,
      label: f.label,
      type: f.type
    })))
    console.log('🔍 Available submission keys:', Object.keys(submissionValues))

    fields.forEach(field => {
      const fieldId = field.id
      const fieldName = field.name || fieldId
      const fieldLabel = field.label
      let fieldValue = submissionValues[fieldId]

      // Try multiple possible keys for the field value
      const possibleKeys = [
        fieldId,
        fieldName,
        fieldLabel,
        // Try exact matches from submission values
        ...Object.keys(submissionValues).filter(key =>
          key === fieldId ||
          key === fieldName ||
          key === fieldLabel ||
          key.toLowerCase() === fieldId?.toLowerCase() ||
          key.toLowerCase() === fieldName?.toLowerCase() ||
          key.toLowerCase() === fieldLabel?.toLowerCase() ||
          // Handle cases where field label might have extra spaces
          key.trim() === fieldLabel?.trim() ||
          key.trim() === fieldName?.trim()
        )
      ]

      // let fieldValue = undefined
      let matchedKey = null

      for (const key of possibleKeys) {
        if (submissionValues[key] !== undefined && submissionValues[key] !== null) {
          fieldValue = submissionValues[key]
          matchedKey = key
          console.log(`✅ Found value for field ${fieldId} (${fieldLabel}) using key: "${key}"`, fieldValue)
          break
        }
      }

      if (!matchedKey) {
        console.log(`❌ No value found for field ${fieldId} (${fieldLabel}) - tried keys:`, possibleKeys)
        console.log(`Available submission keys:`, Object.keys(submissionValues))

        // Last resort: try to find a match by comparing field labels with submission keys
        const submissionKeys = Object.keys(submissionValues)
        for (const subKey of submissionKeys) {
          if (fieldLabel && subKey.toLowerCase().includes(fieldLabel.toLowerCase())) {
            fieldValue = submissionValues[subKey]
            matchedKey = subKey
            console.log(`🔄 Fallback match found for field ${fieldId} (${fieldLabel}) using key: "${subKey}"`, fieldValue)
            break
          }
        }
      }

      if (fieldValue !== undefined && fieldValue !== null) {
        // Handle different field types
        switch (field.type) {
          case "checkbox":
            if (field.validation?.multiple) {
              // Multiple checkbox - ensure array format
              if (Array.isArray(fieldValue)) {
                transformedValues[fieldId] = fieldValue
              } else if (typeof fieldValue === 'string') {
                // Try to parse string as array
                try {
                  const parsed = JSON.parse(fieldValue)
                  transformedValues[fieldId] = Array.isArray(parsed) ? parsed : [parsed]
                } catch {
                  transformedValues[fieldId] = [fieldValue]
                }
              } else {
                transformedValues[fieldId] = [fieldValue]
              }
            } else {
              // Single checkbox - convert to boolean
              transformedValues[fieldId] = Boolean(fieldValue)
            }
            break

          case "select":
            if (field.validation?.multiple) {
              // Multiple select - ensure array format
              if (Array.isArray(fieldValue)) {
                transformedValues[fieldId] = fieldValue
              } else if (typeof fieldValue === 'string') {
                try {
                  const parsed = JSON.parse(fieldValue)
                  transformedValues[fieldId] = Array.isArray(parsed) ? parsed : [parsed]
                } catch {
                  transformedValues[fieldId] = [fieldValue]
                }
              } else {
                transformedValues[fieldId] = [fieldValue]
              }
            } else {
              // Single select
              transformedValues[fieldId] = fieldValue
            }
            break

          case "radio":
            // Radio returns single value
            transformedValues[fieldId] = fieldValue
            break

          case "file":
            // Handle file fields - convert base64 string to file object
            if (typeof fieldValue === 'string' && isBase64File(fieldValue)) {
              const fileObject = createFileFromBase64(fieldValue, field.label || field.name || 'file')
              if (fileObject) {
                transformedValues[fieldId] = fileObject
                console.log(`Created file object for ${fieldId}:`, fileObject.name)
              } else {
                transformedValues[fieldId] = null
              }
            } else if (typeof fieldValue === 'object' && fieldValue !== null) {
              // Already a file object
              transformedValues[fieldId] = fieldValue
            } else {
              transformedValues[fieldId] = null
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
                // If parsing fails, check if it's a simple string value
                if (fieldValue.trim() !== '') {
                  transformedValues[fieldId] = { value: fieldValue }
                } else {
                  transformedValues[fieldId] = {}
                }
              }
            } else {
              transformedValues[fieldId] = {}
            }
            break

          default:
            // Text, email, number, textarea, etc.
            transformedValues[fieldId] = fieldValue
        }
      } else {
        // No value found, set appropriate default
        transformedValues[fieldId] = field.type === "checkbox" || (field.type === "select" && field.validation?.multiple)
          ? []
          : field.type === "file"
            ? null
            : field.type === "location" || field.type === "phone"
              ? {}
              : ""

        console.log(`No value found for field ${fieldId}, using default:`, transformedValues[fieldId])
      }
    })

    console.log('Final transformed values for form:', transformedValues)
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
            required: true,
            validation: {
              required: true,
              multiple: false
            }
          },
          {
            id: "email",
            type: "email",
            label: "Email Address",
            placeholder: "Enter your email address",
            required: true,
            validation: {
              required: true,
              multiple: false
            }
          },
          {
            id: "company",
            type: "text",
            label: "Company",
            placeholder: "Enter your company name",
            required: false,
            validation: {
              required: false,
              multiple: false
            }
          },
          {
            id: "phone",
            type: "phone",
            label: "Phone Number",
            placeholder: "Enter your phone number",
            required: false,
            validation: {
              required: false,
              multiple: false
            }
          },
          {
            id: "message",
            type: "textarea",
            label: "Message",
            placeholder: "Tell us about your requirements",
            required: false,
            validation: {
              required: false,
              multiple: false
            }
          }
        ]
      }
    }

    return mockForms[formId]
  }

  const transformFormValues = (formValues, fields) => {
    const transformedValues = {}

    console.log('🔍 Transforming form values:', formValues)
    console.log('📋 Available fields:', fields.map(f => ({ id: f.id, type: f.type, required: f.required })))

    Object.keys(formValues).forEach(fieldId => {
      const fieldValue = formValues[fieldId]
      const field = fields.find(f => f.id === fieldId)

      if (!field) return

      // Skip empty values for non-required fields
      if (!field.required && !field.validation?.required) {
        // Check if the value is empty
        let isEmpty = false

        if (fieldValue === null || fieldValue === undefined || fieldValue === '') {
          isEmpty = true
        } else if (Array.isArray(fieldValue) && fieldValue.length === 0) {
          isEmpty = true
        } else if (typeof fieldValue === 'object' && fieldValue !== null) {
          // Special handling for location and phone fields
          if (field.type === 'location') {
            // Location is empty if all properties are empty
            isEmpty = (!fieldValue.country || fieldValue.country === '') &&
              (!fieldValue.state || fieldValue.state === '') &&
              (!fieldValue.city || fieldValue.city === '')
          } else if (field.type === 'phone') {
            // Phone is empty if both country and number are empty
            isEmpty = (!fieldValue.country || fieldValue.country === '') &&
              (!fieldValue.number || fieldValue.number === '')
          } else if (field.type === 'file') {
            // File is empty if no name or base64 data
            isEmpty = !fieldValue.name && !fieldValue.base64
          } else {
            // For other objects, check if all keys are empty
            isEmpty = Object.keys(fieldValue).length === 0
          }
        }

        if (isEmpty) {
          return // Skip this field entirely
        }
      }

      // Handle different field types according to your API format
      switch (field.type) {
        case "checkbox":

          if (typeof fieldValue === 'object' && fieldValue !== null && fieldValue.value !== undefined) {
            transformedValues[fieldId] = Array.isArray(fieldValue.value) ? fieldValue.value : []
          } else {
            transformedValues[fieldId] = Array.isArray(fieldValue) ? fieldValue : []
          }

          if (typeof fieldValue === 'object' && fieldValue !== null && fieldValue.nestedFields) {
            transformedValues[fieldId] = fieldValue.nestedFields
          }

          break

        case "select":
          if (field.validation?.multiple) {
            if (typeof fieldValue === 'object' && fieldValue !== null && fieldValue.value !== undefined) {
              transformedValues[fieldId] = Array.isArray(fieldValue.value) ? fieldValue.value : []
            } else {
              transformedValues[fieldId] = Array.isArray(fieldValue) ? fieldValue : []
            }
          } else {
            // Single select returns string
            if (typeof fieldValue === 'object' && fieldValue !== null && fieldValue.value !== undefined) {
              transformedValues[fieldId] = fieldValue.value || ""
            } else {
              transformedValues[fieldId] = fieldValue || ""
            }

            if (typeof fieldValue === 'object' && fieldValue !== null && fieldValue.nestedFields) {
              transformedValues[fieldId] = fieldValue.nestedFields
            }
          }
          break

        case "radio":
          // Radio returns single string value
          if (typeof fieldValue === 'object' && fieldValue !== null && fieldValue.value !== undefined) {
            transformedValues[fieldId] = fieldValue.value || ""
          } else {
            transformedValues[fieldId] = fieldValue || ""
          }

          if (typeof fieldValue === 'object' && fieldValue !== null && fieldValue.nestedFields) {
            transformedValues[fieldId] = fieldValue.nestedFields
          }
          break

        case "file":
          // File upload - send base64 data as string
          if (fieldValue && typeof fieldValue === 'object' && fieldValue.base64) {
            // Send base64 string directly
            transformedValues[fieldId] = fieldValue.base64
          } else if (fieldValue && typeof fieldValue === 'string' && fieldValue.startsWith('data:')) {
            // If it's already a base64 string, use it directly
            transformedValues[fieldId] = fieldValue
          } else {
            transformedValues[fieldId] = ""
          }
          break

        case "location":
          // Location returns object with country, state, city
          console.log(`📍 Processing location field ${fieldId}:`, fieldValue)
          if (typeof fieldValue === 'object' && fieldValue !== null) {
            const locationData = {
              country: fieldValue.country || "",
              state: fieldValue.state || "",
              city: fieldValue.city || ""
            }
            transformedValues[fieldId] = locationData
            console.log(`📍 Location field ${fieldId} transformed to:`, locationData)
          } else {
            transformedValues[fieldId] = {}
            console.log(`📍 Location field ${fieldId} set to empty object`)
          }
          break

        case "phone":
          // Phone returns object with country and number
          console.log(`📞 Processing phone field ${fieldId}:`, fieldValue)
          if (typeof fieldValue === 'object' && fieldValue !== null) {
            const phoneData = {
              country: fieldValue.country || "",
              number: fieldValue.number || ""
            }
            transformedValues[fieldId] = phoneData
            console.log(`📞 Phone field ${fieldId} transformed to:`, phoneData)
          } else {
            transformedValues[fieldId] = {}
            console.log(`📞 Phone field ${fieldId} set to empty object`)
          }
          break

        default:
          // Text, email, number, textarea - return as string
          transformedValues[fieldId] = fieldValue || ""
      }
    })

    console.log('✅ Final transformed values:', transformedValues)
    return transformedValues
  }

  // Get default values for form initialization
  const getDefaultValues = () => {
    if (!formData?.fields) {
      console.log('❌ No form data fields available')
      return {}
    }

    console.log('🔄 Getting default values:', {
      isEditMode,
      hasSubmissionData: !!submissionData,
      submissionDataKeys: submissionData ? Object.keys(submissionData) : [],
      formFieldCount: formData.fields.length
    })

    // If we have submission data in edit mode, use that
    if (isEditMode && submissionData) {
      console.log('📝 Processing submission data for edit mode:', {
        submissionValues: submissionData.values,
        submissionDataKeys: Object.keys(submissionData.values || {}),
        formFields: formData.fields.map(f => ({ id: f.id, name: f.name, label: f.label, type: f.type }))
      })

      const values = transformSubmissionValues(submissionData.values || submissionData, formData.fields)
      console.log('✅ Transformed submission values for form:', values)
      return values
    }

    // Otherwise, use empty defaults
    const emptyValues = formData.fields.reduce((acc, field) => {
      const fieldId = field.id
      
      if (["select", "checkbox", "radio"].includes(field.type)) {
        if (field.type === "checkbox" || (field.type === "select" && field.validation?.multiple)) {
          acc[fieldId] = {
            value: [],
            nestedField: {}
          }
        } else {
          acc[fieldId] = {
            value: "",
            nestedField: {}
          }
        }
      } else if (field.type === "file") {
        acc[fieldId] = null
      } else if (field.type === "location" || field.type === "phone") {
        acc[fieldId] = {}
      } else {
        acc[fieldId] = ""
      }
      
      return acc
    }, {})

    console.log('Empty default values:', emptyValues)
    return emptyValues
  }

  const handleEditResponse = () => {
    const savedSubmissionId = localStorage.getItem("SUBMISSION_ID")
    const savedEditToken = localStorage.getItem("EDIT_TOKEN")

    console.log('Edit response data:', {
      savedSubmissionId,
      savedEditToken,
      hasExistingSubmission,
      lastSubmissionId,
      lastSubmissionToken
    })

    if (savedSubmissionId && savedEditToken) {
      const editUrl = `${window.location.origin}${window.location.pathname}?token=${savedEditToken}&submission_id=${savedSubmissionId}`
      window.location.href = editUrl
    } else if (lastSubmissionId && lastSubmissionToken) {
      const editUrl = `${window.location.origin}${window.location.pathname}?token=${lastSubmissionToken}&submission_id=${lastSubmissionId}`
      console.log('Navigating to edit URL (fallback):', editUrl)
      window.location.href = editUrl
    } else {
      console.error("Missing submission ID or token for editing", {
        savedSubmissionId,
        savedEditToken,
        lastSubmissionId,
        lastSubmissionToken
      })
      toast.error("Unable to edit response. Missing submission data.")
    }
  }

  const handleSubmitAnotherResponse = () => {
    clearSubmissionFromStorage()
    setSubmissionSuccess(false)
    setHasExistingSubmission(false)
    setIsEditMode(false)
    setSubmissionData(null)

    if (formData) {
      const emptyValues = getEmptyFormValues()
      form.reset(emptyValues)
    }

    toast.success("You can now submit a new response")
  }

  const getEmptyFormValues = () => {
    if (!formData?.fields) return {}

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

  const handleClearSubmission = () => {
    clearSubmissionFromStorage()
    toast.success("Submission cleared. You can now submit a new response.")
  }

  const validateField = (field, value) => {
    const errors = []

    // Required validation
    if (field.required || field.validation?.required) {
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
    if (value && ((typeof value === "string" && value.trim() !== "") || field.type === "phone" || field.type === "file")) {
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

        case "phone": {
          const v = value || {}
          const phoneCountry = PHONE_COUNTRIES.find(c => c.code === v.country) || PHONE_COUNTRIES[0]
          const digits = String(v.number || "").replace(/\D/g, "")
          const expectedLength = phoneCountry.len

          if (digits.length !== expectedLength) {
            errors.push(`Phone number must be ${expectedLength} digits for ${phoneCountry.label}`)
          }
          break
        }

        case "file":
          // File validation - only allow images and PDFs up to 5MB
          const allowedTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/svg+xml',
            'application/pdf'
          ]

          const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf']

          if (value) {
            // Check both MIME type and file extension
            const isValidType = allowedTypes.includes(value.type) ||
              allowedExtensions.some(ext => value.name.toLowerCase().endsWith(ext))

            if (!isValidType) {
              errors.push("Please select only image files (JPEG, PNG, GIF, WebP, SVG) or PDF files")
            }

            const maxSize = 5 * 1024 * 1024 // 5MB
            if (value.size > maxSize) {
              errors.push("File size must be less than 5MB")
            }

            // Validate base64 data exists for new uploads
            if (!value.base64 && !value.isFromBase64) {
              errors.push("Error processing file. Please try uploading again.")
            }
          }
          break
      }
    }

    return errors
  }

  const form = useForm({
    defaultValues: {},
    onSubmit: async ({ value }) => {
      if (hasExistingSubmission && !isEditMode) {
        toast.error("You have already submitted this form. Please use the edit link to modify your response")
        return
      }

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

            const newSubmissionId = result?.submission_id
            const editToken = result?.edit_token
            console.log('Submission editToken:', editToken)

            if (newSubmissionId && editToken) {
              saveSubmissionToStorage(newSubmissionId, editToken)

              setLastSubmissionId(newSubmissionId)
              setLastSubmissionToken(editToken)
              setSubmissionSuccess(true)
              setHasExistingSubmission(true)

              console.log('Edit token generated:', editToken)
              console.log('Submission ID:', newSubmissionId)
              console.log('Saved to localStorage:', {
                submissionId: newSubmissionId,
                editToken: editToken,
                formId: formId
              })

              toast.success("Thank you for your response!")
            } else {
              console.error("Response missing submission_id or edit_token", result);
              toast.error("Submission completed but edit feature unavailable")
            }

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

  // Initialize form with empty values when form data is loaded (for new submissions)
  useEffect(() => {
    if (formData && !isEditMode) {
      const defaultValues = getDefaultValues()
      console.log('🔄 Initializing form with empty values for new submission:', defaultValues)
      form.reset(defaultValues)
    }
  }, [formData, isEditMode])

  // Update form values when submission data is loaded (for edit mode)
  useEffect(() => {
    if (isEditMode && submissionData && formData) {
      const defaultValues = getDefaultValues()
      console.log('🔄 Resetting form with submission data for edit mode:', defaultValues)
      form.reset(defaultValues)
    }
  }, [submissionData, isEditMode, formData])

  // Add this for debugging - after form initialization
  useEffect(() => {
    console.log('Current state:', {
      isEditMode,
      submissionData,
      formData: formData ? {
        form_name: formData.form_name,
        fieldCount: formData.fields?.length
      } : null,
      formValues: form?.state?.values
    })
  }, [isEditMode, submissionData, formData, form?.state?.values])

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
  if ((submissionSuccess && !isEditMode) || (hasExistingSubmission && !isEditMode)) {
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
                {hasExistingSubmission ? "Already Submitted" : "Submission Complete"}
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
                  {hasExistingSubmission ? "Response Recorded" : "Thank You!"}
                </CardTitle>
                <p className="text-muted-foreground mt-2">
                  {hasExistingSubmission ? "You have already submitted a response to this form." : "Your response has been submitted successfully."}
                </p>
              </CardHeader>

              <CardContent className="p-6 text-center">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">What would you like to do next?</h3>
                    <p className="text-sm text-muted-foreground">
                      {hasExistingSubmission ? "You can edit your existing response or clear it to submit a new one." : "You can edit your response or submit another one."}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      onClick={handleEditResponse}
                      className="gap-2"
                      size="lg"
                    >
                      <Edit className="h-4 w-4" />
                      {hasExistingSubmission ? "Edit Your Response" : "Edit Response"}
                    </Button>

                    {hasExistingSubmission ? (
                      <Button
                        variant="outline"
                        onClick={handleSubmitAnotherResponse}
                        className="gap-2"
                        size="lg"
                      >
                        <FileText className="h-4 w-4" />
                        Submit New Response
                      </Button>
                    ) : (
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
                    )}
                  </div>
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
                {/* <Building className="h-6 w-6 text-primary-foreground" /> */}
                <Image
                  src="/SlashLogo.png"
                  alt="SlashRtc Logo"
                  width={40}
                  height={40}
                  quality={75}
                  priority
                  className="object-cover"
                />
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
                      {(fieldApi) => (
                        <div className="space-y-2">
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