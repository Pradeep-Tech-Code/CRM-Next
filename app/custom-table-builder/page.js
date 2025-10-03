"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Save, X, Trash2, Settings, Type, Hash, Calendar, CheckSquare, Database } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

const columnTypes = [
  { value: "text", label: "Text", icon: Type },
  { value: "number", label: "Number", icon: Hash },
  { value: "date", label: "Date", icon: Calendar },
  { value: "boolean", label: "Checkbox", icon: CheckSquare },
]

export default function CustomTableBuilder() {
  const [tables, setTables] = useState([])
  const [currentTable, setCurrentTable] = useState(null)
  const [isCreatingTable, setIsCreatingTable] = useState(false)
  const [newTableName, setNewTableName] = useState("")
  const [editingCell, setEditingCell] = useState(null)

  const createNewTable = () => {
    if (!newTableName.trim()) {
      toast.error("Please enter a table name")
      return
    }

    const newTable = {
      id: `table-${Date.now()}`,
      name: newTableName.trim(),
      columns: [
        { id: "col-1", name: "Name", type: "text", editable: true }
      ],
      rows: [
        { id: "row-1", cells: { "col-1": "Sample Data" } }
      ],
      createdAt: new Date().toISOString()
    }

    // Add new table to the beginning of the array (top of the list)
    setTables([newTable, ...tables])
    setCurrentTable(newTable)
    setNewTableName("")
    setIsCreatingTable(false)
    toast.success("Table created successfully!")
  }

  const addColumn = (tableId = currentTable?.id) => {
    const targetTable = tableId ? tables.find(t => t.id === tableId) : currentTable
    if (!targetTable) return

    const newColumn = {
      id: `col-${Date.now()}`,
      name: "New Column",
      type: "text",
      editable: true
    }

    const updatedTable = {
      ...targetTable,
      columns: [...targetTable.columns, newColumn],
      rows: targetTable.rows.map(row => ({
        ...row,
        cells: { ...row.cells, [newColumn.id]: "" }
      }))
    }

    // Update the table in the list
    const updatedTables = tables.map(table => 
      table.id === targetTable.id ? updatedTable : table
    )
    
    setTables(updatedTables)
    if (currentTable?.id === targetTable.id) {
      setCurrentTable(updatedTable)
    }
  }

  const addRow = (tableId = currentTable?.id) => {
    const targetTable = tableId ? tables.find(t => t.id === tableId) : currentTable
    if (!targetTable) return

    const newRow = {
      id: `row-${Date.now()}`,
      cells: targetTable.columns.reduce((acc, column) => {
        acc[column.id] = column.type === "boolean" ? false : ""
        return acc
      }, {})
    }

    const updatedTable = {
      ...targetTable,
      rows: [...targetTable.rows, newRow]
    }

    const updatedTables = tables.map(table => 
      table.id === targetTable.id ? updatedTable : table
    )
    
    setTables(updatedTables)
    if (currentTable?.id === targetTable.id) {
      setCurrentTable(updatedTable)
    }
  }

  const updateColumn = (tableId, columnId, updates) => {
    const targetTable = tables.find(t => t.id === tableId)
    if (!targetTable) return

    const updatedColumns = targetTable.columns.map(col =>
      col.id === columnId ? { ...col, ...updates } : col
    )

    const updatedTable = { ...targetTable, columns: updatedColumns }
    const updatedTables = tables.map(table =>
      table.id === tableId ? updatedTable : table
    )

    setTables(updatedTables)
    if (currentTable?.id === tableId) {
      setCurrentTable(updatedTable)
    }
  }

  const deleteColumn = (tableId, columnId) => {
    const targetTable = tables.find(t => t.id === tableId)
    if (!targetTable) return

    const updatedColumns = targetTable.columns.filter(col => col.id !== columnId)
    const updatedRows = targetTable.rows.map(row => {
      const { [columnId]: removed, ...remainingCells } = row.cells
      return { ...row, cells: remainingCells }
    })

    const updatedTable = {
      ...targetTable,
      columns: updatedColumns,
      rows: updatedRows
    }

    const updatedTables = tables.map(table =>
      table.id === tableId ? updatedTable : table
    )

    setTables(updatedTables)
    if (currentTable?.id === tableId) {
      setCurrentTable(updatedTable)
    }
    toast.success("Column deleted")
  }

  const deleteRow = (tableId, rowId) => {
    const targetTable = tables.find(t => t.id === tableId)
    if (!targetTable) return

    const updatedRows = targetTable.rows.filter(row => row.id !== rowId)
    const updatedTable = { ...targetTable, rows: updatedRows }

    const updatedTables = tables.map(table =>
      table.id === tableId ? updatedTable : table
    )

    setTables(updatedTables)
    if (currentTable?.id === tableId) {
      setCurrentTable(updatedTable)
    }
    toast.success("Row deleted")
  }

  const startEditing = (tableId, rowId, columnId) => {
    const targetTable = tables.find(t => t.id === tableId)
    if (!targetTable) return

    const column = targetTable.columns.find(col => col.id === columnId)
    if (!column.editable) return

    setEditingCell({ tableId, rowId, columnId })
  }

  const saveCellEdit = (tableId, rowId, columnId, value) => {
    const targetTable = tables.find(t => t.id === tableId)
    if (!targetTable) return

    const updatedRows = targetTable.rows.map(row => {
      if (row.id === rowId) {
        return {
          ...row,
          cells: { ...row.cells, [columnId]: value }
        }
      }
      return row
    })

    const updatedTable = { ...targetTable, rows: updatedRows }
    const updatedTables = tables.map(table =>
      table.id === tableId ? updatedTable : table
    )

    setTables(updatedTables)
    if (currentTable?.id === tableId) {
      setCurrentTable(updatedTable)
    }
    setEditingCell(null)
  }

  const deleteTable = (tableId) => {
    const updatedTables = tables.filter(table => table.id !== tableId)
    setTables(updatedTables)
    
    if (currentTable?.id === tableId) {
      setCurrentTable(updatedTables[0] || null)
    }
    
    toast.success("Table deleted")
  }

  const renderCell = (table, row, column) => {
    const value = row.cells[column.id]
    const isEditing = editingCell?.tableId === table.id && editingCell?.rowId === row.id && editingCell?.columnId === column.id

    if (isEditing) {
      return (
        <EditableCell
          value={value}
          columnType={column.type}
          onSave={(newValue) => saveCellEdit(table.id, row.id, column.id, newValue)}
          onCancel={() => setEditingCell(null)}
        />
      )
    }

    switch (column.type) {
      case "boolean":
        return (
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => saveCellEdit(table.id, row.id, column.id, e.target.checked)}
              className="h-4 w-4"
            />
          </div>
        )
      case "date":
        return value ? new Date(value).toLocaleDateString() : "-"
      default:
        return value || "-"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Custom Tables</h1>
          <p className="text-muted-foreground">Create and manage your custom data tables</p>
        </div>
        
        <Dialog open={isCreatingTable} onOpenChange={setIsCreatingTable}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Table
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Table</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Table Name</label>
                <Input
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder="Enter table name"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") createNewTable()
                  }}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsCreatingTable(false)}>
                  Cancel
                </Button>
                <Button onClick={createNewTable}>
                  Create Table
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tables List */}
      <div className="space-y-4">
        {tables.map(table => (
          <Card key={table.id} className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3">
                  <Database className="h-5 w-5 text-primary" />
                  {table.name}
                  <Badge variant="secondary" className="text-xs">
                    {table.columns.length} columns × {table.rows.length} rows
                  </Badge>
                </CardTitle>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addColumn(table.id)}
                    className="gap-1 h-8"
                  >
                    <Plus className="h-3 w-3" />
                    Add Column
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addRow(table.id)}
                    className="gap-1 h-8"
                  >
                    <Plus className="h-3 w-3" />
                    Add Row
                  </Button>
                  <Button
                    variant={currentTable?.id === table.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentTable(currentTable?.id === table.id ? null : table)}
                    className="h-8"
                  >
                    {currentTable?.id === table.id ? "Collapse" : "Expand"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteTable(table.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {currentTable?.id === table.id && (
              <CardContent className="pt-0">
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {table.columns.map(column => (
                          <TableHead key={column.id} className="relative group">
                            <div className="flex items-center gap-2">
                              <EditableColumnName
                                column={column}
                                onSave={(newName) => updateColumn(table.id, column.id, { name: newName })}
                              />
                              <Badge variant="secondary" className="text-xs">
                                {columnTypes.find(t => t.value === column.type)?.label}
                              </Badge>
                            </div>
                            
                            <ColumnSettings
                              column={column}
                              onUpdate={(updates) => updateColumn(table.id, column.id, updates)}
                              onDelete={() => deleteColumn(table.id, column.id)}
                            />
                          </TableHead>
                        ))}
                        <TableHead className="w-12">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => addRow(table.id)}
                            title="Add row"
                            className="h-8 w-8"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {table.rows.map(row => (
                        <TableRow key={row.id}>
                          {table.columns.map(column => (
                            <TableCell
                              key={`${row.id}-${column.id}`}
                              className={`cursor-pointer hover:bg-muted/50 ${
                                column.editable ? "hover:ring-1 hover:ring-primary" : ""
                              }`}
                              onClick={() => startEditing(table.id, row.id, column.id)}
                            >
                              {renderCell(table, row, column)}
                            </TableCell>
                          ))}
                          <TableCell className="w-12">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteRow(table.id, row.id)}
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {tables.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-lg">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Database className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No Tables Created</h3>
          <p className="text-muted-foreground mb-4 max-w-md">
            Create your first custom table to start organizing and managing your data in a flexible spreadsheet-like interface.
          </p>
          <Button onClick={() => setIsCreatingTable(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Your First Table
          </Button>
        </div>
      )}
    </div>
  )
}

function EditableColumnName({ column, onSave }) {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(column.name)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = () => {
    if (value.trim() && value !== column.name) {
      onSave(value.trim())
    } else {
      setValue(column.name)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSave()
    } else if (e.key === "Escape") {
      setValue(column.name)
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={handleSave}
        onKeyDown={handleKeyDown}
        className="h-7 text-sm"
      />
    )
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="flex items-center gap-1 hover:bg-muted px-2 py-1 rounded text-left group"
    >
      <span className="font-medium">{column.name}</span>
      <Edit className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  )
}

function ColumnSettings({ column, onUpdate, onDelete }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 absolute right-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100"
        >
          <Settings className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Column Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Column Type</label>
            <Select
              value={column.type}
              onValueChange={(type) => onUpdate({ type })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {columnTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <type.icon className="h-4 w-4" />
                      {type.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Editable</label>
            <input
              type="checkbox"
              checked={column.editable}
              onChange={(e) => onUpdate({ editable: e.target.checked })}
              className="h-4 w-4"
            />
          </div>
          
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onDelete()
                setIsOpen(false)
              }}
            >
              Delete Column
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function EditableCell({ value, columnType, onSave, onCancel }) {
  const [inputValue, setInputValue] = useState(value)
  const inputRef = useRef(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  const handleSave = () => {
    onSave(inputValue)
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSave()
    } else if (e.key === "Escape") {
      onCancel()
    }
  }

  const handleBlur = () => {
    handleSave()
  }

  switch (columnType) {
    case "number":
      return (
        <Input
          ref={inputRef}
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="h-8"
        />
      )
    case "date":
      return (
        <Input
          ref={inputRef}
          type="date"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="h-8"
        />
      )
    default:
      return (
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="h-8"
        />
      )
  }
}