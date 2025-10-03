"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Save, X, Edit } from "lucide-react"

export default function EditFormDialog({ form, open, onOpenChange, onSave }) {
  const [formData, setFormData] = useState({
    form_name: "",
    description: "",
    fields: []
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (form) {
      // Parse field data and ensure boolean values for required
      const parsedFields = (form.parsedFields || []).map(field => ({
        ...field,
        required: field.required === true || field.required === "true" || false
      }))
      
      setFormData({
        form_name: form.form_name || "",
        description: form.description || "",
        fields: parsedFields
      })
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
          options: []
        }
      ]
    }))
  }

  const removeField = (index) => {
    const newFields = formData.fields.filter((_, i) => i !== index)
    setFormData(prev => ({ ...prev, fields: newFields }))
  }

  // Helper function to convert string to boolean for required field
  const getBooleanRequired = (requiredValue) => {
    return requiredValue === true || requiredValue === "true" || false
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
                      <Label>Field Name *</Label>
                      <Input
                        value={field.name || ""}
                        onChange={(e) => updateField(index, { name: e.target.value })}
                        placeholder="Field name (unique identifier)"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Field Label *</Label>
                      <Input
                        value={field.label || ""}
                        onChange={(e) => updateField(index, { label: e.target.value })}
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

                  {(field.type === "select" || field.type === "checkbox" || field.type === "radio") && (
                    <div className="space-y-2">
                      <Label>Options (comma-separated)</Label>
                      <Input
                        value={Array.isArray(field.options) ? field.options.join(", ") : (field.options || "")}
                        onChange={(e) => updateField(index, { 
                          options: e.target.value.split(",").map(opt => opt.trim()).filter(opt => opt) 
                        })}
                        placeholder="Option 1, Option 2, Option 3"
                      />
                      <p className="text-xs text-muted-foreground">
                        Separate options with commas. For select fields, this will be sent as a string to the API.
                      </p>
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