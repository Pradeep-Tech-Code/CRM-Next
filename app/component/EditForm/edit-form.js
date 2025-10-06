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
import { Loader2, Save, X, Edit, Download, Eye, File, Image, Upload } from "lucide-react"

// Enhanced helper functions
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Improved base64 detection
const isBase64File = (str) => {
  if (typeof str !== 'string') return false
  return str.startsWith('data:') && str.includes('base64,')
}

// Create a proper file object from base64
const createFileFromBase64 = (base64String, filename = 'uploaded_file') => {
  if (!base64String) return null
  
  try {
    // Extract mime type and base64 data
    const matches = base64String.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.*)$/)
    if (!matches || matches.length !== 3) {
      console.warn('Invalid base64 format:', base64String?.substring(0, 100))
      return null
    }
    
    const mimeType = matches[1]
    const base64Data = matches[2]
    
    // Get file extension from mime type
    const extension = mimeType.split('/')[1] || 'bin'
    const finalFilename = filename.includes('.') ? filename : `${filename}.${extension}`
    
    // Calculate approximate size
    const size = Math.floor((base64Data.length * 3) / 4)
    
    return {
      name: finalFilename,
      type: mimeType,
      size: size,
      base64: base64String,
      previewUrl: base64String,
      lastModified: Date.now(),
      isFromBase64: true // Flag to identify base64-originated files
    }
  } catch (error) {
    console.error('Error creating file from base64:', error)
    return null
  }
}

// Convert base64 to Blob for download
const base64ToBlob = (base64String) => {
  try {
    let base64Data = base64String
    let mimeType = 'application/octet-stream'

    if (base64String.includes(',')) {
      const [header, data] = base64String.split(',')
      const mimeMatch = header.match(/:(.*?);/)
      if (mimeMatch) {
        mimeType = mimeMatch[1]
      }
      base64Data = data
    }

    const binaryString = atob(base64Data)
    const bytes = new Uint8Array(binaryString.length)
    
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    return new Blob([bytes], { type: mimeType })
  } catch (error) {
    console.error('Error converting base64 to blob:', error)
    return null
  }
}

// Helper to get file icon based on type
const getFileIcon = (fileType) => {
  if (fileType?.includes('image/')) return <Image className="h-5 w-5" />
  if (fileType === 'application/pdf') return <File className="h-5 w-5" />
  if (fileType?.includes('video/')) return <File className="h-5 w-5" />
  if (fileType?.includes('audio/')) return <File className="h-5 w-5" />
  return <File className="h-5 w-5" />
}

// Helper to get file type color
const getFileTypeColor = (fileType) => {
  if (fileType?.includes('image/')) return 'bg-blue-100 text-blue-600 border-blue-200'
  if (fileType === 'application/pdf') return 'bg-red-100 text-red-600 border-red-200'
  if (fileType?.includes('video/')) return 'bg-purple-100 text-purple-600 border-purple-200'
  if (fileType?.includes('audio/')) return 'bg-green-100 text-green-600 border-green-200'
  return 'bg-gray-100 text-gray-600 border-gray-200'
}

// File Preview Component
const FilePreview = ({ file, onRemove, onDownload, fieldLabel, isExisting = false }) => {
  const canPreview = file?.type?.includes('image/') || file?.type === 'application/pdf'
  
  return (
    <div className={`p-4 border-2 rounded-lg ${isExisting ? 'border-blue-200 bg-blue-50' : 'border-green-200 bg-green-50'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className={`w-12 h-12 flex items-center justify-center rounded-lg border ${getFileTypeColor(file.type)}`}>
            {getFileIcon(file.type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {file.name}
            </p>
            <p className="text-xs text-gray-500">
              {formatFileSize(file.size)} • {file.type}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={isExisting ? "secondary" : "default"} className="text-xs">
                {isExisting ? 'Previously Uploaded' : 'New Upload'}
              </Badge>
              {file.isFromBase64 && (
                <Badge variant="outline" className="text-xs">
                  Base64
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-2 ml-4">
          {canPreview && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const newWindow = window.open()
                if (file.type.includes('image/')) {
                  newWindow.document.write(`
                    <html>
                      <head><title>${file.name}</title></head>
                      <body style="margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5;">
                        <img src="${file.previewUrl}" style="max-width: 90vw; max-height: 90vh; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
                      </body>
                    </html>
                  `)
                } else if (file.type === 'application/pdf') {
                  newWindow.document.write(`
                    <html>
                      <head><title>${file.name}</title></head>
                      <body style="margin: 0;">
                        <embed src="${file.previewUrl}" type="application/pdf" width="100%" height="100%" style="min-height: 100vh;" />
                      </body>
                    </html>
                  `)
                }
              }}
              className="flex items-center gap-1"
            >
              <Eye className="h-3 w-3" />
              Preview
            </Button>
          )}
          
          <Button
            size="sm"
            variant="outline"
            onClick={onDownload}
            className="flex items-center gap-1"
          >
            <Download className="h-3 w-3" />
            Download
          </Button>
          
          <Button
            size="sm"
            variant="destructive"
            onClick={onRemove}
            className="flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Remove
          </Button>
        </div>
      </div>
      
      {/* Image preview */}
      {file.type?.includes('image/') && (
        <div className="mt-3">
          <img 
            src={file.previewUrl} 
            alt="Preview" 
            className="max-h-48 max-w-full rounded-lg border shadow-sm"
            onError={(e) => {
              console.error('Error loading image preview')
              e.target.style.display = 'none'
            }}
          />
        </div>
      )}
    </div>
  )
}

export default function EditFormDialog({ form, open, onOpenChange, onSave }) {
  const [formData, setFormData] = useState({
    form_name: "",
    description: "",
    fields: []
  })
  const [saving, setSaving] = useState(false)
  const [optionsInputs, setOptionsInputs] = useState({})

  useEffect(() => {
    if (form) {
      console.log('🔍 Form data received for editing:', form)
      
      // Parse field data
      const parsedFields = (form.parsedFields || form.fields || []).map((field, index) => {
        console.log(`📝 Processing field ${index}:`, {
          id: field.id,
          type: field.type,
          label: field.label,
          hasValue: !!(form.values && form.values[field.id])
        })
        
        // Handle options
        let options = []
        if (Array.isArray(field.options)) {
          options = field.options
        } else if (typeof field.options === 'string') {
          options = field.options.split(',').map(opt => opt.trim()).filter(opt => opt)
        }
        
        // Parse validation
        let validation = {}
        if (typeof field.validation === 'string') {
          try {
            validation = JSON.parse(field.validation)
          } catch (e) {
            console.warn('Failed to parse validation as JSON:', field.validation)
          }
        } else if (typeof field.validation === 'object') {
          validation = field.validation
        }
        
        const isRequired = field.required === true || field.required === "true" || false
        const isFileField = field.type === "file"
        
        // Process file data - Enhanced file detection
        let existingFile = null
        
        if (isFileField && form.values) {
          // Check multiple possible locations for file data
          const possibleFileValues = [
            form.values[field.id], // Direct field value
            form.values[field.name], // By field name
            field.value, // Field value property
            field.fileData // File data property
          ]
          
          const fileValue = possibleFileValues.find(val => val && isBase64File(val))
          
          if (fileValue) {
            console.log(`📁 Found file data for field ${field.id}:`, fileValue.substring(0, 100) + '...')
            existingFile = createFileFromBase64(fileValue, field.label || field.name || 'file')
            if (existingFile) {
              console.log('✅ Successfully created file object:', existingFile)
            } else {
              console.log('❌ Failed to create file object from base64')
            }
          } else {
            console.log(`❌ No valid file data found for field ${field.id}`, {
              formValues: form.values[field.id] ? 'exists' : 'missing',
              fieldValue: field.value ? 'exists' : 'missing'
            })
          }
        }
        
        return {
          ...field,
          required: isRequired,
          validation: {
            required: isRequired,
            multiple: isFileField ? false : (validation.multiple || false),
            min: validation.min,
            max: validation.max,
            accept: validation.accept,
            pattern: validation.pattern,
            ...validation
          },
          options: options,
          existingFile: existingFile
        }
      })
      
      console.log('🎯 Final parsed fields:', parsedFields)
      
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
      // Process form data for saving
      const processedFormData = {
        ...formData,
        fields: formData.fields.map(field => {
          const processedField = { ...field }
          
          // Handle file fields
          if (field.type === "file") {
            // If there's a new file, use its base64
            if (field.currentFile) {
              processedField.value = field.currentFile.base64
              processedField.fileName = field.currentFile.name
              processedField.fileType = field.currentFile.type
              processedField.fileSize = field.currentFile.size
            } 
            // If no new file but existing file, keep the existing base64
            else if (field.existingFile) {
              processedField.value = field.existingFile.base64
              processedField.fileName = field.existingFile.name
              processedField.fileType = field.existingFile.type
              processedField.fileSize = field.existingFile.size
            }
            // If file was removed, clear the value
            else if (field.existingFile === null) {
              processedField.value = null
              processedField.fileName = null
              processedField.fileType = null
              processedField.fileSize = null
            }
            
            // Remove file objects from the data to be saved
            delete processedField.currentFile
            delete processedField.existingFile
          }
          
          return processedField
        })
      }
      
      console.log('💾 Saving processed form data:', processedFormData)
      await onSave(processedFormData)
    } catch (error) {
      console.error('Error saving form:', error)
      alert('Error saving form: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const updateField = (index, updates) => {
    const newFields = [...formData.fields]
    
    if (updates.hasOwnProperty('required')) {
      updates.validation = {
        ...newFields[index].validation,
        required: updates.required
      }
    }
    
    if (updates.validation && updates.validation.hasOwnProperty('multiple')) {
      updates.validation = {
        ...newFields[index].validation,
        multiple: updates.validation.multiple
      }
    }
    
    newFields[index] = { ...newFields[index], ...updates }
    setFormData(prev => ({ ...prev, fields: newFields }))
  }

  const handleFileUpload = async (index, file) => {
    if (!file) return

    try {
      console.log('📤 Processing file upload:', file.name, file.type, file.size)
      
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        reader.onload = () => resolve(reader.result)
        reader.onerror = error => reject(error)
      })

      const fileData = {
        name: file.name,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
        base64: base64,
        previewUrl: base64,
        isFromBase64: false
      }

      console.log('✅ File processed successfully:', fileData)
      updateField(index, { 
        currentFile: fileData,
        // Clear existing file when new file is uploaded
        existingFile: null 
      })
    } catch (error) {
      console.error('Error processing file:', error)
      alert('Error processing file. Please try again.')
    }
  }

  const downloadFile = (fileData, fieldLabel) => {
    if (!fileData || !fileData.base64) {
      alert('No file data available to download')
      return
    }
    
    try {
      const blob = base64ToBlob(fileData.base64)
      if (!blob) {
        throw new Error('Failed to create blob from base64')
      }
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileData.name || `${fieldLabel}_file`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      // Clean up
      setTimeout(() => URL.revokeObjectURL(url), 100)
    } catch (error) {
      console.error('Error downloading file:', error)
      alert('Error downloading file: ' + error.message)
    }
  }

  const removeFile = (index, type) => {
    if (type === 'current') {
      updateField(index, { currentFile: null })
    } else if (type === 'existing') {
      updateField(index, { existingFile: null })
    }
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
          validation: {
            required: false,
            multiple: false
          }
        }
      ]
    }))
  }

  const removeField = (index) => {
    const newFields = formData.fields.filter((_, i) => i !== index)
    setFormData(prev => ({ ...prev, fields: newFields }))
    
    setOptionsInputs(prev => {
      const newInputs = { ...prev }
      delete newInputs[index]
      return newInputs
    })
  }

  const getBooleanRequired = (requiredValue) => {
    return requiredValue === true || requiredValue === "true" || false
  }

  const handleOptionsInputChange = (index, value) => {
    setOptionsInputs(prev => ({
      ...prev,
      [index]: value
    }))

    const optionsArray = value
      .split(',')
      .map(opt => opt.trim())
      .filter(opt => opt !== '')
    
    updateField(index, { options: optionsArray })
  }

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
                      {field.required && (
                        <Badge variant="destructive" className="text-xs">
                          Required
                        </Badge>
                      )}
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
                          name: e.target.value.toLowerCase().replace(/\s+/g, '_')
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
                    <div className="space-y-4">
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
                      
                      {/* File upload section */}
                      <div className="space-y-4">
                        <Label>Upload New File</Label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <Input
                            type="file"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                handleFileUpload(index, file)
                              }
                              e.target.value = '' // Reset input
                            }}
                            accept={field.validation?.accept || "*/*"}
                            className="hidden"
                            id={`file-upload-${index}`}
                          />
                          <Label 
                            htmlFor={`file-upload-${index}`}
                            className="cursor-pointer flex flex-col items-center justify-center gap-2"
                          >
                            <Upload className="h-8 w-8 text-gray-400" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                Click to upload or drag and drop
                              </p>
                              <p className="text-xs text-gray-500">
                                {field.validation?.accept || "Any file type accepted"}
                              </p>
                            </div>
                          </Label>
                        </div>
                      </div>

                      {/* Display current uploaded file */}
                      {field.currentFile && (
                        <FilePreview
                          file={field.currentFile}
                          onRemove={() => removeFile(index, 'current')}
                          onDownload={() => downloadFile(field.currentFile, field.label)}
                          fieldLabel={field.label}
                          isExisting={false}
                        />
                      )}

                      {/* Display existing file from backend */}
                      {field.existingFile && !field.currentFile && (
                        <FilePreview
                          file={field.existingFile}
                          onRemove={() => removeFile(index, 'existing')}
                          onDownload={() => downloadFile(field.existingFile, field.label)}
                          fieldLabel={field.label}
                          isExisting={true}
                        />
                      )}

                      {/* No file state */}
                      {!field.currentFile && !field.existingFile && (
                        <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-gray-200 rounded-lg">
                          <File className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                          <p>No file uploaded</p>
                          <p className="text-sm">Upload a file to see it here</p>
                        </div>
                      )}
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