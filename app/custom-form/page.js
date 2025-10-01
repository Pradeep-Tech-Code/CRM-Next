"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FieldPalette } from "../../component/formbuilder/field-palette"
import { FormCanvas } from "../../component/formbuilder/form-canvas"
import { FieldConfigPanel } from "../..component/formbuilder/field-config-panel"
import { FormPreview } from "../../component/formbuilder/form-preview"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Settings, Save, ArrowLeft } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

export default function CustomFormPage() {
  const [fields, setFields] = useState([])
  const [selectedField, setSelectedField] = useState(null)
  const [activeTab, setActiveTab] = useState("builder")
  const [paletteCollapsed, setPaletteCollapsed] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editingForm, setEditingForm] = useState(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check if we're in edit mode
    const editMode = searchParams.get('edit') === 'true'
    setIsEditing(editMode)

    if (editMode) {
      // Load the form data from sessionStorage
      const storedForm = sessionStorage.getItem('editingForm')
      if (storedForm) {
        try {
          const formData = JSON.parse(storedForm)
          setEditingForm(formData)
          setFields(formData.fields || [])
          
          // Clear the stored form data
          sessionStorage.removeItem('editingForm')
        } catch (error) {
          console.error('Error parsing stored form data:', error)
        }
      }
    }
  }, [searchParams])

  const generateId = () => {
    return `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  const getDefaultField = (type) => {
    const baseField = {
      id: generateId(),
      type,
      label: getDefaultLabel(type),
      placeholder: "",
      required: false,
      validation: {},
    }

    switch (type) {
      case "select":
      case "checkbox":
      case "radio":
        return { ...baseField, options: ["Option 1", "Option 2", "Option 3"] }
      case "file":
        return { ...baseField, validation: { accept: "", multiple: false } }
      case "number":
        return { ...baseField, validation: { min: undefined, max: undefined } }
      case "datetime":
        return { ...baseField, validation: { min: undefined, max: undefined } }
      case "location":
        return { ...baseField, value: { country: "", state: "", city: "" } }
      case "phone":
        return { ...baseField, value: { country: "US", number: "" } }
      default:
        return baseField
    }
  }

  const getDefaultLabel = (type) => {
    const labels = {
      text: "Text Field",
      email: "Email Field",
      number: "Number Field",
      textarea: "Text Area",
      select: "Select Field",
      checkbox: "Checkbox Group",
      radio: "Radio Group",
      file: "File Upload",
      datetime: "Date Time",
      location: "Location",
      phone: "Phone Number",
    }
    return labels[type] || "Field"
  }

  const handleAddField = (fieldType) => {
    const newField = getDefaultField(fieldType)
    setFields([...fields, newField])
    setSelectedField(newField)
  }

  const handleSelectField = (field) => {
    setSelectedField(field)
  }

  const handleDeleteField = (fieldId) => {
    const newFields = fields.filter((field) => field.id !== fieldId)
    setFields(newFields)
    if (selectedField?.id === fieldId) {
      setSelectedField(newFields.length > 0 ? newFields[0] : null)
    }
  }

  const handleUpdateField = (fieldId, updates) => {
    setFields(fields.map((field) => (field.id === fieldId ? { ...field, ...updates } : field)))
    if (selectedField?.id === fieldId) {
      setSelectedField({ ...selectedField, ...updates })
    }
  }

  const handleMoveField = (fromIndex, toIndex) => {
    const newFields = [...fields]
    const [movedField] = newFields.splice(fromIndex, 1)
    newFields.splice(toIndex, 0, movedField)
    setFields(newFields)
  }

  const handleFormUpdate = (formData) => {
    // If we're editing, update the editing form data
    if (isEditing && editingForm) {
      setEditingForm({
        ...editingForm,
        ...formData
      })
    }
    
    // You can add additional logic here, like refreshing the forms list
    console.log('Form updated:', formData)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">
                  {isEditing ? `Editing: ${editingForm?.formName || 'Form'}` : 'Form Builder'}
                </h1>
                <p className="text-muted-foreground">
                  {isEditing 
                    ? 'Update your form fields and configuration' 
                    : 'Drag and drop fields to build your form'
                  }
                </p>
              </div>
              {isEditing && editingForm && (
                <Badge variant="secondary" className="ml-2">
                  Editing Mode
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {fields.length} {fields.length === 1 ? "field" : "fields"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Field Palette */}
        <FieldPalette
          onAddField={handleAddField}
          collapsed={paletteCollapsed}
          onToggleCollapse={() => setPaletteCollapsed(!paletteCollapsed)}
        />

        {/* Main Canvas */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="flex-shrink-0 border-b border-border">
                <div className="container mx-auto px-4">
                  <TabsList className="w-full justify-start">
                    <TabsTrigger value="builder" className="gap-2">
                      <Settings className="h-4 w-4" />
                      Builder
                    </TabsTrigger>
                    <TabsTrigger value="preview" className="gap-2">
                      <Eye className="h-4 w-4" />
                      Preview
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>

              <TabsContent value="builder" className="flex-1 overflow-hidden p-0 m-0">
                <FormCanvas
                  fields={fields}
                  selectedField={selectedField}
                  onSelectField={handleSelectField}
                  onDeleteField={handleDeleteField}
                  onMoveField={handleMoveField}
                  onAddField={handleAddField}
                />
              </TabsContent>

              <TabsContent value="preview" className="flex-1 overflow-hidden p-0 m-0">
                <FormPreview 
                  fields={fields} 
                  formId={editingForm?.formId}
                  onFormUpdate={handleFormUpdate}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Field Configuration Panel */}
          {selectedField && (
            <div className="w-80 border-l border-border overflow-y-auto">
              <FieldConfigPanel field={selectedField} onUpdateField={handleUpdateField} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}