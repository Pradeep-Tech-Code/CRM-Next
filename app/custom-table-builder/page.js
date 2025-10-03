"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Save, X, Trash2, Settings, Type, Hash, Calendar, CheckSquare, Database, Mail, Phone, Users, FileText, List, Calculator, User, Sparkles, GripVertical } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { format } from "date-fns"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const columnTypes = [
  // Essential Types
  { value: "text", label: "Text", icon: Type, category: "essential" },
  { value: "email", label: "Email", icon: Mail, category: "essential" },
  { value: "number", label: "Number", icon: Hash, category: "essential" },
  { value: "formula", label: "Formula", icon: Calculator, category: "essential" },
  { value: "status", label: "Status", icon: CheckSquare, category: "essential" },
  { value: "file", label: "File", icon: FileText, category: "essential" },
  
  // Super Useful Types
  { value: "date", label: "Date", icon: Calendar, category: "super-useful" },
  { value: "phone", label: "Phone", icon: Phone, category: "super-useful" },
  { value: "checkbox", label: "Checkbox", icon: CheckSquare, category: "super-useful" },
  { value: "people", label: "People", icon: Users, category: "super-useful" },
  { value: "dropdown", label: "Dropdown", icon: List, category: "super-useful" },
  { value: "custom", label: "Custom Type", icon: Sparkles, category: "custom" },
]

// Sortable Table Component
function SortableTable({ table, onTableClick, onDeleteTable, onAddColumn, onAddRow, currentTable, onUpdateColumns, onUpdateTables, tables, setTables }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: table.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 cursor-grab active:cursor-grabbing"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </Button>
              <CardTitle className="flex items-center gap-3 cursor-pointer" onClick={() => onTableClick(table)}>
                <Database className="h-5 w-5 text-primary" />
                {table.name}
                <Badge variant="secondary" className="text-xs">
                  {table.columns.length} columns × {table.rows.length} rows
                </Badge>
              </CardTitle>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onAddColumn}
                className="gap-1 h-8"
              >
                <Plus className="h-3 w-3" />
                Add Column
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onAddRow}
                className="gap-1 h-8"
              >
                <Plus className="h-3 w-3" />
                Add Row
              </Button>
              <Button
                variant={currentTable?.id === table.id ? "default" : "outline"}
                size="sm"
                onClick={() => onTableClick(table)}
                className="h-8"
              >
                {currentTable?.id === table.id ? "Collapse" : "Expand"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDeleteTable}
                className="h-8 w-8 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {currentTable?.id === table.id && (
          <TableContent 
            table={table} 
            onUpdateColumns={onUpdateColumns}
            onUpdateTables={onUpdateTables}
            tables={tables}
            setTables={setTables}
          />
        )}
      </Card>
    </div>
  )
}

// Sortable Column Component
function SortableColumn({ column, table, onUpdate, onDelete, onEditName }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <TableHead 
      ref={setNodeRef}
      style={style}
      className="relative group bg-muted/50 border-r border-border last:border-r-0"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 cursor-grab active:cursor-grabbing shrink-0"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </Button>
          <EditableColumnName
            column={column}
            onSave={onEditName}
          />
          <Badge variant="secondary" className="text-xs shrink-0">
            {columnTypes.find(t => t.value === column.type)?.label}
          </Badge>
        </div>
        
        <ColumnSettings
          column={column}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      </div>
    </TableHead>
  )
}

// Table Content Component
function TableContent({ table, onUpdateColumns, onUpdateTables, tables, setTables }) {
  const [activeColumn, setActiveColumn] = useState(null)
  const [editingCell, setEditingCell] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event) => {
    setActiveColumn(table.columns.find(col => col.id === event.active.id))
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveColumn(null)

    if (active.id !== over?.id) {
      const oldIndex = table.columns.findIndex(col => col.id === active.id)
      const newIndex = table.columns.findIndex(col => col.id === over.id)

      const newColumns = arrayMove(table.columns, oldIndex, newIndex)
      onUpdateColumns(table.id, newColumns)
    }
  }

  const startEditing = (rowId, columnId) => {
    const column = table.columns.find(col => col.id === columnId)
    if (!column.editable) return
    setEditingCell({ rowId, columnId })
  }

  const saveCellEdit = (rowId, columnId, value) => {
    const updatedRows = table.rows.map(row => {
      if (row.id === rowId) {
        return {
          ...row,
          cells: { ...row.cells, [columnId]: value }
        }
      }
      return row
    })

    const updatedTable = { ...table, rows: updatedRows }
    const updatedTables = tables.map(t => t.id === table.id ? updatedTable : t)
    setTables(updatedTables)
    setEditingCell(null)
  }

  const deleteRow = (rowId) => {
    const updatedRows = table.rows.filter(row => row.id !== rowId)
    const updatedTable = { ...table, rows: updatedRows }
    const updatedTables = tables.map(t => t.id === table.id ? updatedTable : t)
    setTables(updatedTables)
    toast.success("Row deleted")
  }

  const addRow = () => {
    const newRow = {
      id: `row-${Date.now()}`,
      cells: table.columns.reduce((acc, column) => {
        acc[column.id] = getDefaultValueForType(column.type)
        return acc
      }, {})
    }

    const updatedTable = { ...table, rows: [...table.rows, newRow] }
    const updatedTables = tables.map(t => t.id === table.id ? updatedTable : t)
    setTables(updatedTables)
  }

  const renderCell = (row, column) => {
    const value = row.cells[column.id]
    const isEditing = editingCell?.rowId === row.id && editingCell?.columnId === column.id

    if (isEditing) {
      return (
        <EditableCell
          value={value}
          column={column}
          onSave={(newValue) => saveCellEdit(row.id, column.id, newValue)}
          onCancel={() => setEditingCell(null)}
        />
      )
    }

    switch (column.type) {
      case "checkbox":
        return (
          <div className="flex items-center justify-center">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => saveCellEdit(row.id, column.id, e.target.checked)}
              className="h-4 w-4"
            />
          </div>
        )
      case "date":
        return value ? format(new Date(value), "PPP") : "-"
      case "dropdown":
        return value || "-"
      case "status":
        return (
          <Badge variant={value === "active" ? "default" : "secondary"}>
            {value || "inactive"}
          </Badge>
        )
      default:
        return value || "-"
    }
  }

  return (
    <CardContent className="pt-0">
      <div className="border rounded-lg overflow-hidden">
        <ScrollArea className="w-full">
          <div className="min-w-[600px]">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableContext items={table.columns.map(col => col.id)} strategy={horizontalListSortingStrategy}>
                      {table.columns.map(column => (
                        <SortableColumn
                          key={column.id}
                          column={column}
                          table={table}
                          onUpdate={(updates) => onUpdateColumns(table.id, column.id, updates)}
                          onDelete={() => onUpdateColumns(table.id, column.id, null, true)}
                          onEditName={(newName) => onUpdateColumns(table.id, column.id, { name: newName })}
                        />
                      ))}
                    </SortableContext>
                    <TableHead className="w-12 bg-muted/50 border-l border-border">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={addRow}
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
                    <TableRow key={row.id} className="hover:bg-muted/50">
                      {table.columns.map(column => (
                        <TableCell
                          key={`${row.id}-${column.id}`}
                          className={`border-r border-border last:border-r-0 ${
                            column.editable 
                              ? "cursor-pointer hover:bg-muted/70 hover:ring-1 hover:ring-primary/30" 
                              : ""
                          }`}
                          onClick={() => startEditing(row.id, column.id)}
                        >
                          <div className={`
                            ${column.type === 'number' ? 'text-right' : ''}
                            ${column.type === 'checkbox' ? 'flex justify-center' : ''}
                          `}>
                            {renderCell(row, column)}
                          </div>
                        </TableCell>
                      ))}
                      <TableCell className="w-12 border-l border-border">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteRow(row.id)}
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <DragOverlay>
                {activeColumn ? (
                  <TableHead className="bg-primary/20 border-2 border-primary border-dashed">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{activeColumn.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {columnTypes.find(t => t.value === activeColumn.type)?.label}
                      </Badge>
                    </div>
                  </TableHead>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        </ScrollArea>
      </div>
    </CardContent>
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
        className="h-7 text-sm w-32"
      />
    )
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="flex items-center gap-1 hover:bg-muted px-2 py-1 rounded text-left group min-w-0 flex-1"
    >
      <span className="font-medium truncate">{column.name}</span>
      <Edit className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
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
          className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
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

function EditableCell({ value, column, onSave, onCancel }) {
  const [inputValue, setInputValue] = useState(value)
  const inputRef = useRef(null)
  const [date, setDate] = useState(value ? new Date(value) : undefined)

  useEffect(() => {
    if (inputRef.current && column.type !== "date") {
      inputRef.current.focus()
    }
  }, [])

  const handleSave = () => {
    if (column.type === "date" && date) {
      onSave(date.toISOString())
    } else {
      onSave(inputValue)
    }
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

  const handleDateSelect = (selectedDate) => {
    setDate(selectedDate)
    onSave(selectedDate.toISOString())
  }

  switch (column.type) {
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
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full h-8 justify-start text-left font-normal"
            >
              <Calendar className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      )
    case "email":
      return (
        <Input
          ref={inputRef}
          type="email"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="h-8"
        />
      )
    case "phone":
      return (
        <Input
          ref={inputRef}
          type="tel"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="h-8"
        />
      )
    case "dropdown":
      return (
        <Select value={inputValue} onValueChange={setInputValue} onOpenChange={(open) => !open && handleSave()}>
          <SelectTrigger ref={inputRef} className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {column.options?.map((option, index) => (
              <SelectItem key={index} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

function getDefaultValueForType(type) {
  switch (type) {
    case "number":
      return 0
    case "checkbox":
      return false
    case "date":
      return new Date().toISOString()
    case "dropdown":
      return ""
    case "status":
      return "active"
    default:
      return ""
  }
}

export default function CustomTableBuilder() {
  const [tables, setTables] = useState([])
  const [currentTable, setCurrentTable] = useState(null)
  const [isCreatingTable, setIsCreatingTable] = useState(false)
  const [newTableName, setNewTableName] = useState("")
  const [isAddingColumn, setIsAddingColumn] = useState(false)
  const [newColumnConfig, setNewColumnConfig] = useState({
    name: "",
    type: "text",
    options: []
  })

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

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

    setTables([newTable, ...tables])
    setCurrentTable(newTable)
    setNewTableName("")
    setIsCreatingTable(false)
    toast.success("Table created successfully!")
  }

  const openAddColumnModal = (table = currentTable) => {
    if (!table) return
    setCurrentTable(table)
    setNewColumnConfig({
      name: "",
      type: "text",
      options: []
    })
    setIsAddingColumn(true)
  }

  const addColumn = () => {
    if (!newColumnConfig.name.trim()) {
      toast.error("Please enter a column name")
      return
    }

    const targetTable = currentTable
    if (!targetTable) return

    const newColumn = {
      id: `col-${Date.now()}`,
      name: newColumnConfig.name.trim(),
      type: newColumnConfig.type,
      editable: true,
      options: newColumnConfig.options
    }

    const updatedTable = {
      ...targetTable,
      columns: [...targetTable.columns, newColumn],
      rows: targetTable.rows.map(row => ({
        ...row,
        cells: { 
          ...row.cells, 
          [newColumn.id]: getDefaultValueForType(newColumnConfig.type) 
        }
      }))
    }

    const updatedTables = tables.map(table => 
      table.id === targetTable.id ? updatedTable : table
    )
    
    setTables(updatedTables)
    setCurrentTable(updatedTable)
    setIsAddingColumn(false)
    toast.success("Column added successfully!")
  }

  const addRow = (tableId = currentTable?.id) => {
    const targetTable = tableId ? tables.find(t => t.id === tableId) : currentTable
    if (!targetTable) return

    const newRow = {
      id: `row-${Date.now()}`,
      cells: targetTable.columns.reduce((acc, column) => {
        acc[column.id] = getDefaultValueForType(column.type)
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

  const updateColumns = (tableId, columnId, updates, isDelete = false) => {
    const targetTable = tables.find(t => t.id === tableId)
    if (!targetTable) return

    if (Array.isArray(columnId)) {
      // Reordering columns
      const updatedTable = { ...targetTable, columns: columnId }
      const updatedTables = tables.map(table =>
        table.id === tableId ? updatedTable : table
      )
      setTables(updatedTables)
      if (currentTable?.id === tableId) {
        setCurrentTable(updatedTable)
      }
    } else if (isDelete) {
      // Delete column
      const updatedColumns = targetTable.columns.filter(col => col.id !== columnId)
      const updatedRows = targetTable.rows.map(row => {
        const { [columnId]: removed, ...remainingCells } = row.cells
        return { ...row, cells: remainingCells }
      })
      const updatedTable = { ...targetTable, columns: updatedColumns, rows: updatedRows }
      const updatedTables = tables.map(table => table.id === tableId ? updatedTable : table)
      setTables(updatedTables)
      if (currentTable?.id === tableId) {
        setCurrentTable(updatedTable)
      }
      toast.success("Column deleted")
    } else {
      // Update column
      const updatedColumns = targetTable.columns.map(col =>
        col.id === columnId ? { ...col, ...updates } : col
      )
      const updatedTable = { ...targetTable, columns: updatedColumns }
      const updatedTables = tables.map(table => table.id === tableId ? updatedTable : table)
      setTables(updatedTables)
      if (currentTable?.id === tableId) {
        setCurrentTable(updatedTable)
      }
    }
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

  const deleteTable = (tableId) => {
    const updatedTables = tables.filter(table => table.id !== tableId)
    setTables(updatedTables)
    
    if (currentTable?.id === tableId) {
      setCurrentTable(updatedTables[0] || null)
    }
    
    toast.success("Table deleted")
  }

  const handleTableDragEnd = (event) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = tables.findIndex(table => table.id === active.id)
      const newIndex = tables.findIndex(table => table.id === over.id)

      setTables((items) => arrayMove(items, oldIndex, newIndex))
    }
  }

  const essentialTypes = columnTypes.filter(type => type.category === "essential")
  const superUsefulTypes = columnTypes.filter(type => type.category === "super-useful")
  const customTypes = columnTypes.filter(type => type.category === "custom")

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
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleTableDragEnd}
        >
          <SortableContext items={tables.map(table => table.id)} strategy={verticalListSortingStrategy}>
            {tables.map(table => (
              <SortableTable
                key={table.id}
                table={table}
                onTableClick={setCurrentTable}
                onDeleteTable={() => deleteTable(table.id)}
                onAddColumn={() => openAddColumnModal(table)}
                onAddRow={() => addRow(table.id)}
                currentTable={currentTable}
                onUpdateColumns={updateColumns}
                onUpdateTables={setTables}
                tables={tables}
                setTables={setTables}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {/* Add Column Modal */}
      <Dialog open={isAddingColumn} onOpenChange={setIsAddingColumn}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Column</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Column Name</label>
              <Input
                value={newColumnConfig.name}
                onChange={(e) => setNewColumnConfig({...newColumnConfig, name: e.target.value})}
                placeholder="Enter column name"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-3 block">Column Type</label>
              
              {/* Essential Types */}
              <div className="mb-6">
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">Essential Types</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {essentialTypes.map(type => (
                    <Button
                      key={type.value}
                      variant={newColumnConfig.type === type.value ? "default" : "outline"}
                      className="justify-start h-auto py-3 px-4"
                      onClick={() => setNewColumnConfig({...newColumnConfig, type: type.value})}
                    >
                      <type.icon className="h-4 w-4 mr-2" />
                      {type.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Super Useful Types */}
              <div className="mb-6">
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">Super Useful</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {superUsefulTypes.map(type => (
                    <Button
                      key={type.value}
                      variant={newColumnConfig.type === type.value ? "default" : "outline"}
                      className="justify-start h-auto py-3 px-4"
                      onClick={() => setNewColumnConfig({...newColumnConfig, type: type.value})}
                    >
                      <type.icon className="h-4 w-4 mr-2" />
                      {type.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Types */}
              <div>
                <h4 className="text-sm font-medium mb-3 text-muted-foreground">Custom</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {customTypes.map(type => (
                    <Button
                      key={type.value}
                      variant={newColumnConfig.type === type.value ? "default" : "outline"}
                      className="justify-start h-auto py-3 px-4"
                      onClick={() => setNewColumnConfig({...newColumnConfig, type: type.value})}
                    >
                      <type.icon className="h-4 w-4 mr-2" />
                      {type.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Additional Options based on type */}
            {(newColumnConfig.type === "dropdown" || newColumnConfig.type === "status") && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {newColumnConfig.type === "dropdown" ? "Dropdown Options" : "Status Options"}
                </label>
                <div className="space-y-2">
                  {newColumnConfig.options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...newColumnConfig.options]
                          newOptions[index] = e.target.value
                          setNewColumnConfig({...newColumnConfig, options: newOptions})
                        }}
                        placeholder={`Option ${index + 1}`}
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const newOptions = newColumnConfig.options.filter((_, i) => i !== index)
                          setNewColumnConfig({...newColumnConfig, options: newOptions})
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => setNewColumnConfig({
                      ...newColumnConfig, 
                      options: [...newColumnConfig.options, ""]
                    })}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Option
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => setIsAddingColumn(false)}>
                Cancel
              </Button>
              <Button onClick={addColumn}>
                Add Column
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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