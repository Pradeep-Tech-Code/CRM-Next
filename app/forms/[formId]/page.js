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
import axios from "axios"
import Link from "next/link"
import Image from "next/image"
import { useParams, useSearchParams } from "next/navigation"
import { fetchPhoneCountries } from "@/lib/constants/location-api"

// API configuration
const API_BASE_URL = 'http://10.10.15.194:3001'
const ORGANIZATION_ID = 'c8c72c21-7b5c-435a-912a-803105e7ecc9'
const TABLE_ID = '040e899d-583a-454e-92e6-d0d5a8095587'
const USER_ID = 'c2a985ce-d385-4349-8f0c-d46e63027ce4'

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

// Helper function to process field options with nested structure
const processFieldOptions = (field) => {
  // If we have processed options with nested structure, use those
  if (field._processedOptions && Array.isArray(field._processedOptions)) {
    return field._processedOptions.map(option => {
      if (typeof option === 'object' && option !== null) {
        return {
          value: option.value,
          label: option.label,
          nestedFields: option.nestedFields || []
        }
      } else {
        return option
      }
    })
  }
  
  // Fallback to regular options
  return field.options || []
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
  const [phoneCountries, setPhoneCountries] = useState([])

  useEffect(() => {
    if (formId) {
      checkExistingSubmission()
      fetchFormData()
    }
  }, [formId])

  // Load phone countries from API
  useEffect(() => {
    const loadPhoneCountries = async () => {
      try {
        const countries = await fetchPhoneCountries()
        setPhoneCountries(countries)
      } catch (error) {
        console.error('Failed to load phone countries:', error)
        // Fallback to a minimal set if API fails
        setPhoneCountries([
          { code: '+1', label: 'US/Canada', len: 10 },
          { code: '+44', label: 'UK', len: 10 },
          { code: '+91', label: 'India', len: 10 }
        ])
      }
    }

    loadPhoneCountries()
  }, [])

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

      const response = await axios.post(
        `${API_BASE_URL}/api/submit/edit?token=${token}`,
        {
          organization_id: ORGANIZATION_ID,
          form_id: formId,
          submission_id: submissionId
        },
        {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json'
          }
        }
      )
      const result = response.data

      console.log('Submission data response:', result)

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

  // Helper function to recursively parse nested fields
  const parseNestedFields = (nestedFieldsArray) => {
    if (!Array.isArray(nestedFieldsArray)) return []
    
    return nestedFieldsArray.map(nestedField => {
      // Parse options if they exist as JSON string
      let options = []
      if (nestedField.options) {
        if (typeof nestedField.options === 'string') {
          try {
            options = JSON.parse(nestedField.options)
          } catch (e) {
            console.warn('Failed to parse nested field options:', nestedField.options)
            options = []
          }
        } else if (Array.isArray(nestedField.options)) {
          options = nestedField.options
        }
      }

      // Recursively parse nested fields within options
      const processedOptions = options.map(option => {
        const processedOption = {
          value: option.value || option,
          label: option.label || option.value || option,
          nestedFields: []
        }

        // Recursively process nested fields for this option
        if (option.nestedFields && Array.isArray(option.nestedFields)) {
          processedOption.nestedFields = parseNestedFields(option.nestedFields)
        }

        return processedOption
      })

      return {
        id: nestedField.id,
        name: nestedField.name,
        label: nestedField.label,
        type: nestedField.type,
        required: nestedField.required === true || nestedField.required === 'true',
        validations: typeof nestedField.validations === 'string' ? 
          JSON.parse(nestedField.validations || '{}') : 
          (nestedField.validations || {}),
        hasNested: nestedField.hasNested === true || nestedField.hasNested === 'true',
        options: processedOptions
      }
    })
  }

  // Helper function to parse form data from API
  const parseFormData = (apiForm) => {
    try {
      let parsedFields = []

      console.log('Raw API form fields:', apiForm.fields)

      // Handle different field formats
      if (Array.isArray(apiForm.fields)) {
        parsedFields = apiForm.fields.map((field, index) => {
          let fieldData = field

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
          if (typeof fieldData === 'string') {
            try {
              fieldData = JSON.parse(fieldData)
            } catch (parseError) {
              console.warn(`Failed to parse field ${index} as JSON string:`, fieldData)
            }
          }

          // Now process the field data
          if (fieldData && typeof fieldData === 'object') {
            console.log(`Processing field ${index}:`, fieldData)

            // Parse options from JSON string if needed
            let options = []
            if (fieldData.options) {
              if (typeof fieldData.options === 'string') {
                try {
                  options = JSON.parse(fieldData.options)
                  console.log(`✅ Successfully parsed options for field ${fieldData.label}:`, options)
                } catch (e) {
                  console.error(`❌ Failed to parse options JSON for field ${fieldData.label}:`, fieldData.options)
                  // Fallback: try to split by commas for simple options
                  if (typeof fieldData.options === 'string') {
                    options = fieldData.options.split(',').map(opt => opt.trim()).filter(opt => opt)
                  }
                }
              } else if (Array.isArray(fieldData.options)) {
                options = fieldData.options
              }
            }

            // Recursively process nested fields structure
            const processedOptions = options.map(option => {
              const processedOption = {
                value: option.value || option,
                label: option.label || option.value || option,
                nestedFields: []
              }

              // Recursively process nested fields for this option
              if (option.nestedFields && Array.isArray(option.nestedFields)) {
                processedOption.nestedFields = parseNestedFields(option.nestedFields)
              }

              return processedOption
            })

            // Parse validation
            let validation = {}
            if (fieldData.validations) {
              if (typeof fieldData.validations === 'string') {
                try {
                  validation = JSON.parse(fieldData.validations)
                } catch (e) {
                  console.warn('Failed to parse validations as JSON:', fieldData.validations)
                }
              } else if (typeof fieldData.validations === 'object') {
                validation = fieldData.validations
              }
            } else if (fieldData.validation) {
              if (typeof fieldData.validation === 'string') {
                try {
                  validation = JSON.parse(fieldData.validation)
                } catch (e) {
                  console.warn('Failed to parse validation as JSON:', fieldData.validation)
                }
              } else if (typeof fieldData.validation === 'object') {
                validation = fieldData.validation
              }
            }

            // Handle required field
            const isRequired = fieldData.required === true || fieldData.required === 'true' || false

            // Build nestedFields structure for backward compatibility with FieldRenderer
            const nestedFields = {}
            processedOptions.forEach((option, optionIndex) => {
              if (option.nestedFields && option.nestedFields.length > 0) {
                nestedFields[optionIndex] = option.nestedFields.map(nestedField => ({
                  id: nestedField.id,
                  type: nestedField.type,
                  label: nestedField.label,
                  placeholder: nestedField.placeholder || '',
                  required: nestedField.required || false,
                  validation: nestedField.validations || {},
                  options: nestedField.options || [],
                  nestedFields: nestedField.nestedFields || {}
                }))
              }
            })

            const parsedField = {
              id: fieldData.id || fieldData.name || `field-${index}-${Date.now()}`,
              type: fieldData.type || 'text',
              label: fieldData.label || fieldData.name || 'Field',
              placeholder: fieldData.placeholder || '',
              required: isRequired,
              options: processedOptions.map(opt => opt.value || opt), // For simple option values
              nestedFields: nestedFields,
              validation: {
                required: isRequired,
                multiple: validation.multiple || false,
                min: validation.min,
                max: validation.max,
                accept: validation.accept,
                pattern: validation.pattern,
                ...validation
              },
              // Store the full processed options for nested rendering
              _processedOptions: processedOptions
            }

            console.log(`✅ Final parsed field ${parsedField.label}:`, {
              id: parsedField.id,
              type: parsedField.type,
              options: parsedField.options,
              nestedFields: parsedField.nestedFields,
              hasNested: Object.keys(parsedField.nestedFields).length > 0
            })

            return parsedField
          }

          // Default fallback
          console.warn(`Field ${index} could not be parsed, using default`)
          return {
            id: `field-${index}-${Date.now()}`,
            type: 'text',
            label: 'Text Field',
            placeholder: 'Enter text',
            required: false,
            options: [],
            nestedFields: {},
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

      console.log('✅ Final parsed form:', parsedForm)
      return parsedForm

    } catch (error) {
      console.error('❌ Error parsing form data:', error)
      throw new Error('Failed to parse form data: ' + error.message)
    }
  }

  const fetchFormData = async () => {
    try {
      console.log('🔍 Fetching form data for ID:', formId)
      console.log('🌐 API URL:', `${API_BASE_URL}/api/forms/${ORGANIZATION_ID}/${TABLE_ID}/${formId}`)

      const response = await axios.get(
        `${API_BASE_URL}/api/forms/${ORGANIZATION_ID}/${TABLE_ID}/${formId}`,
        {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json',
          }
        }
      )
      const result = response.data
      console.log('📡 Response:', result)

      if (result.success && result.form) {
        try {
          const parsedForm = parseFormData(result.form)
          console.log('✅ Parsed form data:', parsedForm)
          setFormData(parsedForm)
        } catch (parseError) {
          console.error('❌ Error parsing form data:', parseError)
          toast.error('Failed to parse form data. The form may be corrupted.')
          setFormData({
            form_name: 'Error Loading Form',
            description: 'Unable to load form data',
            fields: []
          })
        }
      } else {
        throw new Error('Form not found in response: ' + JSON.stringify(result))
      }

    } catch (error) {
      console.error('❌ Error fetching form:', error)

      if (error.response?.status === 404) {
        toast.error(`Form not found. The form with ID "${formId}" does not exist or has been deleted.`)
        setFormData({
          form_name: 'Form Not Found',
          description: 'The requested form could not be found.',
          fields: []
        })
      } else if (error.response?.status === 401) {
        toast.error('Authentication failed. Please check your authentication token.')
        setFormData({
          form_name: 'Authentication Error',
          description: 'Unable to access this form due to authentication issues.',
          fields: []
        })
      } else if (error.response?.status === 403) {
        toast.error('Access forbidden. You do not have permission to access this form.')
        setFormData({
          form_name: 'Access Denied',
          description: 'You do not have permission to access this form.',
          fields: []
        })
      } else {
        toast.error(`Failed to load form: ${error.message}`)
        setFormData({
          form_name: 'Error Loading Form',
          description: 'An error occurred while loading the form.',
          fields: []
        })
      }

    } finally {
      setLoading(false)
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
        // First, try to parse JSON strings for fields that might have nested values
        let parsedValue = fieldValue
        if (typeof fieldValue === 'string' && (fieldValue.startsWith('{') || fieldValue.startsWith('['))) {
          try {
            parsedValue = JSON.parse(fieldValue)
            console.log(`📝 Parsed JSON for field ${fieldId}:`, parsedValue)
          } catch (e) {
            console.log(`⚠️ Failed to parse JSON for field ${fieldId}:`, fieldValue)
            parsedValue = fieldValue
          }
        }

        // Handle different field types
        switch (field.type) {
          case "checkbox":
            console.log(`🔍 Processing checkbox field ${fieldId}:`, {
              fieldValidation: field.validation,
              isMultiple: field.validation?.multiple,
              hasOptions: field.options && field.options.length > 0,
              parsedValue,
              fieldValue
            })

            // For checkbox fields, if they have options, treat them as multiple by default
            const isMultipleCheckbox = field.validation?.multiple || (field.options && field.options.length > 0)

            if (isMultipleCheckbox) {
              // Multiple checkbox with nested values
              if (typeof parsedValue === 'object' && parsedValue !== null && parsedValue.value !== undefined) {
                // Handle structured format: {value: [], nestedValues: {}}
                const result = {
                  value: Array.isArray(parsedValue.value) ? parsedValue.value : [],
                  nestedFields: parsedValue.nestedValues || parsedValue.nestedFields || {}
                }
                console.log(`✅ Checkbox multiple structured result for ${fieldId}:`, result)
                transformedValues[fieldId] = result
              } else if (Array.isArray(parsedValue)) {
                const result = {
                  value: parsedValue,
                  nestedFields: {}
                }
                console.log(`✅ Checkbox multiple array result for ${fieldId}:`, result)
                transformedValues[fieldId] = result
              } else {
                const result = {
                  value: [parsedValue],
                  nestedFields: {}
                }
                console.log(`✅ Checkbox multiple single value result for ${fieldId}:`, result)
                transformedValues[fieldId] = result
              }
            } else {
              // Single checkbox - convert to boolean
              const result = Boolean(parsedValue)
              console.log(`✅ Checkbox single result for ${fieldId}:`, result)
              transformedValues[fieldId] = result
            }
            break

          case "select":
            if (field.validation?.multiple) {
              // Multiple select with nested values
              if (typeof parsedValue === 'object' && parsedValue !== null && parsedValue.value !== undefined) {
                // Handle structured format: {value: [], nestedValues: {}}
                transformedValues[fieldId] = {
                  value: Array.isArray(parsedValue.value) ? parsedValue.value : [],
                  nestedFields: parsedValue.nestedValues || parsedValue.nestedFields || {}
                }
              } else if (Array.isArray(parsedValue)) {
                transformedValues[fieldId] = {
                  value: parsedValue,
                  nestedFields: {}
                }
              } else {
                transformedValues[fieldId] = {
                  value: [parsedValue],
                  nestedFields: {}
                }
              }
            } else {
              // Single select with nested values
              if (typeof parsedValue === 'object' && parsedValue !== null && parsedValue.value !== undefined) {
                // Handle structured format: {value: "Option 1", nestedValues: {}}
                transformedValues[fieldId] = {
                  value: parsedValue.value || "",
                  nestedFields: parsedValue.nestedValues || parsedValue.nestedFields || {}
                }
              } else {
                transformedValues[fieldId] = {
                  value: parsedValue || "",
                  nestedFields: {}
                }
              }
            }
            break

          case "radio":
            // Radio with nested values
            if (typeof parsedValue === 'object' && parsedValue !== null && parsedValue.value !== undefined) {
              // Handle structured format: {value: "Option 1", nestedValues: {}}
              transformedValues[fieldId] = {
                value: parsedValue.value || "",
                nestedFields: parsedValue.nestedValues || parsedValue.nestedFields || {}
              }
            } else {
              transformedValues[fieldId] = {
                value: parsedValue || "",
                nestedFields: {}
              }
            }
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
          // Handle checkbox with nested values
          if (typeof fieldValue === 'object' && fieldValue !== null && fieldValue.value !== undefined) {
            const checkboxData = {
              value: Array.isArray(fieldValue.value) ? fieldValue.value : []
            }

            // Add nested values if they exist
            if (fieldValue.nestedFields) {
              checkboxData.nestedValues = fieldValue.nestedFields
            }

            transformedValues[fieldId] = checkboxData
          } else {
            transformedValues[fieldId] = Array.isArray(fieldValue) ? fieldValue : []
          }
          break

        case "select":
          if (field.validation?.multiple) {
            // Multiple select with nested values
            if (typeof fieldValue === 'object' && fieldValue !== null && fieldValue.value !== undefined) {
              const selectData = {
                value: Array.isArray(fieldValue.value) ? fieldValue.value : []
              }

              // Add nested values if they exist
              if (fieldValue.nestedFields) {
                selectData.nestedValues = fieldValue.nestedFields
              }

              transformedValues[fieldId] = selectData
            } else {
              transformedValues[fieldId] = Array.isArray(fieldValue) ? fieldValue : []
            }
          } else {
            // Single select with nested values
            if (typeof fieldValue === 'object' && fieldValue !== null && fieldValue.value !== undefined) {
              const selectData = {
                value: fieldValue.value || ""
              }

              // Add nested values if they exist
              if (fieldValue.nestedFields) {
                selectData.nestedValues = fieldValue.nestedFields
              }

              transformedValues[fieldId] = selectData
            } else {
              transformedValues[fieldId] = fieldValue || ""
            }
          }
          break

        case "radio":
          // Radio with nested values
          if (typeof fieldValue === 'object' && fieldValue !== null && fieldValue.value !== undefined) {
            const radioData = {
              value: fieldValue.value || ""
            }

            // Add nested values if they exist
            if (fieldValue.nestedFields) {
              radioData.nestedValues = fieldValue.nestedFields
            }

            transformedValues[fieldId] = radioData
          } else {
            transformedValues[fieldId] = fieldValue || ""
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

      const values = transformSubmissionValues(submissionData.values, formData.fields)
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
            nestedFields: {}
          }
        } else {
          acc[fieldId] = {
            value: "",
            nestedFields: {}
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

      if (["select", "checkbox", "radio"].includes(field.type)) {
        if (field.type === "checkbox" || (field.type === "select" && field.validation?.multiple)) {
          acc[fieldId] = {
            value: [],
            nestedFields: {}
          }
        } else {
          acc[fieldId] = {
            value: "",
            nestedFields: {}
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
          const phoneCountry = phoneCountries.find(c => c.code === v.country) || phoneCountries[0]
          const digits = String(v.number || "").replace(/\D/g, "")
          const expectedLength = phoneCountry?.len || 10

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

          const response = await axios.post(`${API_BASE_URL}/api/submit/update?token=${token}`, updateData, {
            headers: {
              'Content-Type': 'application/json',
            }
          })

          const result = response.data
          console.log('Update successful:', result)
          toast.success("Form updated successfully!")
          setSubmissionSuccess(true)
        } else {
          // Create new submission
          const submissionData = {
            organization_id: ORGANIZATION_ID,
            form_id: formId,
            values: transformedValues
          }

          console.log('Form submission data:', submissionData)

          const response = await axios.post(`${API_BASE_URL}/api/submit`, submissionData, {
            headers: {
              'Content-Type': 'application/json',
            }
          })

          const result = response.data
          console.log('Submission successful:', result)

          if (result.success && result.data) {
            const newSubmissionId = result.data
            console.log('Submission ID from data field:', newSubmissionId)

            const editToken = newSubmissionId

            console.log('Generated edit token:', editToken)

            if (newSubmissionId) {
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
              console.error("Response missing submission ID in data field", result);
              toast.error("Submission completed but edit feature unavailable")
            }
          } else {
            // Fallback to old format handling for backward compatibility
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

  // Initialize form values based on mode
  useEffect(() => {
    if (formData) {
      if (isEditMode && submissionData) {
        const defaultValues = getDefaultValues()
        console.log('🔄 Resetting form with submission data for edit mode:', defaultValues)
        console.log('🔄 Form values before reset:', form.state.values)

        // Only reset if the values are actually different
        const currentValues = form.state.values
        const hasChanges = Object.keys(defaultValues).some(key =>
          JSON.stringify(currentValues[key]) !== JSON.stringify(defaultValues[key])
        )

        if (hasChanges || Object.keys(currentValues).length === 0) {
          form.reset(defaultValues)
          console.log('🔄 Form values after reset:', form.state.values)
        } else {
          console.log('🔄 Form values already match, skipping reset')
        }
      } else if (!isEditMode && !submissionData) {
        // New submission mode: load empty values (only if not in edit mode and no submission data)
        const defaultValues = getDefaultValues()
        console.log('🔄 Initializing form with empty values for new submission:', defaultValues)
        form.reset(defaultValues)
      }
    }
  }, [formData, isEditMode, submissionData])

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

  // Debug parsed form data structure
  useEffect(() => {
    if (formData) {
      console.log('🔍 Debug: Parsed Form Data Structure')
      formData.fields.forEach((field, index) => {
        console.log(`Field ${index}: ${field.label} (${field.type})`, {
          id: field.id,
          options: field.options,
          nestedFields: field.nestedFields,
          hasProcessedOptions: !!field._processedOptions,
          processedOptions: field._processedOptions
        })
        
        // Log nested structure
        if (field._processedOptions) {
          field._processedOptions.forEach((option, optIndex) => {
            if (option.nestedFields && option.nestedFields.length > 0) {
              console.log(`  Option ${optIndex}: "${option.value}" has ${option.nestedFields.length} nested fields`)
              option.nestedFields.forEach((nested, nestedIndex) => {
                console.log(`    Nested Field ${nestedIndex}: ${nested.label} (${nested.type})`)
              })
            }
          })
        }
      })
    }
  }, [formData])

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
              <div className="w-10 h-10 rounded-lg bg-transparent flex items-center justify-center">
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
                  const fieldKey = field.id || `field-${index}`
                  
                  // Process the field to ensure options and nested fields are properly structured
                  const processedField = {
                    ...field,
                    options: processFieldOptions(field)
                  }

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
                      {(fieldApi) => {
                        // Debug logging for checkbox fields
                        if (field.type === 'checkbox') {
                          const isMultipleCheckbox = field.validation?.multiple || (field.options && field.options.length > 0)
                          console.log(`🎯 FieldRenderer for checkbox ${field.id}:`, {
                            fieldId: field.id,
                            fieldType: field.type,
                            fieldValidation: field.validation,
                            isMultipleCheckbox,
                            hasOptions: field.options && field.options.length > 0,
                            fieldApiValue: fieldApi.state.value,
                            fieldApiValueType: typeof fieldApi.state.value,
                            fieldApiValueStructure: fieldApi.state.value ? Object.keys(fieldApi.state.value) : 'no value'
                          })
                        }

                        return (
                          <div className="space-y-2">
                            <FieldRenderer
                              field={processedField}
                              value={fieldApi.state.value}
                              onChange={fieldApi.handleChange}
                              invalid={fieldApi.state.meta.errors.length > 0}
                              error={fieldApi.state.meta.errors.length > 0 ? fieldApi.state.meta.errors[0] : undefined}
                            />
                          </div>
                        )
                      }}
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