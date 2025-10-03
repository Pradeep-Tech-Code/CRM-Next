"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Loader2, Save, X, Edit } from "lucide-react"

export default function EditFormDialog({ form, open, onOpenChange, onSave }) {
  const [formData, setFormData] = useState({
    form_name: "",
    description: "",
    fields: []
  })
  const [saving, setSaving] = useState(false)
  const [optionsInputs, setOptionsInputs] = useState({}) // Store raw option inputs per field

  useEffect(() => {
    if (form) {
      // Parse field data and ensure boolean values for required
      const parsedFields = (form.parsedFields || []).map(field => {
        // Handle options - convert string to array if needed
        let options = []
        if (Array.isArray(field.options)) {
          options = field.options
        } else if (typeof field.options === 'string') {
          options = field.options.split(',').map(opt => opt.trim()).filter(opt => opt)
        }
        
        return {
          ...field,
          required: field.required === true || field.required === "true" || false,
          // Ensure validation object exists
          validation: field.validation || {},
          // Ensure options is always an array
          options: options
        }
      })
      
      setFormData({
        form_name: form.form_name || "",
        description: form.description || "",
        fields: parsedFields
      })

      // Initialize options inputs
      const initialOptionsInputs = {}
      parsedFields.forEach((field, index) => {
        if (field.options && field.options.length > 0) {
          initialOptionsInputs[index] = field.options.join(', ')
        }
      })
      setOptionsInputs(initialOptionsInputs)
    }
  }, [form])

  const handleSave = async () => {
    if (!formData.form_name.trim()) {
      alert("Form name is required")
      return
    }

    setSaving(true)
    try {
      await onSave(formData)
    } catch (error) {
      // Error is handled in the parent component
    } finally {
      setSaving(false)
    }
  }

  const updateField = (index, updates) => {
    const newFields = [...formData.fields]
    newFields[index] = { ...newFields[index], ...updates }
    setFormData(prev => ({ ...prev, fields: newFields }))
  }

  const addField = () => {
    const newFieldId = `field-${Date.now()}`
    setFormData(prev => ({
      ...prev,
      fields: [
        ...prev.fields,
        {
          id: newFieldId,
          name: newFieldId,
          type: "text",
          label: "New Field",
          required: false,
          placeholder: "",
          options: [],
          validation: {}
        }
      ]
    }))
  }

  const removeField = (index) => {
    const newFields = formData.fields.filter((_, i) => i !== index)
    setFormData(prev => ({ ...prev, fields: newFields }))
    
    // Also remove from options inputs
    setOptionsInputs(prev => {
      const newInputs = { ...prev }
      delete newInputs[index]
      return newInputs
    })
  }

  // Helper function to convert string to boolean for required field
  const getBooleanRequired = (requiredValue) => {
    return requiredValue === true || requiredValue === "true" || false
  }

  // Handle options input change
  const handleOptionsInputChange = (index, value) => {
    // Update the raw input value
    setOptionsInputs(prev => ({
      ...prev,
      [index]: value
    }))

    // Parse and update the actual options array
    const optionsArray = value
      .split(',')
      .map(opt => opt.trim())
      .filter(opt => opt !== '')
    
    updateField(index, { options: optionsArray })
  }

  // Get options display value
  const getOptionsDisplayValue = (index) => {
    return optionsInputs[index] || ''
  }

  if (!form) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Form: {form.form_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="form-name">Form Name *</Label>
                <Input
                  id="form-name"
                  value={formData.form_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, form_name: e.target.value }))}
                  placeholder="Enter form name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="form-description">Description</Label>
                <Textarea
                  id="form-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter form description"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Fields */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Form Fields ({formData.fields.length})</span>
                <Button size="sm" onClick={addField}>
                  Add Field
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.fields.map((field, index) => (
                <div key={field.id || index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{field.type}</Badge>
                      <span className="font-medium">{field.label || "Unnamed Field"}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeField(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Field Label *</Label>
                      <Input
                        value={field.label || ""}
                        onChange={(e) => updateField(index, { 
                          label: e.target.value,
                          name: e.target.value.toLowerCase().replace(/\s+/g, '_') // Auto-generate name from label
                        })}
                        placeholder="Field label"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Field Type</Label>
                      <select
                        value={field.type}
                        onChange={(e) => updateField(index, { type: e.target.value })}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="text">Text</option>
                        <option value="email">Email</option>
                        <option value="number">Number</option>
                        <option value="textarea">Textarea</option>
                        <option value="select">Select</option>
                        <option value="checkbox">Checkbox</option>
                        <option value="radio">Radio</option>
                        <option value="file">File</option>
                        <option value="phone">Phone</option>
                        <option value="location">Location</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Placeholder</Label>
                      <Input
                        value={field.placeholder || ""}
                        onChange={(e) => updateField(index, { placeholder: e.target.value })}
                        placeholder="Placeholder text"
                      />
                    </div>
                    <div className="space-y-2 flex items-center">
                      <input
                        type="checkbox"
                        id={`required-${index}`}
                        checked={getBooleanRequired(field.required)}
                        onChange={(e) => updateField(index, { required: e.target.checked })}
                        className="mr-2"
                      />
                      <Label htmlFor={`required-${index}`}>Required Field</Label>
                    </div>
                  </div>

                  {/* Options for select, checkbox, radio */}
                  {(field.type === "select" || field.type === "checkbox" || field.type === "radio") && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Options *</Label>
                        <Input
                          value={getOptionsDisplayValue(index)}
                          onChange={(e) => handleOptionsInputChange(index, e.target.value)}
                          placeholder="Option 1, Option 2, Option 3"
                          className="font-mono text-sm"
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter options separated by commas. Example: "Red, Green, Blue"
                        </p>
                      </div>
                      
                      {/* Preview of options */}
                      {field.options && field.options.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-xs">Options Preview ({field.options.length}):</Label>
                          <div className="flex flex-wrap gap-1">
                            {field.options.map((option, optIndex) => (
                              <Badge key={optIndex} variant="outline" className="text-xs">
                                {option}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Debug info */}
                      <div className="text-xs text-muted-foreground">
                        <div>Raw input: "{getOptionsDisplayValue(index)}"</div>
                        <div>Parsed options: {JSON.stringify(field.options)}</div>
                      </div>

                      {/* Multiple selection for select fields */}
                      {field.type === "select" && (
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`multiple-${index}`}
                            checked={field.validation?.multiple || false}
                            onCheckedChange={(checked) => updateField(index, {
                              validation: {
                                ...field.validation,
                                multiple: checked
                              }
                            })}
                          />
                          <Label htmlFor={`multiple-${index}`} className="text-sm">
                            Allow multiple selection
                          </Label>
                        </div>
                      )}
                    </div>
                  )}

                  {/* File upload specific settings */}
                  {field.type === "file" && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Accepted File Types</Label>
                        <Input
                          value={field.validation?.accept || ""}
                          onChange={(e) => updateField(index, {
                            validation: {
                              ...field.validation,
                              accept: e.target.value
                            }
                          })}
                          placeholder=".pdf,.jpg,.png,image/*"
                        />
                        <p className="text-xs text-muted-foreground">
                          Specify file types (e.g., .pdf, .jpg) or MIME types (e.g., image/*)
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`multiple-files-${index}`}
                          checked={field.validation?.multiple || false}
                          onCheckedChange={(checked) => updateField(index, {
                            validation: {
                              ...field.validation,
                              multiple: checked
                            }
                          })}
                        />
                        <Label htmlFor={`multiple-files-${index}`} className="text-sm">
                          Allow multiple files
                        </Label>
                      </div>
                    </div>
                  )}

                  {/* Number field specific settings */}
                  {field.type === "number" && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Minimum Value</Label>
                        <Input
                          type="number"
                          value={field.validation?.min || ""}
                          onChange={(e) => updateField(index, {
                            validation: {
                              ...field.validation,
                              min: e.target.value ? Number(e.target.value) : undefined
                            }
                          })}
                          placeholder="No limit"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Maximum Value</Label>
                        <Input
                          type="number"
                          value={field.validation?.max || ""}
                          onChange={(e) => updateField(index, {
                            validation: {
                              ...field.validation,
                              max: e.target.value ? Number(e.target.value) : undefined
                            }
                          })}
                          placeholder="No limit"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {formData.fields.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No fields added yet. Click "Add Field" to get started.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}