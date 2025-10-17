"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { FieldPalette } from "../component/formbuilder/field-palette"
import { FormCanvas } from "../component/formbuilder/form-canvas"
import { FieldConfigPanel } from "../component/formbuilder/field-config-panel"
import { FormPreview } from "../component/formbuilder/form-preview"
import MyFormsPage from "../my-forms/page"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, Code, Settings, FileText, Download, Plus, GripVertical, Trash2, AlertTriangle, ArrowLeft } from "lucide-react"
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
  const [isEditMode, setIsEditMode] = useState(false)
  const [editFormData, setEditFormData] = useState(null)
  const [showMyForms, setShowMyForms] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // Ensure client-side rendering to avoid hydration mismatch
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Check for edit mode data from localStorage first
  useEffect(() => {
    const formBuilderData = localStorage.getItem('formBuilderData')
    if (formBuilderData) {
      try {
        const data = JSON.parse(formBuilderData)
        console.log('🔍 Loading form data from localStorage:', data)
        
        if (data.isEditMode && data.fields) {
          setFields(data.fields)
          setIsEditMode(true)
          setEditFormData(data)
          
          // Don't clear localStorage - keep it for persistence across refreshes
          // localStorage.removeItem('formBuilderData')
          
          console.log('🔍 Loaded fields for editing:', data.fields)
          console.log('🔍 First field nestedFields:', data.fields[0]?.nestedFields)
        }
      } catch (error) {
        console.error('Error parsing form builder data:', error)
        localStorage.removeItem('formBuilderData')
      }
    } else {
      // Only restore from sessionStorage if not in edit mode
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
    }
  }, [])

  // Handle navigation back from preview - don't reload fields if they're already loaded
  useEffect(() => {
    const intendedTab = sessionStorage.getItem('intended-tab')
    if (intendedTab === 'custom-form' && isEditMode && fields.length > 0) {
      // Fields are already loaded from localStorage persistence, just clear the intended tab
      sessionStorage.removeItem('intended-tab')
    }
  }, [isEditMode, fields.length])

  // Save fields to sessionStorage whenever they change (only if not in edit mode)
  useEffect(() => {
    if (!isEditMode && fields.length > 0) {
      sessionStorage.setItem('form-preview-fields', JSON.stringify(fields))
    }
  }, [fields, isEditMode])

  // Save fields to localStorage when in edit mode (for persistence across refreshes)
  useEffect(() => {
    if (isEditMode && editFormData && fields.length > 0) {
      const formBuilderData = {
        ...editFormData,
        fields: fields
      }
      localStorage.setItem('formBuilderData', JSON.stringify(formBuilderData))
    }
  }, [fields, isEditMode, editFormData])

  // Cleanup localStorage when component unmounts (only if not in edit mode)
  useEffect(() => {
    return () => {
      // Only cleanup if we're not in edit mode to avoid clearing data during refresh
      if (!isEditMode) {
        localStorage.removeItem('formBuilderData')
      }
    }
  }, [isEditMode])

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

  const handleSaveForm = async () => {
    try {
      if (isEditMode && editFormData) {
        // Update existing form
        console.log('🔍 Updating existing form:', editFormData.formId)
        console.log('🔍 Fields to update:', fields)
        
        // TODO: Implement actual update API call
        alert(`Update functionality will be implemented for form: ${editFormData.formName}`)
      } else {
        // Create new form
        console.log('🔍 Creating new form with fields:', fields)
        
        // TODO: Implement actual create API call
        alert('Create functionality will be implemented')
      }
    } catch (error) {
      console.error('Error saving form:', error)
    }
  }

  const handleBackToForms = () => {
    // Clear localStorage when leaving edit mode
    localStorage.removeItem('formBuilderData')
    sessionStorage.setItem('intended-tab', 'my-forms')
    router.push('/')
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

  // If showMyForms is true, render the MyFormsPage component
  if (showMyForms) {
    return <MyFormsPage />
  }

  return (
    <div className={isEditMode ? "min-h-screen flex flex-col bg-background" : "h-[calc(100vh-140px)] flex flex-col"}>
      {/* Header */}
      {isEditMode ? (
        <div className="p-6 pb-0">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Edit Form: {editFormData?.formName || 'Untitled'}
              </h1>
              <p className="text-muted-foreground text-base mb-3">
                Edit your form fields and configuration
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">
                  {fields.length} total fields
                </Badge>
                {tableFieldsCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {tableFieldsCount} from table
                  </Badge>
                )}
                <Badge variant="destructive" className="text-xs">
                  Edit Mode
                </Badge>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
              <Button variant="outline" onClick={handleBackToForms} className="flex items-center gap-2" size="sm">
                <ArrowLeft className="h-4 w-4" />
                Back to Forms
              </Button>
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
        </div>
      ) : (
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
      )}

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
      {!isClient ? (
        <div className="flex-1 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading form builder...</p>
          </div>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {isEditMode ? (
            <div className="flex-1 px-6 pb-6 min-h-[600px]">
              <div className="h-[600px] flex border rounded-lg overflow-hidden bg-background">
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
            </div>
          ) : (
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
          )}

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
      )}
    </div>
  )
}