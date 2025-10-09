"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, X, Copy, Trash2, Settings2, ChevronDown, ChevronRight } from "lucide-react"
import { useState } from "react"
import { TableColumnSelector } from "./table-column-selector"

export function FieldConfigPanel({ field, onUpdateField }) {
  const [newOption, setNewOption] = useState("")
  const [expandedNestedFields, setExpandedNestedFields] = useState({})
  const [nestedFieldNewOptions, setNestedFieldNewOptions] = useState({})

  if (!field) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-muted flex items-center justify-center">
            <Settings2 className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium mb-1">No Field Selected</h3>
          <p className="text-sm text-muted-foreground">Select a field from the canvas to configure its properties</p>
        </div>
      </div>
    )
  }

  const addOption = () => {
    if (!newOption.trim()) return
    const currentOptions = field.options || []
    onUpdateField(field.id, {
      options: [...currentOptions, newOption.trim()],
    })
    setNewOption("")
  }

  const removeOption = (index) => {
    const currentOptions = field.options || []
    onUpdateField(field.id, {
      options: currentOptions.filter((_, i) => i !== index),
    })
  }

  const addNestedFieldOption = (optionIndex, nestedFieldIndex) => {
    console.log('🔍 addNestedFieldOption called with:', { optionIndex, nestedFieldIndex })
    const nestedFieldKey = `${optionIndex}-${nestedFieldIndex}`
    const newOptionValue = nestedFieldNewOptions[nestedFieldKey] || ""

    console.log('🔍 Current newOptionValue:', newOptionValue)
    console.log('🔍 nestedFieldNewOptions state:', nestedFieldNewOptions)

    if (!newOptionValue.trim()) {
      console.log('❌ No option value to add')
      return
    }

    const currentNestedFields = field.nestedFields || {}
    const optionNestedFields = currentNestedFields[optionIndex] || []
    const nestedField = optionNestedFields[nestedFieldIndex]

    console.log('🔍 Nested field found:', nestedField)

    if (nestedField) {
      const newOptions = [...(nestedField.options || []), newOptionValue.trim()]
      console.log('✅ Adding new options:', newOptions)
      updateNestedField(optionIndex, nestedFieldIndex, { options: newOptions })

      // Clear the input
      setNestedFieldNewOptions(prev => ({
        ...prev,
        [nestedFieldKey]: ""
      }))
      console.log('✅ Input cleared')
    } else {
      console.log('❌ Nested field not found')
    }
  }

  const updateNestedFieldNewOption = (optionIndex, nestedFieldIndex, value) => {
    const nestedFieldKey = `${optionIndex}-${nestedFieldIndex}`
    console.log('🔍 Updating nested field new option:', { nestedFieldKey, value })
    setNestedFieldNewOptions(prev => ({
      ...prev,
      [nestedFieldKey]: value
    }))
  }

  const toggleNestedFields = (optionIndex) => {
    setExpandedNestedFields(prev => ({
      ...prev,
      [optionIndex]: !prev[optionIndex]
    }))
  }

  const addNestedField = (optionIndex) => {
    const currentNestedFields = field.nestedFields || {}
    const optionNestedFields = currentNestedFields[optionIndex] || []

    const newNestedField = {
      id: `nested-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "text",
      label: "Additional Field",
      placeholder: "",
      required: false
    }

    const updatedNestedFields = {
      ...currentNestedFields,
      [optionIndex]: [...optionNestedFields, newNestedField]
    }

    console.log('Adding nested field:', {
      optionIndex,
      currentNestedFields,
      newNestedField,
      updatedNestedFields
    })

    onUpdateField(field.id, {
      nestedFields: updatedNestedFields
    })
  }

  const updateNestedField = (optionIndex, nestedFieldIndex, updates) => {
    const currentNestedFields = field.nestedFields || {}
    const optionNestedFields = currentNestedFields[optionIndex] || []

    const updatedNestedFields = optionNestedFields.map((field, index) => {
      if (index === nestedFieldIndex) {
        const updatedField = { ...field, ...updates }

        // If the type is changed to checkbox, radio, or select, initialize options if not present
        if (updates.type && ["checkbox", "radio", "select"].includes(updates.type) && !updatedField.options) {
          updatedField.options = ["Option 1", "Option 2", "Option 3"]
        }

        return updatedField
      }
      return field
    })

    const newNestedFields = {
      ...currentNestedFields,
      [optionIndex]: updatedNestedFields
    }

    console.log('Updating nested field:', {
      optionIndex,
      nestedFieldIndex,
      updates,
      currentNestedFields,
      newNestedFields
    })

    onUpdateField(field.id, {
      nestedFields: newNestedFields
    })
  }

  const removeNestedField = (optionIndex, nestedFieldIndex) => {
    const currentNestedFields = field.nestedFields || {}
    const optionNestedFields = currentNestedFields[optionIndex] || []

    const updatedNestedFields = optionNestedFields.filter((_, index) => index !== nestedFieldIndex)

    onUpdateField(field.id, {
      nestedFields: {
        ...currentNestedFields,
        [optionIndex]: updatedNestedFields
      }
    })
  }

  const needsOptions = ["select", "checkbox", "radio"].includes(field.type)
  const supportsValidation = ["text", "email", "number", "textarea", "file", "datetime", "location"].includes(
    field.type,
  )

  return (
    <div className="h-full overflow-y-auto">
      {/* Field Header */}
      <div className="p-4 border-b border-border bg-card/50">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="font-medium text-sm truncate">{field.label}</h3>
          <Badge variant="secondary" className="text-xs font-mono">
            {field.type}
          </Badge>
          {/* <div className="flex gap-1">
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={duplicateField}>
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={deleteField}
              >
              <Trash2 className="h-3 w-3" />
              </Button>
              </div> */}
        </div>
        {/* <p className="text-xs text-muted-foreground">ID: {field.id}</p> */}
        <div className="flex gap-1 mt-1">
          {field.required && (
            <Badge variant="destructive" className="text-xs">
              Required
            </Badge>
          )}
          {field.type === "select" && field.validation?.multiple && (
            <Badge variant="outline" className="text-xs">
              Multiple Selection
            </Badge>
          )}
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Basic Properties */}
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader className="px-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Basic Properties
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="field-label" className="text-sm font-medium">
                Label
              </Label>
              <Input
                id="field-label"
                value={field.label}
                onChange={(e) => onUpdateField(field.id, { label: e.target.value })}
                placeholder="Field label"
                className="bg-input"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="field-placeholder" className="text-sm font-medium">
                Placeholder
              </Label>
              <Input
                id="field-placeholder"
                value={field.placeholder || ""}
                onChange={(e) => onUpdateField(field.id, { placeholder: e.target.value })}
                placeholder="Placeholder text"
                className="bg-input"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="field-required" className="text-sm font-medium">
                Required Field
              </Label>
              <Switch
                id="field-required"
                checked={field.required || false}
                onCheckedChange={(checked) => onUpdateField(field.id, {
                  required: checked,
                  validation: {
                    ...field.validation,
                    required: checked
                  }
                })}
              />
            </div>
          </CardContent>
        </Card>


        {/* Options for select, checkbox, radio */}
        {needsOptions && (
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="px-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Options
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 space-y-4">
              <div className="space-y-3">
                {field.options?.map((option, index) => (
                  <div key={index} className="space-y-3 border rounded-lg p-3 bg-muted/20">
                    <div className="flex items-center justify-between">
                      <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground flex-shrink-0">
                        {index + 1}
                      </div>
                      <Input
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...(field.options || [])]
                          newOptions[index] = e.target.value
                          onUpdateField(field.id, { options: newOptions })
                        }}
                        className="bg-input flex-1 min-w-0"
                        placeholder={`Option ${index + 1}`}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                        onClick={() => removeOption(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Nested Fields Section */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleNestedFields(index)}
                          className="text-xs gap-1 h-7 hover:bg-accent/50 flex-shrink-0"
                        >
                          {expandedNestedFields[index] ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                          Additional Fields
                          {(field.nestedFields?.[index]?.length || 0) > 0 && (
                            <Badge variant="secondary" className="ml-1 text-xs">
                              {field.nestedFields[index].length}
                            </Badge>
                          )}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addNestedField(index)}
                          className="h-7 text-xs gap-1 hover:bg-accent/50 flex-shrink-0"
                        >
                          <Plus className="h-3 w-3" />
                          Add Field
                        </Button>
                      </div>

                      {expandedNestedFields[index] && (
                        <div className="space-y-3">
                          {field.nestedFields?.[index]?.map((nestedField, nestedIndex) => (
                            <div key={nestedField.id} className="p-3 border rounded-lg bg-background/50 space-y-3">
                              <div className="flex items-center justify-between">
                                <Badge variant="outline" className="text-xs">
                                  Additional Field {nestedIndex + 1}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => removeNestedField(index, nestedIndex)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>

                              <div className="space-y-3">
                                <div className="space-y-2">
                                  <Label className="text-xs font-medium text-muted-foreground">Field Label</Label>
                                  <Input
                                    value={nestedField.label}
                                    onChange={(e) => updateNestedField(index, nestedIndex, { label: e.target.value })}
                                    placeholder="Enter field label"
                                    className="h-8 text-sm"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-xs font-medium text-muted-foreground">Field Type</Label>
                                  <Select
                                    value={nestedField.type}
                                    onValueChange={(value) => updateNestedField(index, nestedIndex, { type: value })}
                                  >
                                    <SelectTrigger className="h-8 text-sm">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="text">Text Input</SelectItem>
                                      <SelectItem value="email">Email</SelectItem>
                                      <SelectItem value="number">Number</SelectItem>
                                      <SelectItem value="textarea">Textarea</SelectItem>
                                      <SelectItem value="select">Select Dropdown</SelectItem>
                                      <SelectItem value="checkbox">Checkbox Group</SelectItem>
                                      <SelectItem value="radio">Radio Group</SelectItem>
                                      <SelectItem value="file">File Upload</SelectItem>
                                      <SelectItem value="datetime">Date & Time</SelectItem>
                                      <SelectItem value="phone">Phone Number</SelectItem>
                                      <SelectItem value="location">Location</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-xs font-medium text-muted-foreground">Placeholder</Label>
                                  <Input
                                    value={nestedField.placeholder || ""}
                                    onChange={(e) => updateNestedField(index, nestedIndex, { placeholder: e.target.value })}
                                    placeholder="Enter placeholder text"
                                    className="h-8 text-sm"
                                  />
                                </div>

                                <div className="flex items-center justify-between">
                                  <Label className="text-xs font-medium text-muted-foreground">Required Field</Label>
                                  <Switch
                                    checked={nestedField.required || false}
                                    onCheckedChange={(checked) => updateNestedField(index, nestedIndex, {
                                      required: checked,
                                      validation: {
                                        ...nestedField.validation,
                                        required: checked
                                      }
                                    })}
                                    className="h-4 w-7"
                                  />
                                </div>

                                {/* Validation Options for Nested Fields */}
                                {nestedField.type === "number" && (
                                  <div className="space-y-3 pt-2 border-t border-border/50">
                                    <Label className="text-xs font-medium text-muted-foreground">Number Validation</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Min Value</Label>
                                        <Input
                                          type="number"
                                          value={nestedField.validation?.min || ""}
                                          onChange={(e) => updateNestedField(index, nestedIndex, {
                                            validation: {
                                              ...nestedField.validation,
                                              min: e.target.value ? Number(e.target.value) : undefined
                                            }
                                          })}
                                          placeholder="No limit"
                                          className="h-7 text-xs"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Max Value</Label>
                                        <Input
                                          type="number"
                                          value={nestedField.validation?.max || ""}
                                          onChange={(e) => updateNestedField(index, nestedIndex, {
                                            validation: {
                                              ...nestedField.validation,
                                              max: e.target.value ? Number(e.target.value) : undefined
                                            }
                                          })}
                                          placeholder="No limit"
                                          className="h-7 text-xs"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {["text", "textarea"].includes(nestedField.type) && (
                                  <div className="space-y-3 pt-2 border-t border-border/50">
                                    <Label className="text-xs font-medium text-muted-foreground">Text Validation</Label>
                                    <div className="space-y-2">
                                      <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Pattern (Regex)</Label>
                                        <Input
                                          value={nestedField.validation?.pattern || ""}
                                          onChange={(e) => updateNestedField(index, nestedIndex, {
                                            validation: {
                                              ...nestedField.validation,
                                              pattern: e.target.value
                                            }
                                          })}
                                          placeholder="e.g., ^[A-Za-z]+$"
                                          className="h-7 text-xs font-mono"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Min Length</Label>
                                        <Input
                                          type="number"
                                          value={nestedField.validation?.minLength || ""}
                                          onChange={(e) => updateNestedField(index, nestedIndex, {
                                            validation: {
                                              ...nestedField.validation,
                                              minLength: e.target.value ? Number(e.target.value) : undefined
                                            }
                                          })}
                                          placeholder="No limit"
                                          className="h-7 text-xs"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Max Length</Label>
                                        <Input
                                          type="number"
                                          value={nestedField.validation?.maxLength || ""}
                                          onChange={(e) => updateNestedField(index, nestedIndex, {
                                            validation: {
                                              ...nestedField.validation,
                                              maxLength: e.target.value ? Number(e.target.value) : undefined
                                            }
                                          })}
                                          placeholder="No limit"
                                          className="h-7 text-xs"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {["select", "checkbox", "radio"].includes(nestedField.type) && (
                                  <div className="space-y-3 pt-2 border-t border-border/50">
                                    <Label className="text-xs font-medium text-muted-foreground">Options</Label>
                                    <div className="space-y-2">
                                      {nestedField.options?.map((option, optionIndex) => (
                                        <div key={optionIndex} className="flex items-center gap-2">
                                          <Input
                                            value={option}
                                            onChange={(e) => {
                                              const newOptions = [...(nestedField.options || [])]
                                              newOptions[optionIndex] = e.target.value
                                              updateNestedField(index, nestedIndex, { options: newOptions })
                                            }}
                                            placeholder={`Option ${optionIndex + 1}`}
                                            className="h-7 text-xs flex-1"
                                          />
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            onClick={() => {
                                              const newOptions = (nestedField.options || []).filter((_, i) => i !== optionIndex)
                                              updateNestedField(index, nestedIndex, { options: newOptions })
                                            }}
                                          >
                                            <X className="h-3 w-3" />
                                          </Button>
                                        </div>
                                      ))}
                                      <div className="flex gap-2">
                                        <Input
                                          placeholder="Add option"
                                          className="h-7 text-xs flex-1"
                                          value={nestedFieldNewOptions[`${index}-${nestedIndex}`] || ""}
                                          onChange={(e) => updateNestedFieldNewOption(index, nestedIndex, e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              e.preventDefault()
                                              addNestedFieldOption(index, nestedIndex)
                                            }
                                          }}
                                        />
                                        <button
                                          type="button"
                                          className="inline-flex items-center justify-center h-7 px-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground rounded-md"
                                          onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            console.log('🔍 Plus button clicked for:', { index, nestedIndex })

                                            // Get the input value directly from the DOM as a fallback
                                            const inputElement = e.target.parentElement.querySelector('input[placeholder="Add option"]')
                                            const inputValue = inputElement ? inputElement.value : ''
                                            console.log('🔍 Input value from DOM:', inputValue)

                                            // Try to add the option using the DOM value if state value is empty
                                            const nestedFieldKey = `${index}-${nestedIndex}`
                                            const stateValue = nestedFieldNewOptions[nestedFieldKey] || ""
                                            const valueToUse = stateValue || inputValue

                                            console.log('🔍 Value to use:', valueToUse)

                                            if (valueToUse.trim()) {
                                              const currentNestedFields = field.nestedFields || {}
                                              const optionNestedFields = currentNestedFields[index] || []
                                              const nestedField = optionNestedFields[nestedIndex]

                                              if (nestedField) {
                                                const newOptions = [...(nestedField.options || []), valueToUse.trim()]
                                                console.log('✅ Adding new options:', newOptions)
                                                updateNestedField(index, nestedIndex, { options: newOptions })

                                                // Clear both state and DOM input
                                                setNestedFieldNewOptions(prev => ({
                                                  ...prev,
                                                  [nestedFieldKey]: ""
                                                }))
                                                if (inputElement) {
                                                  inputElement.value = ""
                                                }
                                                console.log('✅ Input cleared')
                                              }
                                            }
                                          }}
                                        >
                                          <Plus className="h-3 w-3" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Multiple Selection Toggle for Select Fields */}
                                    {nestedField.type === "select" && (
                                      <div className="space-y-2 pt-2 border-t border-border/50">
                                        <div className="flex items-center justify-between">
                                          <Label className="text-xs font-medium text-muted-foreground">
                                            Allow Multiple Selection
                                          </Label>
                                          <Switch
                                            checked={nestedField.validation?.multiple || false}
                                            onCheckedChange={(checked) => updateNestedField(index, nestedIndex, {
                                              validation: {
                                                ...nestedField.validation,
                                                multiple: checked
                                              }
                                            })}
                                            className="h-4 w-7"
                                          />
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          {nestedField.validation?.multiple
                                            ? "Users can select multiple options from the dropdown"
                                            : "Users can select only one option from the dropdown"}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {nestedField.type === "file" && (
                                  <div className="space-y-3 pt-2 border-t border-border/50">
                                    <Label className="text-xs font-medium text-muted-foreground">File Validation</Label>
                                    <div className="space-y-2">
                                      <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Accepted Types</Label>
                                        <Input
                                          value={nestedField.validation?.accept || ""}
                                          onChange={(e) => updateNestedField(index, nestedIndex, {
                                            validation: {
                                              ...nestedField.validation,
                                              accept: e.target.value
                                            }
                                          })}
                                          placeholder="e.g., .jpg,.png,.pdf or image/*"
                                          className="h-7 text-xs"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Max Size (MB)</Label>
                                        <Input
                                          type="number"
                                          value={nestedField.validation?.maxSize || ""}
                                          onChange={(e) => updateNestedField(index, nestedIndex, {
                                            validation: {
                                              ...nestedField.validation,
                                              maxSize: e.target.value ? Number(e.target.value) : undefined
                                            }
                                          })}
                                          placeholder="e.g., 5"
                                          className="h-7 text-xs"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {nestedField.type === "phone" && (
                                  <div className="space-y-3 pt-2 border-t border-border/50">
                                    <Label className="text-xs font-medium text-muted-foreground">Phone Validation</Label>
                                    <div className="space-y-2">
                                      <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Min Length</Label>
                                        <Input
                                          type="number"
                                          value={nestedField.validation?.minLength || ""}
                                          onChange={(e) => updateNestedField(index, nestedIndex, {
                                            validation: {
                                              ...nestedField.validation,
                                              minLength: e.target.value ? Number(e.target.value) : undefined
                                            }
                                          })}
                                          placeholder="e.g., 10"
                                          className="h-7 text-xs"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <Label className="text-xs text-muted-foreground">Max Length</Label>
                                        <Input
                                          type="number"
                                          value={nestedField.validation?.maxLength || ""}
                                          onChange={(e) => updateNestedField(index, nestedIndex, {
                                            validation: {
                                              ...nestedField.validation,
                                              maxLength: e.target.value ? Number(e.target.value) : undefined
                                            }
                                          })}
                                          placeholder="e.g., 15"
                                          className="h-7 text-xs"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}

                          {(!field.nestedFields?.[index] || field.nestedFields[index].length === 0) && (
                            <div className="text-center py-6 text-muted-foreground text-sm border-2 border-dashed rounded-lg bg-muted/20">
                              <div className="flex flex-col items-center gap-2">
                                <Settings2 className="h-4 w-4" />
                                <span>No additional fields for this option</span>
                                <span className="text-xs">Click "Add Field" to create conditional fields</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  placeholder="Add new option"
                  className="bg-input flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addOption()
                    }
                  }}
                />
                <Button size="sm" onClick={addOption} className="px-3">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              <div className="text-xs text-muted-foreground">
                Tip: Press Enter to quickly add options. Use "Additional Fields" to add extra fields
              </div>
            </CardContent>
          </Card>
        )}

        {/* Select: Multiple toggle (quick access) */}
        {field.type === "select" && (
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="px-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Selection Mode
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="field-multiple-select" className="text-sm font-medium">
                  Allow Multiple Selection
                </Label>
                <Switch
                  id="field-multiple-select"
                  checked={field.validation?.multiple || false}
                  onCheckedChange={(checked) =>
                    onUpdateField(field.id, {
                      validation: {
                        ...field.validation,
                        multiple: checked
                      }
                    })
                  }
                />
              </div>
              <div className="text-xs text-muted-foreground">
                {field.validation?.multiple
                  ? "Users can select multiple options from the dropdown"
                  : "Users can select only one option from the dropdown"}
              </div>
            </CardContent>
          </Card>
        )}

        {/* File: Multiple files toggle */}
        {/* {field.type === "file" && (
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="px-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                File Options
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="field-multiple-files" className="text-sm font-medium">
                  Allow Multiple Files
                </Label>
                <Switch
                  id="field-multiple-files"
                  checked={field.validation?.multiple || false}
                  onCheckedChange={(checked) =>
                    onUpdateField(field.id, {
                      validation: {
                        ...field.validation,
                        multiple: checked
                      }
                    })
                  }
                />
              </div>
              <div className="text-xs text-muted-foreground">
                {field.validation?.multiple
                  ? "Users can upload multiple files"
                  : "Users can upload only one file"}
              </div>
            </CardContent>
          </Card>
        )} */}

        {/* Number: Min/Max validation */}
        {field.type === "number" && (
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="px-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Number Validation
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="field-min" className="text-xs">
                    Min Value
                  </Label>
                  <Input
                    id="field-min"
                    type="number"
                    value={field.validation?.min || ""}
                    onChange={(e) =>
                      onUpdateField(field.id, {
                        validation: {
                          ...field.validation,
                          min: e.target.value ? Number(e.target.value) : undefined,
                        },
                      })
                    }
                    className="bg-input"
                    placeholder="No limit"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="field-max" className="text-xs">
                    Max Value
                  </Label>
                  <Input
                    id="field-max"
                    type="number"
                    value={field.validation?.max || ""}
                    onChange={(e) =>
                      onUpdateField(field.id, {
                        validation: {
                          ...field.validation,
                          max: e.target.value ? Number(e.target.value) : undefined,
                        },
                      })
                    }
                    className="bg-input"
                    placeholder="No limit"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        {field.type === "table_column" && (
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="px-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Table Columns
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <TableColumnSelector
                field={field}
                onUpdateField={onUpdateField}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}