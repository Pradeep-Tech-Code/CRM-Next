"use client"

import { useState, useEffect } from "react"
import { FieldPalette } from "../component/formbuilder/field-palette"
import { FormCanvas } from "../component/formbuilder/form-canvas"
import { FieldConfigPanel } from "../component/formbuilder/field-config-panel"
import { FormPreview } from "../component/formbuilder/form-preview"
import { ExportDialog } from "../component/formbuilder/export-dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, Code, Settings, FileText, Download, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
// import { useToast } from "@/hooks/use-toast"

// Generate unique field IDs
const generateId = () => `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

export default function CustomFormPage() {
  const [fields, setFields] = useState([])
  const [selectedField, setSelectedField] = useState(null)
  const [viewMode, setViewMode] = useState("builder") // "builder" or "preview"
  const [paletteCollapsed, setPaletteCollapsed] = useState(false)
  const [paletteLocked, setPaletteLocked] = useState(false)
  // const { toast } = useToast()

  // Initialize with sample fields for demo
  useEffect(() => {
    const sampleFields = [
      {
        id: generateId(),
        type: "text",
        label: "Full Name",
        placeholder: "Enter your full name",
        required: true
      },
      {
        id: generateId(),
        type: "email",
        label: "Email Address",
        placeholder: "your.email@example.com",
        required: true
      }
    ]
    setFields(sampleFields)
  }, [])

  const addField = (fieldType) => {
    const defaultLabels = {
      text: "Text Input",
      email: "Email Address",
      number: "Number",
      textarea: "Text Area",
      select: "Select Option",
      checkbox: "Checkbox Group",
      radio: "Radio Group",
      file: "File Upload",
      datetime: "Date Time",
      location: "Location",
      phone: "Phone Number"
    }

    const newField = {
      id: generateId(),
      type: fieldType,
      label: defaultLabels[fieldType] || "New Field",
      placeholder: "",
      required: false
    }

    // Add default options for field types that need them
    if (["select", "checkbox", "radio"].includes(fieldType)) {
      newField.options = ["Option 1", "Option 2", "Option 3"]
    }

    setFields(prev => [...prev, newField])
    setSelectedField(newField)
    
    // toast({
    //   title: "Field Added",
    //   description: `${defaultLabels[fieldType]} added to form`
    // })
  }

  const updateField = (fieldId, updates) => {
    setFields(prev => 
      prev.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    )
    
    // Update selected field if it's the one being edited
    if (selectedField?.id === fieldId) {
      setSelectedField(prev => ({ ...prev, ...updates }))
    }
  }

  const deleteField = (fieldId) => {
    setFields(prev => prev.filter(field => field.id !== fieldId))
    
    if (selectedField?.id === fieldId) {
      setSelectedField(null)
    }
    
    // toast({
    //   title: "Field Deleted",
    //   description: "Field removed from form"
    // })
  }

  const moveField = (fromIndex, toIndex) => {
    setFields(prev => {
      const newFields = [...prev]
      const [movedField] = newFields.splice(fromIndex, 1)
      newFields.splice(toIndex, 0, movedField)
      return newFields
    })
  }

  const duplicateField = (fieldId) => {
    const fieldToDuplicate = fields.find(f => f.id === fieldId)
    if (fieldToDuplicate) {
      const duplicatedField = {
        ...fieldToDuplicate,
        id: generateId(),
        label: `${fieldToDuplicate.label} (Copy)`
      }
      setFields(prev => [...prev, duplicatedField])
      setSelectedField(duplicatedField)
      
      // toast({
      //   title: "Field Duplicated",
      //   description: "Field copied successfully"
      // })
    }
  }

  const clearForm = () => {
    setFields([])
    setSelectedField(null)
    
    // toast({
    //   title: "Form Cleared",
    //   description: "All fields have been removed"
    // })
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Form Builder</h1>
            <p className="text-sm text-muted-foreground">
              Drag and drop fields to create your custom form
            </p>
          </div>
          <Badge variant="secondary" className="text-sm">
            {fields.length} {fields.length === 1 ? 'field' : 'fields'}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={clearForm}
            disabled={fields.length === 0}
          >
            Clear Form
          </Button>
          
          <ExportDialog fields={fields}>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </ExportDialog>

          <Tabs value={viewMode} onValueChange={setViewMode} className="w-auto">
            <TabsList>
              <TabsTrigger value="builder" className="gap-2">
                <Settings className="h-4 w-4" />
                Builder
              </TabsTrigger>
              <TabsTrigger value="preview" className="gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Field Palette - Only show in builder mode */}
        {viewMode === "builder" && (
          <div className={`
            w-80 border-r bg-background/50 transition-all duration-300
            ${paletteCollapsed ? 'w-20' : 'w-80'}
            ${paletteLocked ? 'border-primary/20' : ''}
          `}>
            <FieldPalette
              onAddField={addField}
              collapsed={paletteCollapsed}
              locked={paletteLocked}
              onToggleCollapse={() => setPaletteCollapsed(!paletteCollapsed)}
              onToggleLock={() => setPaletteLocked(!paletteLocked)}
            />
          </div>
        )}

        {/* Canvas/Preview Area */}
        <div className="flex-1 flex overflow-hidden">
          {viewMode === "builder" ? (
            <>
              {/* Form Canvas */}
              <div className="flex-1 overflow-hidden">
                <FormCanvas
                  fields={fields}
                  selectedField={selectedField}
                  onSelectField={setSelectedField}
                  onDeleteField={deleteField}
                  onMoveField={moveField}
                  onAddField={addField}
                />
              </div>

              {/* Field Configuration Panel */}
              <div className="w-96 border-l bg-background/50 overflow-y-auto">
                <FieldConfigPanel
                  field={selectedField}
                  onUpdateField={updateField}
                  onDuplicateField={duplicateField}
                  onDeleteField={deleteField}
                />
              </div>
            </>
          ) : (
            /* Form Preview */
            <div className="flex-1 overflow-hidden">
              <FormPreview fields={fields} />
            </div>
          )}
        </div>
      </div>

      {/* Empty State Helper */}
      {viewMode === "builder" && fields.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Card className="max-w-md text-center bg-background/80 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Start Building Your Form</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Drag fields from the left panel or click on field types to add them to your form
              </p>
              <div className="flex gap-2 justify-center text-xs text-muted-foreground">
                <Badge variant="outline">Drag & Drop</Badge>
                <Badge variant="outline">Click to Configure</Badge>
                <Badge variant="outline">Live Preview</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}