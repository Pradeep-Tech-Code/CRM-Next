"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { FieldPalette } from "../component/formbuilder/field-palette"
import { FormCanvas } from "../component/formbuilder/form-canvas"
import { FieldConfigPanel } from "../component/formbuilder/field-config-panel"
import { FormPreview } from "../component/formbuilder/form-preview"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, Code, Settings, FileText, Download, Plus, GripVertical, Trash2, AlertTriangle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

// Field types are defined in the FieldPalette component

export default function CustomFormPage() {
  const router = useRouter()
  const [fields, setFields] = useState([])
  const [selectedField, setSelectedField] = useState(null)
  const [activeTab, setActiveTab] = useState("builder")
  const [fieldPaletteCollapsed, setFieldPaletteCollapsed] = useState(false)
  const [activeId, setActiveId] = useState(null)
  const [showClearDialog, setShowClearDialog] = useState(false)

  // Restore fields from sessionStorage on component mount
  useEffect(() => {
    const savedFields = sessionStorage.getItem('form-preview-fields')
    if (savedFields) {
      try {
        const parsedFields = JSON.parse(savedFields)
        if (parsedFields.length > 0) {
          setFields(parsedFields)
        }
      } catch (error) {
        console.error('Error restoring fields:', error)
      }
    }
  }, [])

  // Save fields to sessionStorage whenever they change
  useEffect(() => {
    if (fields.length > 0) {
      sessionStorage.setItem('form-preview-fields', JSON.stringify(fields))
    }
  }, [fields])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Helper function to map data types
  const mapDataTypeToFieldType = (dataType) => {
    const typeMap = {
      'text': 'text',
      'varchar': 'text',
      'string': 'text',
      'email': 'email',
      'number': 'number',
      'integer': 'number',
      'float': 'number',
      'decimal': 'number',
      'dropdown': 'select',
      'dropDown': 'select',
      'select': 'select',
      'checkbox': 'checkbox',
      'radio': 'radio',
      'textarea': 'textarea',
      'file': 'file',
      'datetime': 'datetime',
      'date': 'datetime',
      'phone': 'phone',
      'location': 'location'
    }
    return typeMap[dataType?.toLowerCase()] || 'text'
  }

  const addField = (type, predefinedFields = null) => {
    console.log('🎯 addField called with:', { type, predefinedFields })

    if (predefinedFields) {
      // Handle predefined fields (like from table columns)
      if (Array.isArray(predefinedFields)) {
        // Multiple fields
        console.log('📦 Adding multiple fields:', predefinedFields)
        setFields(prev => {
          const newFields = [...prev, ...predefinedFields]
          console.log('✅ Fields after addition:', newFields)
          return newFields
        })
        if (predefinedFields.length > 0) {
          setSelectedField(predefinedFields[0])
        }
      } else {
        // Single field
        console.log('📦 Adding single field:', predefinedFields)
        setFields(prev => {
          const newFields = [...prev, predefinedFields]
          console.log('✅ Fields after addition:', newFields)
          return newFields
        })
        setSelectedField(predefinedFields)
      }
    } else if (type === "table_column") {
      // Add table column selector field
      const newField = {
        id: `table-column-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: "table_column",
        label: "Table Columns",
        description: "Select columns from your table to use as form fields",
        placeholder: "",
        required: false,
        nestedFields: {},
        onAddTableColumns: (newFields) => {
          console.log('🚀 onAddTableColumns called with:', newFields)

          if (Array.isArray(newFields) && newFields.length > 0) {
            console.log('📦 Adding table column fields:', newFields)
            // Add all the new fields at once
            setFields(prev => {
              const updatedFields = [...prev, ...newFields]
              console.log('✅ All fields after table column addition:', updatedFields)
              return updatedFields
            })
            setSelectedField(newFields[0])
            console.log('✅ Successfully added fields to form')
          } else {
            console.error('❌ No fields to add or invalid format')
          }
        }
      }
      console.log('📦 Adding table column selector field')
      setFields(prev => [...prev, newField])
      setSelectedField(newField)
    } else {
      // Regular field creation
      const newField = {
        id: `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type,
        label: type.charAt(0).toUpperCase() + type.slice(1) + " Field",
        placeholder: "",
        required: false,
        options: ["select", "checkbox", "radio"].includes(type) ? ["Option 1", "Option 2", "Option 3"] : undefined,
        validation: {},
        nestedFields: {},
      }
      console.log('📦 Adding regular field:', newField)
      setFields(prev => [...prev, newField])
      setSelectedField(newField)
    }
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
    const currentFieldIndex = fields.findIndex(field => field.id === fieldId)
    const isSelectedField = selectedField && selectedField.id === fieldId

    setFields(fields.filter(field => field.id !== fieldId))

    if (isSelectedField) {
      // If the deleted field was selected, find another field to select
      const remainingFields = fields.filter(field => field.id !== fieldId)
      
      if (remainingFields.length > 0) {
        // Select the next field, or the previous one if we deleted the last field
        const nextFieldIndex = currentFieldIndex < remainingFields.length ? currentFieldIndex : currentFieldIndex - 1
        const nextField = remainingFields[nextFieldIndex] || remainingFields[remainingFields.length - 1]
        
        // Add a small delay for smooth transition
        setTimeout(() => {
          setSelectedField(nextField)
        }, 150)
      } else {
        // No fields left, close the panel
        setTimeout(() => {
          setSelectedField(null)
        }, 150)
      }
    }
  }

  const moveField = (fromIndex, toIndex) => {
    const newFields = [...fields]
    const [movedField] = newFields.splice(fromIndex, 1)
    newFields.splice(toIndex, 0, movedField)
    setFields(newFields)
  }

  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveId(null)

    if (!over) return

    if (active.data.current?.type === "field-type") {
      const fieldType = active.data.current.fieldType
      addField(fieldType)
      return
    }

    if (active.id !== over?.id) {
      setFields((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id)
        const newIndex = items.findIndex(item => item.id === over.id)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const toggleFieldPalette = () => {
    setFieldPaletteCollapsed(!fieldPaletteCollapsed)
  }

  const handleTabChange = (value) => {
    if (value === "preview") {
      // Navigate to preview page (fields are already saved via useEffect)
      // Set intended tab so we know to return to custom-form
      sessionStorage.setItem('intended-tab', 'custom-form')
      router.push('/form-preview')
    } else {
      setActiveTab(value)
    }
  }

  const handleClearForm = () => {
    setFields([])
    setSelectedField(null)
    sessionStorage.removeItem('form-preview-fields')
    setShowClearDialog(false)
  }

  const regularFieldsCount = fields.filter(f => f.source !== 'table').length
  const tableFieldsCount = fields.filter(f => f.source === 'table').length

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Form Builder</h1>
          <p className="text-muted-foreground">Drag and drop fields to create your custom form</p>
          <div className="flex gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              {fields.length} total fields
            </Badge>
            {tableFieldsCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {tableFieldsCount} from table
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {fields.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClearDialog(true)}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </Button>
          )}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-auto">
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
        </div>
      </div>

      {/* Clear All Confirmation Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Clear All Fields?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all fields? This action cannot be undone and will remove all the fields you've added to the form.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearForm}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Main Content */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 flex border rounded-lg overflow-hidden bg-background min-h-0">
          {/* Field Palette */}
          <FieldPalette
            onAddField={addField}
            collapsed={fieldPaletteCollapsed}
            onToggleCollapse={toggleFieldPalette}
          />

          {/* Main Canvas */}
          <div className="flex-1 flex">
            <div className={cn(
              "flex-1 transition-all duration-300 ease-in-out",
              selectedField ? "w-2/3" : "w-full"
            )}>
              <FormCanvas
                fields={fields}
                selectedField={selectedField}
                onSelectField={setSelectedField}
                onDeleteField={deleteField}
                onMoveField={moveField}
                onAddField={addField}
                activeId={activeId}
              />
            </div>

            {/* Configuration Panel */}
            {selectedField && (
              <div className="w-1/3 border-l bg-card transition-all duration-300 ease-in-out animate-in slide-in-from-right">
                <FieldConfigPanel
                  field={selectedField}
                  onUpdateField={updateField}
                />
              </div>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeId ? (
            <div className="opacity-90 transform rotate-3scale-105 ">
              {activeId.startsWith("field-type-") ? (
                <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-3 w-3 text-muted-foreground" />
                    <span className="font-medium text-sm">
                      {activeId.replace("field-type-", "").replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                  <div className="text-sm font-medium">
                    {fields.find(f => f.id === activeId)?.label || "Field"}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}