"use client"

import { useEffect, useState } from "react"
import { FormPreview } from "../component/formbuilder/form-preview"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, FileText } from "lucide-react"

export default function FormPreviewPage() {
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editFormData, setEditFormData] = useState(null)
  const router = useRouter()

  useEffect(() => {
    // Load fields from localStorage (edit mode) or sessionStorage (create mode)
    const formBuilderData = localStorage.getItem('formBuilderData')
    
    if (formBuilderData) {
      // Edit mode - load from localStorage
      try {
        const data = JSON.parse(formBuilderData)
        if (data.isEditMode && data.fields) {
          console.log('🔍 Loading fields from localStorage for preview:', data.fields)
          setFields(data.fields)
          setIsEditMode(true)
          setEditFormData(data)
        }
      } catch (error) {
        console.error('Error parsing formBuilderData:', error)
      }
    } else {
      // Create mode - load from sessionStorage
      const savedFields = sessionStorage.getItem('form-preview-fields')
      if (savedFields) {
        try {
          const parsedFields = JSON.parse(savedFields)
          console.log('🔍 Loading fields from sessionStorage for preview:', parsedFields)
          setFields(parsedFields)
        } catch (error) {
          console.error('Error parsing saved fields:', error)
        }
      }
    }
    setLoading(false)
  }, [])

  const handleBack = () => {
    // Set the intended tab to custom-form so Home component knows where to navigate
    sessionStorage.setItem('intended-tab', 'custom-form')
    // Navigate to home page
    router.push('/')
  }

  const handleSaveForm = async () => {
    try {
      if (isEditMode && editFormData) {
        // Update existing form
        console.log('🔍 Updating existing form:', editFormData.formId)
        console.log('🔍 Fields to update:', fields)
        
        // TODO: Implement actual update API call
        alert(`Update functionality will be implemented for form: ${editFormData.formName}`)
      }
    } catch (error) {
      console.error('Error saving form:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading preview...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header with back button */}
      <div className="sticky top-0 z-10 bg-card border-b shadow-sm">
        <div className="max-w-7xl mx-auto p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Form Builder
            </Button>
            {isEditMode && (
              <Button onClick={handleSaveForm} className="flex items-center gap-2" size="sm">
                <FileText className="h-4 w-4" />
                Update Form
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Form Preview Content */}
      <FormPreview fields={fields} isEditMode={isEditMode} />
    </div>
  )
}

