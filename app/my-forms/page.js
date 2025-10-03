"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Copy, BarChart3, Calendar, Users, ExternalLink, Loader2, Edit, Trash2 } from "lucide-react"
import { toast } from "sonner"
import EditFormDialog from "../component/EditForm/edit-form"

// API configuration
const API_BASE_URL = 'http://10.10.15.194:3000'
const ORGANIZATION_ID = 'c8c72c21-7b5c-435a-912a-803105e7ecc9'
const TABLE_ID = 'b9bc249f-9099-4436-bfc6-9dd74d1e8fdc'
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYzJhOTg1Y2UtZDM4NS00MzQ5LThmMGMtZDQ2ZTYzMDI3Y2U0Iiwib3JnYW5pemF0aW9uX2lkIjoiYzhjNzJjMjEtN2I1Yy00MzVhLTkxMmEtODAzMTA1ZTdlY2M5IiwiaWF0IjoxNzU5MzE0ODY2LCJleHAiOjE3NTk0MDEyNjZ9.QjKz8fTFwia76o7LkkdmlGGhEKoguy8o6iFbCojMwkE'

export default function MyFormsPage() {
  const [forms, setForms] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingForm, setEditingForm] = useState(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  useEffect(() => {
    fetchForms()
  }, [])

  // Function to parse the character-by-character field data
  const parseFieldData = (field) => {
    try {
      // Case 1: Field is an object with numeric keys (character-by-character JSON)
      if (typeof field === 'object' && field !== null && !Array.isArray(field)) {
        const keys = Object.keys(field).filter(key => !isNaN(key))
        
        if (keys.length > 0) {
          try {
            // Reconstruct the JSON string by sorting numeric keys and joining characters
            const jsonString = keys
              .sort((a, b) => parseInt(a) - parseInt(b))
              .map(key => field[key])
              .join('')
            
            if (jsonString.trim()) {
              return JSON.parse(jsonString)
            }
          } catch (parseError) {
            console.error('Failed to parse reconstructed JSON:', parseError)
          }
        }
      }
      
      // Case 2: Field is a JSON string
      if (typeof field === 'string') {
        try {
          return JSON.parse(field)
        } catch (parseError) {
          console.warn('Failed to parse field as JSON string:', field)
        }
      }
      
      // Case 3: Field is already a proper object (simple field object)
      if (typeof field === 'object' && field !== null) {
        // This handles the case where fields are returned as simple objects after update
        if (field.name || field.type) {
          return field
        }
      }
      
      // Default fallback
      return {
        id: 'unknown-field',
        type: 'text',
        label: 'Unknown Field',
        required: false
      }
      
    } catch (error) {
      console.error('Error parsing field data:', error)
      return {
        id: 'error-field',
        type: 'text',
        label: 'Error Parsing Field',
        required: false
      }
    }
  }

  // Function to count the number of fields in a form
// Function to count the number of fields in a form
const countFormFields = (form) => {
  if (!form.fields || !Array.isArray(form.fields)) return 0
  
  let fieldCount = 0
  
  form.fields.forEach((field) => {
    // Direct field object (after update)
    if (field && typeof field === 'object' && field.name && field.type) {
      fieldCount++
    } 
    // Character-by-character format (new forms)
    else if (field && typeof field === 'object') {
      const keys = Object.keys(field).filter(key => !isNaN(key))
      if (keys.length > 0) {
        fieldCount++ // Count as one field even if we can't parse it
      }
    }
  })
  
  return fieldCount
}

  // Function to get form details for editing
  const getFormDetails = async (formId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/forms/${ORGANIZATION_ID}/${TABLE_ID}/${formId}`,
        {
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch form details: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.success && result.form) {
        return result.form
      } else {
        throw new Error('Form not found in response')
      }
    } catch (error) {
      console.error('Error fetching form details:', error)
      throw error
    }
  }

  // Function to update form
  const updateForm = async (formData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/forms/update`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to update form: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      
      if (result.success) {
        return result
      } else {
        throw new Error('Update failed: ' + (result.message || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error updating form:', error)
      throw error
    }
  }

  const fetchForms = async () => {
    try {
      setLoading(true)
      
      const response = await fetch(
        `${API_BASE_URL}/api/forms/all/${ORGANIZATION_ID}/${TABLE_ID}`
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch forms: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      
      if (result.success && Array.isArray(result.form)) {
        // Process the forms to add field counts and format dates
        const processedForms = result.form.map(form => ({
          ...form,
          // Count the number of valid fields
          fieldCount: countFormFields(form),
          // Format the created date
          created: form.created_at ? new Date(form.created_at).toLocaleDateString() : 'Unknown',
          // Ensure we have a form_id
          form_id: form.form_id || form.id
        }))
        
        setForms(processedForms)
      } else {
        throw new Error('Invalid response format from server')
      }
      
    } catch (error) {
      console.error('Error fetching forms:', error)
      toast.error("Failed to load forms from server")
      
      // Fallback to empty array
      setForms([])
    } finally {
      setLoading(false)
    }
  }

  const copyFormLink = (formId) => {
    const link = `${window.location.origin}/forms/${formId}`
    navigator.clipboard.writeText(link)
    toast.success("Form link copied to clipboard!")
  }

  const openFormInNewTab = (formId) => {
    const link = `${window.location.origin}/forms/${formId}`
    window.open(link, '_blank', 'noopener,noreferrer')
    toast.info("Opening form in new tab")
  }

  const handleEditForm = async (formId) => {
    try {
      toast.info("Loading form details...")
      const formDetails = await getFormDetails(formId)
      
      // Parse the fields for editing - handle both character-by-character and simple object formats
      const parsedFields = formDetails.fields.map(field => {
        const parsedField = parseFieldData(field)
        
        // Extract options from the parsed field
        let options = []
        if (Array.isArray(parsedField.options)) {
          options = parsedField.options
        } else if (typeof parsedField.options === 'string') {
          options = parsedField.options.split(',').map(opt => opt.trim()).filter(opt => opt)
        }
        
        return {
          id: parsedField.id || parsedField.name || `field-${Date.now()}`,
          name: parsedField.name || parsedField.id || `field-${Date.now()}`,
          type: parsedField.type || 'text',
          label: parsedField.label || parsedField.name || 'Field',
          placeholder: parsedField.placeholder || '',
          required: parsedField.required === true || parsedField.required === 'true' || false,
          options: options
        }
      }).filter(field => field.name && field.type) // Only include valid fields
      
      setEditingForm({
        ...formDetails,
        parsedFields
      })
      setEditDialogOpen(true)
      
    } catch (error) {
      console.error('Error loading form for editing:', error)
      toast.error("Failed to load form for editing")
    }
  }

  const handleUpdateForm = async (updatedData) => {
    try {
      toast.info("Updating form...")
      
      // Prepare the data for API - exactly matching the required format
      const apiData = {
        form_id: editingForm.form_id,
        table_id: TABLE_ID,
        organization_id: ORGANIZATION_ID,
        form_name: updatedData.form_name,
        description: updatedData.description,
        fields: updatedData.fields.map(field => {
          // Create field object matching the exact API format
          const fieldObj = {
            name: field.name, // Use name as primary identifier
            type: field.type,
            required: field.required ? "true" : "false" // Must be string "true" or "false"
          }
          
          // Add label if present and different from name
          if (field.label && field.label !== field.name) {
            fieldObj.label = field.label
          }
          
          // Add placeholder if present
          if (field.placeholder) {
            fieldObj.placeholder = field.placeholder
          }
          
          // Add options for select fields (as string)
          if ((field.type === "select" || field.type === "checkbox" || field.type === "radio") && field.options && field.options.length > 0) {
            fieldObj.options = Array.isArray(field.options) ? field.options.join(', ') : field.options
          }
          
          return fieldObj
        })
      }

      console.log('Sending update data to API:', JSON.stringify(apiData, null, 2))
      
      const result = await updateForm(apiData)
      
      toast.success("Form updated successfully!")
      setEditDialogOpen(false)
      setEditingForm(null)
      
      // Refresh the forms list
      fetchForms()
      
      return result
      
    } catch (error) {
      console.error('Error updating form:', error)
      toast.error(`Failed to update form: ${error.message}`)
      throw error
    }
  }

  const refreshForms = () => {
    fetchForms()
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading forms...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Forms</h1>
          <p className="text-muted-foreground">
            Manage and view all your created forms
          </p>
        </div>
        <Button onClick={refreshForms} variant="outline" className="gap-2">
          <Loader2 className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Forms List ({forms.length} forms)</CardTitle>
        </CardHeader>
        <CardContent>
          {forms.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Eye className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No Forms Found</h3>
              <p className="text-muted-foreground mb-4">
                You haven't created any forms yet, or there was an error loading them.
              </p>
              <Button onClick={refreshForms} variant="outline">
                Try Again
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Form Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Fields</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forms.map((form) => (
                  <TableRow key={form.form_id}>
                    <TableCell className="font-medium">
                      <div>
                        {form.form_name}
                        <div className="text-xs text-muted-foreground mt-1">
                          ID: {form.form_id?.substring(0, 8)}...
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {form.description || 'No description'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        {form.fieldCount || 0} fields
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {form.created}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={form.published ? "default" : "secondary"}>
                        {form.published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleEditForm(form.form_id)}
                          title="Edit form"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => copyFormLink(form.form_id)}
                          title="Copy form link"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => openFormInNewTab(form.form_id)}
                          title="Open form in new tab"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          title="View analytics"
                          disabled
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Form Dialog */}
      <EditFormDialog
        form={editingForm}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleUpdateForm}
      />
    </div>
  )
}