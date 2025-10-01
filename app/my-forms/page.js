"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Eye, Copy, BarChart3, Calendar, Users, ExternalLink, Loader2 } from "lucide-react"
import { toast } from "sonner"

// API configuration
const API_BASE_URL = 'http://10.10.15.194:3000'
const ORGANIZATION_ID = 'c8c72c21-7b5c-435a-912a-803105e7ecc9'
const TABLE_ID = 'b9bc249f-9099-4436-bfc6-9dd74d1e8fdc'

export default function MyFormsPage() {
  const [forms, setForms] = useState([])
  const [loading, setLoading] = useState(true)

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
      
      // Case 3: Field is already a proper object
      if (typeof field === 'object' && field !== null) {
        // Check if it has expected field properties (not character objects)
        if (field.id || field.name || field.type || field.label) {
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
  const countFormFields = (form) => {
    if (!form.fields || !Array.isArray(form.fields)) return 0
    
    let fieldCount = 0
    form.fields.forEach(field => {
      const parsedField = parseFieldData(field)
      // Only count valid fields
      if (parsedField && parsedField.id && parsedField.type) {
        fieldCount++
      }
    })
    
    return fieldCount
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
      console.log('API Forms Response:', result)
      
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

      {/* Debug information - you can remove this in production */}
      {/* {forms.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-2">
              Showing {forms.length} forms. First form sample:
            </p>
            <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-40">
              {JSON.stringify(
                {
                  name: forms[0]?.form_name,
                  id: forms[0]?.form_id,
                  fields: forms[0]?.fieldCount,
                  raw_fields_sample: forms[0]?.fields?.[0]
                },
                null,
                2
              )}
            </pre>
          </CardContent>
        </Card>
      )} */}
    </div>
  )
}