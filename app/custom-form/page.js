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
import { cn } from "@/lib/utils" // Add this import
// import { useToast } from "@/hooks/use-toast"


export default function CustomFormPage() {
  const [fields, setFields] = useState([])
  const [selectedField, setSelectedField] = useState(null)
  const [activeTab, setActiveTab] = useState("builder")
  const [fieldPaletteCollapsed, setFieldPaletteCollapsed] = useState(false)

  const addField = (type) => {
    const newField = {
      id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      label: type.charAt(0).toUpperCase() + type.slice(1) + " Field",
      placeholder: "",
      required: false,
      options: ["select", "checkbox", "radio"].includes(type) ? ["Option 1", "Option 2", "Option 3"] : undefined,
      validation: {},
    }
    setFields([...fields, newField])
    setSelectedField(newField)
  }

  const updateField = (fieldId, updates) => {
    setFields(fields.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    ))
    if (selectedField && selectedField.id === fieldId) {
      setSelectedField({ ...selectedField, ...updates })
    }
  }

  const deleteField = (fieldId) => {
    setFields(fields.filter(field => field.id !== fieldId))
    if (selectedField && selectedField.id === fieldId) {
      setSelectedField(null)
    }
  }

  const moveField = (fromIndex, toIndex) => {
    const newFields = [...fields]
    const [movedField] = newFields.splice(fromIndex, 1)
    newFields.splice(toIndex, 0, movedField)
    setFields(newFields)
  }

  const toggleFieldPalette = () => {
    setFieldPaletteCollapsed(!fieldPaletteCollapsed)
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Form Builder</h1>
          <p className="text-muted-foreground">Drag and drop fields to create your custom form</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList>
              <TabsTrigger value="builder" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Builder
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <ExportDialog fields={fields}>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </ExportDialog>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex border rounded-lg overflow-hidden bg-background">
        {/* Field Palette */}
        <FieldPalette 
          onAddField={addField}
          collapsed={fieldPaletteCollapsed}
          onToggleCollapse={toggleFieldPalette}
        />

        {/* Main Canvas/Preview */}
        <div className="flex-1 flex">
          <div className={cn(
            "flex-1 transition-all duration-300",
            activeTab === "builder" && selectedField ? "w-2/3" : "w-full"
          )}>
            {activeTab === "builder" ? (
              <FormCanvas
                fields={fields}
                selectedField={selectedField}
                onSelectField={setSelectedField}
                onDeleteField={deleteField}
                onMoveField={moveField}
                onAddField={addField}
              />
            ) : (
              <FormPreview fields={fields} />
            )}
          </div>

          {/* Configuration Panel */}
          {activeTab === "builder" && selectedField && (
            <div className="w-1/3 border-l bg-card">
              <FieldConfigPanel
                field={selectedField}
                onUpdateField={updateField}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}