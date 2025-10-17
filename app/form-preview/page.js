"use client"

import { useEffect, useState } from "react"
import { FormPreview } from "../component/formbuilder/form-preview"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export default function FormPreviewPage() {
  const [fields, setFields] = useState([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Load fields from localStorage or sessionStorage
    const savedFields = sessionStorage.getItem('form-preview-fields')
    if (savedFields) {
      try {
        const parsedFields = JSON.parse(savedFields)
        setFields(parsedFields)
      } catch (error) {
        console.error('Error parsing saved fields:', error)
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
          <Button
            variant="ghost"
            onClick={handleBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Form Builder
          </Button>
        </div>
      </div>

      {/* Form Preview Content */}
      <FormPreview fields={fields} />
    </div>
  )
}

