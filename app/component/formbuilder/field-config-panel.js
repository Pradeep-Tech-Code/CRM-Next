"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, X, Copy, Trash2, Settings2 } from "lucide-react"
import { useState } from "react"

export function FieldConfigPanel({ field, onUpdateField }) {
  const [newOption, setNewOption] = useState("")

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

  const duplicateField = () => {
    // This would need to be implemented in the parent component
    console.log("Duplicate field:", field.id)
  }

  const deleteField = () => {
    // This would need to be implemented in the parent component
    console.log("Delete field:", field.id)
  }

  const needsOptions = ["select", "checkbox", "radio"].includes(field.type)
  const supportsValidation = ["text", "email", "number", "textarea", "file", "datetime", "location"].includes(
    field.type,
  )

  return (
    <div className="h-full overflow-y-auto">
      {/* Field Header */}
      <div className="p-4 border-b border-border bg-card/50">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="secondary" className="text-xs font-mono">
            {field.type}
          </Badge>
          <div className="flex gap-1">
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
          </div>
        </div>
        <h3 className="font-medium text-sm truncate">{field.label}</h3>
        <p className="text-xs text-muted-foreground">ID: {field.id}</p>
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
                onCheckedChange={(checked) => onUpdateField(field.id, { required: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Field Type Conversion */}
        <Card className="border-0 shadow-none bg-transparent">
          <CardHeader className="px-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Field Type
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="space-y-2">
              <Label htmlFor="field-type" className="text-sm font-medium">
                Change Type
              </Label>
              <Select
                value={field.type}
                onValueChange={(newType) => {
                  const updates = { type: newType }

                  // Add default options for fields that need them
                  if (["select", "checkbox", "radio"].includes(newType) && !field.options) {
                    updates.options = ["Option 1", "Option 2", "Option 3"]
                  }

                  // Remove options for fields that don't need them
                  if (!["select", "checkbox", "radio"].includes(newType)) {
                    updates.options = undefined
                  }

                  onUpdateField(field.id, updates)
                }}
              >
                <SelectTrigger className="bg-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text Input</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="textarea">Textarea</SelectItem>
                  <SelectItem value="select">Select</SelectItem>
                  <SelectItem value="checkbox">Checkbox</SelectItem>
                  <SelectItem value="radio">Radio</SelectItem>
                  <SelectItem value="file">File Upload</SelectItem>
                  <SelectItem value="datetime">Date Time</SelectItem>
                  <SelectItem value="location">Location</SelectItem>
                </SelectContent>
              </Select>
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
              <div className="space-y-2">
                {field.options?.map((option, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                      {index + 1}
                    </div>
                    <Input
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...(field.options || [])]
                        newOptions[index] = e.target.value
                        onUpdateField(field.id, { options: newOptions })
                      }}
                      className="bg-input flex-1"
                      placeholder={`Option ${index + 1}`}
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeOption(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
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

              <div className="text-xs text-muted-foreground">Tip: Press Enter to quickly add options</div>
            </CardContent>
          </Card>
        )}

        {/* Validation */}
        {/* {supportsValidation && (
          <Card className="border-0 shadow-none bg-transparent">
            <CardHeader className="px-0 pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Validation Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0 space-y-4">
              {field.type === "number" && (
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
              )}

              {field.type === "file" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="field-accept" className="text-xs">
                      Accepted File Types
                    </Label>
                    <Input
                      id="field-accept"
                      value={field.validation?.accept || ""}
                      onChange={(e) =>
                        onUpdateField(field.id, {
                          validation: {
                            ...field.validation,
                            accept: e.target.value,
                          },
                        })
                      }
                      placeholder=".pdf,.doc,.docx,image/*"
                      className="bg-input"
                    />
                    <div className="text-xs text-muted-foreground">
                      Use MIME types or file extensions (e.g., .pdf, image/*, .doc)
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="field-multiple" className="text-sm font-medium">
                      Allow Multiple Files
                    </Label>
                    <Switch
                      id="field-multiple"
                      checked={field.validation?.multiple || false}
                      onCheckedChange={(checked) =>
                        onUpdateField(field.id, {
                          validation: {
                            ...field.validation,
                            multiple: checked,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              )}

              {field.type === "datetime" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="field-min-date" className="text-xs">
                      Min Date/Time
                    </Label>
                    <Input
                      id="field-min-date"
                      type="datetime-local"
                      value={field.validation?.min || ""}
                      onChange={(e) =>
                        onUpdateField(field.id, {
                          validation: {
                            ...field.validation,
                            min: e.target.value,
                          },
                        })
                      }
                      className="bg-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="field-max-date" className="text-xs">
                      Max Date/Time
                    </Label>
                    <Input
                      id="field-max-date"
                      type="datetime-local"
                      value={field.validation?.max || ""}
                      onChange={(e) =>
                        onUpdateField(field.id, {
                          validation: {
                            ...field.validation,
                            max: e.target.value,
                          },
                        })
                      }
                      className="bg-input"
                    />
                  </div>
                </div>
              )}

              {field.type === "select" && (
                <div className="space-y-4">
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
                            multiple: checked,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {field.validation?.multiple
                      ? "Users can select multiple options from the list"
                      : "Users can select only one option from the dropdown"}
                  </div>
                </div>
              )}

              {(field.type === "text" || field.type === "textarea") && (
                <div className="space-y-2">
                  <Label htmlFor="field-pattern" className="text-xs">
                    Pattern (RegEx)
                  </Label>
                  <Input
                    id="field-pattern"
                    value={field.validation?.pattern || ""}
                    onChange={(e) => {
                      const pattern = e.target.value.trim()
                      let isValid = true

                      if (pattern !== "") {
                        try {
                          new RegExp(pattern)
                        } catch (error) {
                          isValid = false
                        }
                      }

                      onUpdateField(field.id, {
                        validation: {
                          ...field.validation,
                          pattern: pattern,
                          patternValid: isValid,
                        },
                      })
                    }}
                    placeholder="^[A-Za-z]+$"
                    className={`bg-input ${field.validation?.patternValid === false ? "border-destructive" : ""}`}
                  />
                  {field.validation?.patternValid === false && (
                    <div className="text-xs text-destructive">Invalid regular expression pattern</div>
                  )}
                  <div className="text-xs text-muted-foreground">Use regular expressions to validate input format</div>
                </div>
              )}

              {field.type === "email" && (
                <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
                  Email validation is automatically applied to this field type.
                </div>
              )}

              {field.type === "location" && (
                <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
                  Location validation is automatically applied to this field type.
                </div>
              )}
            </CardContent>
          </Card>
        )} */}

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
                        multiple: checked,
                      },
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

        {/* Advanced Settings */}
        {/* <Card className="border-0 shadow-none bg-transparent">
          <CardHeader className="px-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Advanced
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="field-description" className="text-sm font-medium">
                Help Text
              </Label>
              <Textarea
                id="field-description"
                value={field.description || ""}
                onChange={(e) => onUpdateField(field.id, { description: e.target.value })}
                placeholder="Optional help text for users"
                className="bg-input min-h-[60px]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Field ID</Label>
              <div className="flex items-center gap-2">
                <code className="bg-muted px-2 py-1 rounded text-xs flex-1 font-mono">{field.id}</code>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={() => navigator.clipboard.writeText(field.id)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">Use this ID to reference the field in your code</div>
            </div>
          </CardContent>
        </Card> */}
      </div>
    </div>
  )
}
