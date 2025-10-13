"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, X, Copy, Trash2, Settings2, ChevronDown, ChevronRight, ChevronUp } from "lucide-react"
import { useState } from "react"

export function FieldConfigPanel({ field, onUpdateField }) {
  const [newOption, setNewOption] = useState("")
  const [expandedNestedFields, setExpandedNestedFields] = useState({})

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

  const toggleNestedFields = (key) => {
    setExpandedNestedFields(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  // Helper function to deep clone nested fields structure
  const deepCloneNestedFields = (nestedFields) => {
    if (!nestedFields) return {}
    return JSON.parse(JSON.stringify(nestedFields))
  }

  // Helper function to update nested fields at any depth
  const updateNestedFieldAtPath = (nestedFields, path, updates) => {
    const cloned = deepCloneNestedFields(nestedFields)
    
    // Navigate to the target field
    let current = cloned
    for (let i = 0; i < path.length - 1; i += 2) {
      const optionIndex = path[i]
      const fieldIndex = path[i + 1]
      
      if (!current[optionIndex]) current[optionIndex] = []
      if (i + 2 < path.length - 1) {
        // Need to go deeper
        if (!current[optionIndex][fieldIndex].nestedFields) {
          current[optionIndex][fieldIndex].nestedFields = {}
        }
        current = current[optionIndex][fieldIndex].nestedFields
      }
    }
    
    const lastOptionIndex = path[path.length - 2]
    const lastFieldIndex = path[path.length - 1]
    
    if (!current[lastOptionIndex]) current[lastOptionIndex] = []
    
    // Apply updates
    if (updates === null) {
      // Remove field
      current[lastOptionIndex] = current[lastOptionIndex].filter((_, idx) => idx !== lastFieldIndex)
    } else if (typeof updates === 'function') {
      // Custom update function
      current[lastOptionIndex][lastFieldIndex] = updates(current[lastOptionIndex][lastFieldIndex])
    } else {
      // Merge updates
      current[lastOptionIndex][lastFieldIndex] = {
        ...current[lastOptionIndex][lastFieldIndex],
        ...updates
      }
    }
    
    return cloned
  }

  // Helper function to add nested field at any depth
  const addNestedFieldAtPath = (nestedFields, path, optionIndex) => {
    const cloned = deepCloneNestedFields(nestedFields)
    
    const newField = {
      id: `nested-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: nestedFields.name,
      type: "text",
      label: "Additional Field",
      placeholder: "",
      required: false
    }

    if (path.length === 0) {
      // Adding to root level
      if (!cloned[optionIndex]) cloned[optionIndex] = []
      cloned[optionIndex].push(newField)
      return cloned
    }
    
    // Navigate to the target location
    let current = cloned
    for (let i = 0; i < path.length; i += 2) {
      const optIdx = path[i]
      const fieldIdx = path[i + 1]
      
      if (!current[optIdx]) current[optIdx] = []
      if (i + 2 < path.length) {
        if (!current[optIdx][fieldIdx].nestedFields) {
          current[optIdx][fieldIdx].nestedFields = {}
        }
        current = current[optIdx][fieldIdx].nestedFields
      } else {
        // This is the parent field where we want to add
        if (!current[optIdx][fieldIdx].nestedFields) {
          current[optIdx][fieldIdx].nestedFields = {}
        }
        if (!current[optIdx][fieldIdx].nestedFields[optionIndex]) {
          current[optIdx][fieldIdx].nestedFields[optionIndex] = []
        }
        current[optIdx][fieldIdx].nestedFields[optionIndex].push(newField)
      }
    }
    
    return cloned
  }

  // Recursive component to render nested field configurations
  const NestedFieldConfig = ({ nestedField, path = [] }) => {
    const depth = path.length / 2
    const uniqueKey = path.join('-')
    
    const handleFieldUpdate = (updates) => {
      const updatedNestedFields = updateNestedFieldAtPath(
        field.nestedFields || {},
        path,
        updates
      )
      onUpdateField(field.id, { nestedFields: updatedNestedFields })
    }

    const handleFieldRemove = () => {
      const updatedNestedFields = updateNestedFieldAtPath(
        field.nestedFields || {},
        path,
        null
      )
      onUpdateField(field.id, { nestedFields: updatedNestedFields })
    }

    const handleAddNestedField = (optionIndex) => {
      const updatedNestedFields = addNestedFieldAtPath(
        field.nestedFields || {},
        path,
        optionIndex
      )
      onUpdateField(field.id, { nestedFields: updatedNestedFields })
    }

    const updateOption = (optionIndex, newValue) => {
      const currentOptions = nestedField.options || []
      const newOptions = [...currentOptions]
      newOptions[optionIndex] = newValue
      handleFieldUpdate({ options: newOptions })
    }

    const removeOptionAtIndex = (optionIndex) => {
      const currentOptions = nestedField.options || []
      const newOptions = currentOptions.filter((_, idx) => idx !== optionIndex)
      handleFieldUpdate({ options: newOptions })
    }

    const addNewOption = () => {
      const currentOptions = nestedField.options || []
      handleFieldUpdate({ options: [...currentOptions, `Option ${currentOptions.length + 1}`] })
    }

    const borderColors = ['border-primary/20', 'border-blue-300/30', 'border-green-300/30', 'border-purple-300/30', 'border-orange-300/30']
    const bgColors = ['bg-background/50', 'bg-blue-50/50', 'bg-green-50/50', 'bg-purple-50/50', 'bg-orange-50/50']
    const borderColor = borderColors[Math.min(depth, borderColors.length - 1)]
    const bgColor = bgColors[Math.min(depth, bgColors.length - 1)]

    return (
      <div className={`p-3 border rounded-lg space-y-3 ${bgColor}`}>
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            Field {path[path.length - 1] + 1} {depth > 0 && `(Level ${depth + 1})`}
          </Badge>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleFieldRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Field Label</Label>
            <Input
              value={nestedField.label}
              onChange={(e) => handleFieldUpdate({ label: e.target.value })}
              placeholder="Enter field label"
              className="h-8 text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground">Field Type</Label>
            <Select
              value={nestedField.type}
              onValueChange={(value) => {
                const updates = { type: value }
                if (["checkbox", "radio", "select"].includes(value) && !nestedField.options) {
                  updates.options = ["Option 1", "Option 2", "Option 3"]
                }
                handleFieldUpdate(updates)
              }}
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
              onChange={(e) => handleFieldUpdate({ placeholder: e.target.value })}
              placeholder="Enter placeholder text"
              className="h-8 text-sm"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground">Required Field</Label>
            <Switch
              checked={nestedField.required || false}
              onCheckedChange={(checked) => handleFieldUpdate({
                required: checked,
                validation: {
                  ...nestedField.validation,
                  required: checked
                }
              })}
              className="h-4 w-7"
            />
          </div>

          {/* Options for select, checkbox, radio */}
          {["select", "checkbox", "radio"].includes(nestedField.type) && (
            <div className="space-y-3 pt-2 border-t border-border/50">
              <Label className="text-xs font-medium text-muted-foreground">Options</Label>
              <div className="space-y-2">
                {nestedField.options?.map((option, optionIndex) => {
                  const optionKey = `${uniqueKey}-opt-${optionIndex}`
                  const hasNestedFields = nestedField.nestedFields?.[optionIndex]?.length > 0
                  
                  return (
                    <div key={optionIndex} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        value={option}
                          onChange={(e) => updateOption(optionIndex, e.target.value)}
                          placeholder={`Option ${optionIndex + 1}`}
                        className="h-7 text-xs flex-1"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removeOptionAtIndex(optionIndex)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                    
                      {/* Add nested fields controls */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                          onClick={() => toggleNestedFields(optionKey)}
                      >
                          {expandedNestedFields[optionKey] ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        Nested Fields
                          {hasNestedFields && (
                            <Badge variant="secondary" className="ml-1 text-xs">
                              {nestedField.nestedFields[optionIndex].length}
                            </Badge>
                          )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                          onClick={() => handleAddNestedField(optionIndex)}
                      >
                        <Plus className="h-3 w-3" />
                        Add Field
                      </Button>
                    </div>

                      {/* Render nested fields recursively */}
                      {expandedNestedFields[optionKey] && (
                      <div className="ml-4 space-y-3">
                          {nestedField.nestedFields?.[optionIndex]?.map((childField, childIndex) => (
                          <NestedFieldConfig
                              key={childField.id}
                              nestedField={childField}
                              path={[...path, optionIndex, childIndex]}
                          />
                        ))}
                          {!hasNestedFields && (
                            <div className="text-center py-4 text-muted-foreground text-xs border-2 border-dashed rounded-lg bg-muted/20">
                              <div className="flex flex-col items-center gap-1">
                                <Settings2 className="h-3 w-3" />
                                <span>No fields yet</span>
                              </div>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                  )
                })}
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={addNewOption}
                >
                  <Plus className="h-3 w-3" />
                  Add Option
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const needsOptions = ["select", "checkbox", "radio"].includes(field.type)

  return (
    <div className="h-full overflow-y-auto">
      {/* Field Header */}
      <div className="p-4 border-b border-border bg-card/50">
        <div className="flex items-center gap-3 mb-2">
          <h3 className="font-medium text-sm truncate">{field.label}</h3>
          <Badge variant="secondary" className="text-xs font-mono">
            {field.type}
          </Badge>
        </div>
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

            {field.source !== 'table' && (
              <div className="flex items-center justify-between">
                <Label htmlFor="field-isleadcolumn" className="text-sm font-medium">
                  Add to Lead Database
                </Label>
                <Checkbox
                  id="field-isleadcolumn"
                  checked={field.isLeadColumn || false}
                  onCheckedChange={(checked) => onUpdateField(field.id, {
                    isLeadColumn: checked
                  })}
                />
              </div>
            )}
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
                {field.options?.map((option, index) => {
                  const rootKey = `root-${index}`
                  const hasNestedFields = field.nestedFields?.[index]?.length > 0
                  
                  return (
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
                            onClick={() => toggleNestedFields(rootKey)}
                          className="text-xs gap-1 h-7 hover:bg-accent/50 flex-shrink-0"
                        >
                            {expandedNestedFields[rootKey] ? (
                            <ChevronDown className="h-3 w-3" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                          Additional Fields
                            {hasNestedFields && (
                            <Badge variant="secondary" className="ml-1 text-xs">
                              {field.nestedFields[index].length}
                            </Badge>
                          )}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                            onClick={() => {
                              const updatedNestedFields = addNestedFieldAtPath(
                                field.nestedFields || {},
                                [],
                                index
                              )
                              onUpdateField(field.id, { nestedFields: updatedNestedFields })
                            }}
                          className="h-7 text-xs gap-1 hover:bg-accent/50 flex-shrink-0"
                        >
                          <Plus className="h-3 w-3" />
                          Add Field
                        </Button>
                      </div>

                        {expandedNestedFields[rootKey] && (
                        <div className="space-y-3">
                          {field.nestedFields?.[index]?.map((nestedField, nestedIndex) => (
                            <NestedFieldConfig
                              key={nestedField.id}
                              nestedField={nestedField}
                                path={[index, nestedIndex]}
                            />
                          ))}

                            {!hasNestedFields && (
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
                  )
                })}
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
                Tip: Press Enter to quickly add options. Nested fields can go infinitely deep!
              </div>
            </CardContent>
          </Card>
        )}

        {/* Select: Multiple toggle */}
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
            </CardContent>
          </Card>
        )}

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
      </div>
    </div>
  )
}