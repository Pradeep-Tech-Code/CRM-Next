"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import { 
  ArrowLeft, 
  Database, 
  RefreshCw, 
  AlertCircle, 
  Plus,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Settings,
  Search
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import axios from "axios"

// API Configuration
const API_BASE_URL = 'http://10.10.15.194:3000'
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiYzJhOTg1Y2UtZDM4NS00MzQ5LThmMGMtZDQ2ZTYzMDI3Y2U0Iiwib3JnYW5pemF0aW9uX2lkIjoiYzhjNzJjMjEtN2I1Yy00MzVhLTkxMmEtODAzMTA1ZTdlY2M5IiwiaWF0IjoxNzYwMDE2MDQ4LCJleHAiOjE3NjAxMDI0NDh9.LxRKpKcaPn5zZO6Pij0gwQ39YJuUo1BrUF2iYKFZriM'

export default function TableDataView({ table, onBack }) {
  const [columns, setColumns] = useState([])
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")

  // Fetch columns and records on component mount
  useEffect(() => {
    if (table?.table_id) {
      fetchTableData()
    }
  }, [table?.table_id])

  const fetchTableData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const [columnsResponse, recordsResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/datatables/${table.table_id}/columns`, {
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'Content-Type': 'application/json',
          }
        }),
        axios.get(`${API_BASE_URL}/api/records/${table.table_id}`, {
          headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'Content-Type': 'application/json',
          }
        })
      ])

      const columnsData = columnsResponse.data
      const recordsData = recordsResponse.data
      
      console.log('Columns data:', columnsData)
      console.log('Records data:', recordsData)
      
      // Debug: Show column to field mapping
      if (columnsData.length > 0 && recordsData.length > 0) {
        console.log('Column to Field Mapping:')
        columnsData.forEach(column => {
          console.log(`Column: ${column.column_name} (${column.column_id})`)
          const sampleRecord = recordsData.find(r => r.field_values && r.field_values[column.column_id])
          if (sampleRecord) {
            console.log(`  Sample value: ${sampleRecord.field_values[column.column_id]}`)
          } else {
            console.log(`  No data found for this column`)
          }
        })
      }
      
      setColumns(columnsData)
      setRecords(recordsData)
      toast.success(`Loaded ${recordsData.length} records successfully!`)
      
    } catch (err) {
      const errorMsg = `Failed to fetch table data: ${err.message}`
      setError(errorMsg)
      toast.error(errorMsg)
      console.error("Error fetching table data:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRecord = async (recordId) => {
    setLoading(true)
    
    try {
      const response = await axios.delete(`${API_BASE_URL}/api/records/${table.table_id}/${recordId}`, {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json',
        }
      })

      toast.success("Record deleted successfully!")
      setIsDeleteDialogOpen(false)
      setRecordToDelete(null)
      fetchTableData()
      
    } catch (err) {
      toast.error(`Failed to delete record: ${err.message}`)
      console.error("Error deleting record:", err)
    } finally {
      setLoading(false)
    }
  }

  // Helper function to get field value for a column
  const getFieldValue = (record, columnId) => {
    if (!record.field_values) return null
    return record.field_values[columnId] || null
  }

  // Helper function to format field value based on data type
  const formatFieldValue = (value, dataType) => {
    if (value === null || value === undefined || value === "") {
      return <span className="text-muted-foreground italic">-</span>
    }

    switch (dataType) {
      case 'email':
        return (
          <a href={`mailto:${value}`} className="text-blue-600 hover:underline">
            {value}
          </a>
        )
      case 'phone':
        try {
          const phoneData = JSON.parse(value)
          return (
            <div className="text-sm">
              <div className="font-medium">{phoneData.number}</div>
              <div className="text-xs text-muted-foreground">{phoneData.country}</div>
            </div>
          )
        } catch {
          return (
            <a href={`tel:${value}`} className="text-blue-600 hover:underline">
              {value}
            </a>
          )
        }
      case 'boolean':
        return (
          <Badge variant={value === 'true' || value === true ? 'default' : 'secondary'}>
            {value === 'true' || value === true ? 'Yes' : 'No'}
          </Badge>
        )
      case 'date':
        try {
          return new Date(value).toLocaleDateString()
        } catch {
          return <span className="truncate max-w-[200px]">{value}</span>
        }
      case 'datetime':
        try {
          return new Date(value).toLocaleString()
        } catch {
          return <span className="truncate max-w-[200px]">{value}</span>
        }
      case 'select':
        return <span className="truncate max-w-[200px]">{value}</span>
      case 'location':
        try {
          const locationData = JSON.parse(value)
          return (
            <div className="text-sm">
              <div className="font-medium">{locationData.address || locationData.name}</div>
              <div className="text-xs text-muted-foreground">
                {locationData.city}, {locationData.country}
              </div>
            </div>
          )
        } catch {
          return <span className="truncate max-w-[200px]">{value}</span>
        }
      default:
        return <span className="truncate max-w-[200px]">{value}</span>
    }
  }

  // Filter records based on search term
  const filteredRecords = records.filter(record => {
    if (!searchTerm) return true
    
    const searchLower = searchTerm.toLowerCase()
    
    // Search in field values
    if (record.field_values) {
      const fieldValues = Object.values(record.field_values)
      if (fieldValues.some(value => 
        value && String(value).toLowerCase().includes(searchLower)
      )) {
        return true
      }
    }
    
    // Search in record ID
    if (record.record_id && record.record_id.toLowerCase().includes(searchLower)) {
      return true
    }
    
    return false
  })

  // Create dynamic columns based on API response
  const createDynamicColumns = () => {
    if (!columns.length) return []

    const dynamicColumns = columns.map((column) => ({
      accessorKey: column.column_id,
      header: column.column_name,
      cell: ({ row }) => {
        const record = row.original
        // Get field value using helper function
        const fieldValue = getFieldValue(record, column.column_id)
        
        // Format field value using helper function
        return formatFieldValue(fieldValue, column.data_type)
      },
    }))

    // Add metadata columns
    const metadataColumns = [
      {
        accessorKey: "record_id",
        header: "Record ID",
        cell: ({ row }) => {
          const recordId = row.getValue("record_id")
          return (
            <div className="font-mono text-xs bg-muted/50 px-2 py-1 rounded-md border">
              {String(recordId).slice(0, 8)}...
            </div>
          )
        },
      },
      {
        accessorKey: "created_at",
        header: "Created At",
        cell: ({ row }) => {
          const date = new Date(row.getValue("created_at"))
          return (
            <div className="text-sm">
              <div className="font-medium text-foreground">
                {date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </div>
              <div className="text-xs text-muted-foreground">
                {date.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          )
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const record = row.original
          return (
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-primary/10"
                title="View record"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-primary/10"
                title="Edit record"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 hover:bg-destructive/10"
                    title="More actions"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[180px]">
                  <DropdownMenuItem className="cursor-pointer">
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Record
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="h-4 w-4 mr-2" />
                    Record Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => {
                      setRecordToDelete(record)
                      setIsDeleteDialogOpen(true)
                    }}
                    className="text-destructive cursor-pointer focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Record
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        },
      },
    ]

    return [...dynamicColumns, ...metadataColumns]
  }

  const formatValue = (value, dataType) => {
    if (value === null || value === undefined || value === "") return "-"
    
    switch (dataType) {
      case "date":
        return new Date(value).toLocaleDateString()
      case "datetime":
        return new Date(value).toLocaleString()
      case "boolean":
        return value ? "Yes" : "No"
      case "email":
        return (
          <a href={`mailto:${value}`} className="text-blue-600 hover:underline">
            {value}
          </a>
        )
      case "phone":
        return (
          <a href={`tel:${value}`} className="text-blue-600 hover:underline">
            {value}
          </a>
        )
      default:
        return String(value)
    }
  }

  if (loading && records.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading table data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Tables
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Database className="h-6 w-6" />
              {table?.table_name}
            </h1>
            <p className="text-muted-foreground">
              {table?.description || "Table data view"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={fetchTableData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Record
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={fetchTableData} className="ml-2">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Records</p>
                <p className="text-2xl font-bold">{records.length}</p>
              </div>
              <Database className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Columns</p>
                <p className="text-2xl font-bold">{columns.length}</p>
              </div>
              <Settings className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">With Data</p>
                <p className="text-2xl font-bold">
                  {records.filter(r => r.field_values && Object.keys(r.field_values).length > 0).length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Empty Records</p>
                <p className="text-2xl font-bold">
                  {records.filter(r => !r.field_values || Object.keys(r.field_values).length === 0).length}
                </p>
              </div>
              <Database className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Table Records</CardTitle>
              <p className="text-sm text-muted-foreground">
                {records.length} record{records.length !== 1 ? 's' : ''} found
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              {records.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Custom Search Input */}
          <div className="flex items-center py-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search records..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          
          <DataTable 
            columns={createDynamicColumns()} 
            data={filteredRecords} 
            searchKey=""
            searchPlaceholder=""
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this record? 
              This action cannot be undone and will permanently remove the record data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => handleDeleteRecord(recordToDelete?.record_id)}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete Record"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
