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

// Transform form values for API submission - FIXED VERSION
const transformFormValues = (formValues, fields) => {
  const transformedValues = {}

  // Helper function to recursively transform nested values using field IDs
  const transformNestedValues = (nestedFields, parentValue, fieldDefinition) => {
    const result = {}
    
    if (!nestedFields || typeof nestedFields !== 'object') return result
    
    // First, collect all field IDs and their values, prioritizing numeric keys (which contain updated values)
    const fieldValues = {}
    
    // Process numeric keys first (these contain the updated values)
    Object.keys(nestedFields).forEach(key => {
      const value = nestedFields[key]
      
      // Process numeric keys (0, 1, 2, etc.) - these contain the updated values
      if (!isNaN(key) && key !== 'value') {
        // This is a numeric key, process its contents directly
        if (typeof value === 'object' && value !== null) {
          // Recursively process the content of numeric keys
          const nestedResult = transformNestedValues(value, parentValue, fieldDefinition)
          // Merge the nested result into fieldValues
          Object.assign(fieldValues, nestedResult)
        }
        return
      }
    })
    
    // Then process non-numeric keys (these contain the old values)
    Object.keys(nestedFields).forEach(key => {
      const value = nestedFields[key]
      
      // Skip numeric keys (already processed above)
      if (!isNaN(key) && key !== 'value') {
        return
      }

      // Use the key as-is (field ID) - don't try to extract field names
      const fieldId = key
      
      // Only process if we haven't already processed this field ID from numeric keys
      if (fieldValues[fieldId]) {
        return
      }
      
      // Process the value and store it
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Handle nested object structure
        if (value.value !== undefined) {
          // Handle checkbox fields with multiple selections
          let processedValueValue = value.value
          if (Array.isArray(processedValueValue) && processedValueValue.length > 1) {
            // Multiple checkbox selections - create array of objects with nested values
            processedValueValue = processedValueValue.map(optionValue => {
              const checkboxItem = { value: optionValue }
              
              // Find nested fields for this specific option
              if (value.nestedFields && Object.keys(value.nestedFields).length > 0) {
                // Look for nested fields that match this option value
                const optionNestedFields = value.nestedFields[optionValue] || 
                                         value.nestedFields[processedValueValue.indexOf(optionValue)]
                
                if (optionNestedFields) {
                  const processedNested = transformNestedValues(optionNestedFields, optionValue, fieldDefinition)
                  if (Object.keys(processedNested).length > 0) {
                    checkboxItem.nestedValues = processedNested
                  }
                }
              }
              
              return checkboxItem
            })
          } else if (Array.isArray(processedValueValue) && processedValueValue.length === 1) {
            processedValueValue = processedValueValue[0]
          }

          // Store the actual selected value, not the parent option
          const processedValue = {
            value: processedValueValue
          }

          // Add nested values if they exist (but not for multiple checkbox selections)
          if (value.nestedFields && Object.keys(value.nestedFields).length > 0 && 
              !(Array.isArray(value.value) && value.value.length > 1)) {
            const processedNested = transformNestedValues(value.nestedFields, processedValueValue, fieldDefinition)
            if (Object.keys(processedNested).length > 0) {
              processedValue.nestedValues = processedNested
            }
          }

          fieldValues[fieldId] = processedValue
        } else {
          // Direct nested object - process recursively
          const processedNested = transformNestedValues(value, parentValue, fieldDefinition)
          if (Object.keys(processedNested).length > 0) {
            fieldValues[fieldId] = processedNested
          }
        }
      } else if (Array.isArray(value)) {
        // Handle array of nested values (like multiple checkboxes)
        const processedArray = value.map(item => {
          if (typeof item === 'object' && item !== null) {
            // Ensure value is not wrapped in array
            let processedValue = item.value
            if (Array.isArray(processedValue) && processedValue.length === 1) {
              processedValue = processedValue[0]
            }

            const processedItem = {
              value: processedValue,
              ...(item.nestedFields && Object.keys(item.nestedFields).length > 0 && {
                nestedValues: transformNestedValues(item.nestedFields, processedValue, fieldDefinition)
              })
            }
            // Remove empty nestedValues
            if (processedItem.nestedValues && Object.keys(processedItem.nestedValues).length === 0) {
              delete processedItem.nestedValues
            }
            return processedItem
          }
          // Handle simple values that might be arrays
          let processedValue = item
          if (Array.isArray(processedValue) && processedValue.length === 1) {
            processedValue = processedValue[0]
          }
          return { value: processedValue }
        }).filter(item => item.value !== undefined && item.value !== null)
        
        if (processedArray.length > 0) {
          // Only use array if we have multiple items, otherwise use the single value
          if (processedArray.length === 1) {
            // For single values, extract the value directly and ensure it's not wrapped in array
            const singleItem = processedArray[0]
            if (Array.isArray(singleItem.value) && singleItem.value.length === 1) {
              // If the value itself is an array with one item, extract that item
              fieldValues[fieldId] = { value: singleItem.value[0] }
            } else {
              fieldValues[fieldId] = singleItem
            }
          } else {
            fieldValues[fieldId] = processedArray
          }
        }
      } else if (value !== undefined && value !== null) {
        // Handle checkbox fields in nested values - check if this is a checkbox field
        if (Array.isArray(value) && value.length > 1) {
          // This looks like multiple checkbox selections - create array of objects
          const checkboxArray = value.map(optionValue => {
            return { value: optionValue }
          })
          fieldValues[fieldId] = { value: checkboxArray }
        } else if (Array.isArray(value) && value.length === 1) {
          // Single item array - extract the item
          fieldValues[fieldId] = { value: value[0] }
        } else {
          // Simple value
          fieldValues[fieldId] = { value }
        }
      }
    })
    
    // Now copy all field values to the result
    Object.assign(result, fieldValues)
    
    return result
  }

  Object.keys(formValues).forEach(fieldId => {
    const fieldValue = formValues[fieldId]
    const field = fields.find(f => f.id === fieldId)

    if (!field) return

    // Skip empty values for non-required fields
    if (!field.required && !field.validation?.required) {
      let isEmpty = false

      if (fieldValue === null || fieldValue === undefined || fieldValue === '') {
        isEmpty = true
      } else if (Array.isArray(fieldValue) && fieldValue.length === 0) {
        isEmpty = true
      } else if (typeof fieldValue === 'object' && fieldValue !== null) {
        if (field.type === 'location') {
          isEmpty = (!fieldValue.country || fieldValue.country === '') &&
            (!fieldValue.state || fieldValue.state === '') &&
            (!fieldValue.city || fieldValue.city === '')
        } else if (field.type === 'phone') {
          isEmpty = (!fieldValue.country || fieldValue.country === '') &&
            (!fieldValue.number || fieldValue.number === '')
        } else if (field.type === 'file') {
          isEmpty = !fieldValue.name && !fieldValue.base64
        } else if (fieldValue.value !== undefined) {
          // For nested fields, check if the value is empty
          if (Array.isArray(fieldValue.value)) {
            isEmpty = fieldValue.value.length === 0
          } else {
            isEmpty = !fieldValue.value || fieldValue.value === ''
          }
        } else {
          isEmpty = Object.keys(fieldValue).length === 0
        }
      }

      if (isEmpty) {
        return
      }
    }

    // Use the ORIGINAL field ID from the form data, not the parsed one
    const finalFieldKey = field.originalId || fieldId

    // Handle different field types
    switch (field.type) {
      case "select":
        if (field.validation?.multiple) {
          // Multiple select
          if (typeof fieldValue === 'object' && fieldValue !== null) {
            if (fieldValue.value !== undefined || fieldValue.nestedFields) {
              const fieldData = {
                value: fieldValue.value || []
              }

              // Only include nested fields if they exist and are relevant to the selected options
              if (fieldValue.nestedFields && Object.keys(fieldValue.nestedFields).length > 0) {
                const processedNested = transformNestedValues(fieldValue.nestedFields, fieldValue.value, field)
                if (Object.keys(processedNested).length > 0) {
                  fieldData.nestedValues = processedNested
                }
              }

              transformedValues[finalFieldKey] = fieldData
            } else {
              transformedValues[finalFieldKey] = { value: fieldValue }
            }
          } else {
            transformedValues[finalFieldKey] = { value: fieldValue || [] }
          }
        } else {
          // Single select
          if (typeof fieldValue === 'object' && fieldValue !== null) {
            if (fieldValue.value !== undefined || fieldValue.nestedFields) {
              // Ensure value is not wrapped in array for single selections
              let processedValue = fieldValue.value || ""
              if (Array.isArray(processedValue) && processedValue.length === 1) {
                processedValue = processedValue[0]
              }

              const fieldData = {
                value: processedValue
              }

              // Only include nested fields if they exist and are relevant to the selected option
              if (fieldValue.nestedFields && Object.keys(fieldValue.nestedFields).length > 0) {
                const processedNested = transformNestedValues(fieldValue.nestedFields, processedValue, field)
                if (Object.keys(processedNested).length > 0) {
                  fieldData.nestedValues = processedNested
                }
              }

              transformedValues[finalFieldKey] = fieldData
            } else {
              // Fallback for simple values
              let processedValue = fieldValue
              if (Array.isArray(processedValue) && processedValue.length === 1) {
                processedValue = processedValue[0]
              }
              transformedValues[finalFieldKey] = { value: processedValue }
            }
          } else {
            // Handle direct values that might be arrays
            let processedValue = fieldValue || ""
            if (Array.isArray(processedValue) && processedValue.length === 1) {
              processedValue = processedValue[0]
            }
            transformedValues[finalFieldKey] = { value: processedValue }
          }
        }
        break

      case "checkbox":
        // Handle checkbox fields with multiple selections
        if (typeof fieldValue === 'object' && fieldValue !== null) {
          if (fieldValue.value !== undefined || fieldValue.nestedFields) {
            let processedValue = fieldValue.value

            // For checkboxes, handle multiple selections properly
            if (Array.isArray(processedValue)) {
              // Multiple checkbox selections - create array of objects
              const checkboxArray = processedValue.map(optionValue => {
                const checkboxItem = { value: optionValue }
                
                // Find nested fields for this specific option
                if (fieldValue.nestedFields && Object.keys(fieldValue.nestedFields).length > 0) {
                  // Look for nested fields that match this option value
                  const optionNestedFields = fieldValue.nestedFields[optionValue] || 
                                           fieldValue.nestedFields[processedValue.indexOf(optionValue)]
                  
                  if (optionNestedFields) {
                    const processedNested = transformNestedValues(optionNestedFields, optionValue, field)
                    if (Object.keys(processedNested).length > 0) {
                      checkboxItem.nestedValues = processedNested
                    }
                  }
                }
                
                return checkboxItem
              })
              
              transformedValues[finalFieldKey] = { value: checkboxArray }
            } else {
              // Single checkbox selection
              const fieldData = { value: processedValue }
              
              if (fieldValue.nestedFields && Object.keys(fieldValue.nestedFields).length > 0) {
                const processedNested = transformNestedValues(fieldValue.nestedFields, processedValue, field)
                if (Object.keys(processedNested).length > 0) {
                  fieldData.nestedValues = processedNested
                }
              }
              
              transformedValues[finalFieldKey] = fieldData
            }
          } else {
            // Fallback for simple values
            let processedValue = fieldValue
            if (Array.isArray(processedValue) && processedValue.length === 1) {
              processedValue = processedValue[0]
            }
            transformedValues[finalFieldKey] = { value: processedValue }
          }
        } else {
          // Handle direct values that might be arrays
          let processedValue = fieldValue
          if (Array.isArray(processedValue) && processedValue.length === 1) {
            processedValue = processedValue[0]
          }
          transformedValues[finalFieldKey] = { value: processedValue }
        }
        break

      case "radio":
        // Handle radio fields with single selection
        if (typeof fieldValue === 'object' && fieldValue !== null) {
          if (fieldValue.value !== undefined || fieldValue.nestedFields) {
            // Ensure value is not wrapped in array for single selections
            let processedValue = fieldValue.value
            if (Array.isArray(processedValue) && processedValue.length === 1) {
              processedValue = processedValue[0]
            }

            const fieldData = {
              value: processedValue
            }

            // Add nested values if they exist
            if (fieldValue.nestedFields && Object.keys(fieldValue.nestedFields).length > 0) {
              const processedNested = transformNestedValues(fieldValue.nestedFields, processedValue, field)
              if (Object.keys(processedNested).length > 0) {
                fieldData.nestedValues = processedNested
              }
            }

            transformedValues[finalFieldKey] = fieldData
          } else {
            // Fallback for simple values
            let processedValue = fieldValue
            if (Array.isArray(processedValue) && processedValue.length === 1) {
              processedValue = processedValue[0]
            }
            transformedValues[finalFieldKey] = { value: processedValue }
          }
        } else {
          // Handle direct values that might be arrays
          let processedValue = fieldValue
          if (Array.isArray(processedValue) && processedValue.length === 1) {
            processedValue = processedValue[0]
          }
          transformedValues[finalFieldKey] = { value: processedValue }
        }
        break

      case "file":
        if (fieldValue && typeof fieldValue === 'object' && fieldValue.base64) {
          transformedValues[finalFieldKey] = { value: fieldValue.base64 }
        } else if (fieldValue && typeof fieldValue === 'string' && fieldValue.startsWith('data:')) {
          transformedValues[finalFieldKey] = { value: fieldValue }
        } else {
          transformedValues[finalFieldKey] = { value: "" }
        }
        break

      case "location":
        if (typeof fieldValue === 'object' && fieldValue !== null) {
          const locationData = {
            value: "location",
            nestedValues: {
              country: { value: fieldValue.country || "" },
              state: { value: fieldValue.state || "" },
              city: { value: fieldValue.city || "" }
            }
          }
          transformedValues[finalFieldKey] = locationData
        } else {
          transformedValues[finalFieldKey] = { value: "" }
        }
        break

      case "phone":
        if (typeof fieldValue === 'object' && fieldValue !== null) {
          const phoneData = {
            value: "phone",
            nestedValues: {
              country: { value: fieldValue.country || "" },
              number: { value: fieldValue.number || "" }
            }
          }
          transformedValues[finalFieldKey] = phoneData
        } else {
          transformedValues[finalFieldKey] = { value: "" }
        }
        break

      default:
        // Text, email, number, textarea
        transformedValues[finalFieldKey] = { value: fieldValue || "" }
    }
  })

  return transformedValues
}

// Transform submission values for form display
const transformSubmissionValues = (submissionValues, fields) => {
  const transformedValues = {}

  if (!submissionValues || typeof submissionValues !== 'object') {
    console.log('No submission values to transform')
    return transformedValues
  }

  // Helper function to recursively transform API nestedValues to nestedFields structure
  const transformApiNestedValuesToNestedFields = (nestedValues) => {
    if (!nestedValues || typeof nestedValues !== 'object') return {}

    const result = {}

    Object.keys(nestedValues).forEach(key => {
      const value = nestedValues[key]
      
      if (typeof value === 'object' && value !== null) {
        if (value.value !== undefined) {
          // Transform nestedValues to nestedFields structure
          result[key] = {
            value: value.value,
            ...(value.nestedValues && Object.keys(value.nestedValues).length > 0 && {
              nestedFields: transformApiNestedValuesToNestedFields(value.nestedValues)
            })
          }
        } else {
          // Direct nested object
          result[key] = transformApiNestedValuesToNestedFields(value)
        }
      } else {
        // Simple value
        result[key] = value
      }
    })

    return result
  }

  // Helper function to process the main field values
  const processFieldValue = (fieldId, fieldValue, field) => {
    console.log(`🔄 Processing field ${fieldId}:`, { fieldValue, fieldType: field?.type })
    
    // Handle JSON strings from API
    let parsedValue = fieldValue
    if (typeof fieldValue === 'string') {
      try {
        parsedValue = JSON.parse(fieldValue)
      } catch (e) {
        parsedValue = fieldValue
      }
    }

    // Handle different field types
    if (typeof parsedValue === 'object' && parsedValue !== null && parsedValue.value !== undefined) {
      const processedValue = {
        value: parsedValue.value
      }

      // Process nested values from API and convert nestedValues to nestedFields
      if (parsedValue.nestedValues) {
        processedValue.nestedFields = transformApiNestedValuesToNestedFields(parsedValue.nestedValues)
      }

      return processedValue
    } else {
      // Simple value or unparsed string
      return parsedValue
    }
  }

  fields.forEach(field => {
    const fieldId = field.id
    let fieldValue = submissionValues[fieldId]

    console.log(`🔍 Looking for field ${fieldId} (${field.label}):`, { 
      fieldValue, 
      submissionKeys: Object.keys(submissionValues),
      originalId: field.originalId 
    })

    // If not found by parsed form ID, try the original field ID from API
    if (fieldValue === undefined && field.originalId) {
      console.log(`🔄 Trying original ID ${field.originalId} for field ${fieldId}`)
      fieldValue = submissionValues[field.originalId]
      console.log(`✅ Found value with original ID:`, fieldValue)
    }

    // If still not found, try other fallback methods
    if (fieldValue === undefined) {
      // Try to find by field name or other identifiers
      const possibleKeys = [
        fieldId, // parsed form ID (select_field)
        field.name, // field name (select_field)
        ...Object.keys(submissionValues).filter(key => 
          key === fieldId ||
          key === field.name ||
          key.includes(fieldId) ||
          key.includes(field.name) ||
          (field.originalId && key === field.originalId)
        )
      ]

      // Also try to match by field structure - look for any key that contains our field data
      for (const key of Object.keys(submissionValues)) {
        const value = submissionValues[key]
        // If this looks like our field data, use it
        if (typeof value === 'string' && value.includes(field.name)) {
          fieldValue = value
          break
        }
      }

      // If still not found, use the first available key (fallback)
      if (fieldValue === undefined && Object.keys(submissionValues).length > 0) {
        const firstKey = Object.keys(submissionValues)[0]
        fieldValue = submissionValues[firstKey]
      }
    }

    if (fieldValue !== undefined && fieldValue !== null) {
      const processedValue = processFieldValue(fieldId, fieldValue, field)
      transformedValues[fieldId] = processedValue
    } else {
      // Set appropriate defaults
      const defaultValue = field.type === "checkbox" || (field.type === "select" && field.validation?.multiple)
        ? { value: [], nestedFields: {} }
        : field.type === "file"
          ? null
          : field.type === "location" || field.type === "phone"
            ? {}
            : ""
      
      transformedValues[fieldId] = defaultValue
    }
  })

  console.log('Final transformed values for form:', transformedValues)
  return transformedValues
}

// Debug function to log form state
const debugFormState = (formValues, fields) => {
  console.log('🔍 DEBUG - Current Form State Before Submission:')
  fields.forEach(field => {
    const fieldValue = formValues[field.id]
    console.log(`Field: ${field.label} (${field.id})`, {
      value: fieldValue,
      type: typeof fieldValue,
      structure: fieldValue ? Object.keys(fieldValue) : 'no value',
      actualValue: fieldValue?.value
    })
  })
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
  const [formInitialized, setFormInitialized] = useState(false)

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
        toast.error('Failed to load phone countries')
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
          reference_id: USER_ID,
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

      console.log('Full API response:', result)

      // Handle the response format where values are JSON strings
      if (result.success && result.submission) {
        console.log('Submission data found:', result.submission)
        
        // Parse any JSON strings in the values
        const parsedSubmission = {
          ...result.submission,
          values: {}
        }
        
        // Parse each field value if it's a JSON string and transform nested structure
        Object.keys(result.submission.values || {}).forEach(key => {
          const value = result.submission.values[key]
          if (typeof value === 'string') {
            try {
              const parsedValue = JSON.parse(value)
              parsedSubmission.values[key] = parsedValue
            } catch (e) {
              parsedSubmission.values[key] = value
            }
          } else {
            parsedSubmission.values[key] = value
          }
        })
        
        // Now transform the parsed values using the existing transformation logic
        if (formData?.fields) {
          const transformedValues = transformSubmissionValues(parsedSubmission.values, formData.fields)
          parsedSubmission.values = transformedValues
        }
        
        setSubmissionData(parsedSubmission)
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

  // Helper function to parse nested fields
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
        isLeadColumn: nestedField.isLeadColumn === true || nestedField.isLeadColumn === 'true',
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
                  console.log(`✅ Parsed options for field ${fieldData.label}:`, options)
                } catch (e) {
                  console.error(`❌ Failed to parse options for field ${fieldData.label}:`, e)
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
                console.log(`✅ Processed nested fields for option ${option.value}:`, processedOption.nestedFields)
              }

              return processedOption
            })
            
            console.log(`✅ Final processed options for field ${fieldData.label}:`, processedOptions)

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
                  name: nestedField.name,
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
              id: fieldData.name || fieldData.id || `field-${index}-${Date.now()}`,
              originalId: fieldData.id, // Store original ID for reference
              name: fieldData.name,
              type: fieldData.type || 'text',
              label: fieldData.label || fieldData.name || 'Field',
              placeholder: fieldData.placeholder || '',
              required: isRequired,
              isLeadColumn: fieldData.isLeadColumn === true || fieldData.isLeadColumn === 'true',
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

            return parsedField
          }

          // Default fallback
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

      return parsedForm

    } catch (error) {
      console.error('❌ Error parsing form data:', error)
      throw new Error('Failed to parse form data: ' + error.message)
    }
  }

  const fetchFormData = async () => {
    try {

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

  // Get default values for form initialization
  const getDefaultValues = () => {
    if (!formData?.fields) {
      return {}
    }

    // If we have submission data in edit mode, use that
    if (isEditMode && submissionData && submissionData.values) {
      console.log('📝 Processing submission data for edit mode:', {
        submissionValues: submissionData.values,
        submissionDataKeys: Object.keys(submissionData.values),
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
    setFormInitialized(false)

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
    defaultValues: getDefaultValues(),
    onSubmit: async ({ value }) => {
      // Debug the current form state before submission
      debugFormState(value, formData?.fields || [])
      
      if (hasExistingSubmission && !isEditMode) {
        toast.error("You have already submitted this form. Please use the edit link to modify your response")
        return
      }

      console.log('Form values:', value)

      setSubmitting(true)
      try {
        // Transform form values to match API expected format
        const transformedValues = transformFormValues(value, formData?.fields || [])

        if (isEditMode) {
          console.log('=== UPDATE DEBUG ===')
          console.log('Original form values:', value)
          console.log('Transformed values:', transformedValues)
          console.log('Form schema fields:', formData.fields.map(f => ({
            id: f.id,
            originalId: f.originalId,
            type: f.type,
            label: f.label
          })))
          
          // Check if nested field IDs match between form schema and values
          formData.fields.forEach(field => {
            if (field._processedOptions) {
              field._processedOptions.forEach((option, idx) => {
                if (option.nestedFields && option.nestedFields.length > 0) {
                  console.log(`Option "${option.value}" nested fields:`, 
                    option.nestedFields.map(nf => ({ id: nf.id, name: nf.name }))
                  )
                }
              })
            }
          })
          
          // Log the actual submission payload before sending
          const updateData = {
            organization_id: ORGANIZATION_ID,
            form_id: formId,
            reference_id: USER_ID,
            submission_id: submissionId,
            values: transformedValues
          }
          console.log('Final update payload:', JSON.stringify(updateData, null, 2))
          console.log('=== END DEBUG ===')

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
            reference_id: USER_ID,
            form_id: formId,
            reference_id: USER_ID,
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
    if (formData && form && !formInitialized) {
      const initializeForm = async () => {
        if (isEditMode) {
          // Wait for submission data to be available
          if (submissionData) {
            const defaultValues = getDefaultValues()
            console.log('🔄 Initializing form with submission data:', defaultValues)
            await form.reset(defaultValues)
            setFormInitialized(true)
          }
        } else {
          // New form - initialize with empty values
          const defaultValues = getDefaultValues()
          console.log('🔄 Initializing new form with empty values:', defaultValues)
          await form.reset(defaultValues)
          setFormInitialized(true)
        }
      }

      initializeForm()
    }
  }, [formData, form, isEditMode, submissionData, formInitialized])

  // Reset formInitialized when mode changes
  useEffect(() => {
    setFormInitialized(false)
  }, [isEditMode, formId])

  // Add a debug effect to track form state changes
  useEffect(() => {
    console.log('Form State Update:', {
      isEditMode,
      formInitialized,
      submissionData: !!submissionData,
      formData: !!formData,
      formValues: form?.state?.values
    })
  }, [isEditMode, formInitialized, submissionData, formData, form?.state?.values])

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

  if (loading || (isEditMode && !formInitialized)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground">
              {isEditMode ? "Loading your submission..." : "Loading form..."}
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
                        // Debug logging for all fields to see current values
                        console.log(`🎯 Field ${field.id} current value:`, fieldApi.state.value)

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