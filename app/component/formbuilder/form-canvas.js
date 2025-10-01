"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, GripVertical, Settings, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { FieldRenderer } from "./field-renderer"

export function FormCanvas({ fields, selectedField, onSelectField, onDeleteField, onMoveField, onAddField }) {
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)
  const [isDragOverCanvas, setIsDragOverCanvas] = useState(false)

  const handleDragStart = (e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.setData("application/json", JSON.stringify({ type: "reorder", index }))
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"

    if (typeof index === "number") {
      setDragOverIndex(index)
    }
    setIsDragOverCanvas(true)
  }

  const handleDragLeave = (e) => {
    // Only reset if we're leaving the canvas entirely
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverIndex(null)
      setIsDragOverCanvas(false)
    }
  }

  const handleDrop = (e, dropIndex) => {
    e.preventDefault()

    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"))

      if (data.type === "field") {
        // Adding new field from palette
        onAddField(data.fieldType)
      } else if (data.type === "reorder" && draggedIndex !== null && typeof dropIndex === "number") {
        // Reordering existing fields
        if (draggedIndex !== dropIndex) {
          onMoveField(draggedIndex, dropIndex)
        }
      }
    } catch (error) {
      console.error("Error parsing drag data:", error)
    }

    setDraggedIndex(null)
    setDragOverIndex(null)
    setIsDragOverCanvas(false)
  }

  const handleCanvasDrop = (e) => {
    e.preventDefault()

    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"))

      if (data.type === "field") {
        // Add field to end of form
        onAddField(data.fieldType)
      }
    } catch (error) {
      console.error("Error parsing drag data:", error)
    }

    setIsDragOverCanvas(false)
  }

  if (fields.length === 0) {
    return (
      <div
        className={cn(
          "h-full flex items-center justify-center transition-colors duration-200",
          isDragOverCanvas && "bg-primary/5 border-2 border-dashed border-primary",
        )}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragOverCanvas(true)
        }}
        onDragLeave={handleDragLeave}
        onDrop={handleCanvasDrop}
      >
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            {isDragOverCanvas ? (
              <Plus className="h-8 w-8 text-primary" />
            ) : (
              <Settings className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <h3 className="text-lg font-medium mb-2">
            {isDragOverCanvas ? "Drop to Add Field" : "Start Building Your Form"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {isDragOverCanvas
              ? "Release to add this field to your form"
              : "Add fields from the palette on the left to start creating your form. Drag and drop to reorder fields."}
          </p>
          {!isDragOverCanvas && (
            <Badge variant="outline" className="text-xs">
              Tip: Click on any field to configure its properties
            </Badge>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className="h-full overflow-y-auto p-6"
      onDragOver={(e) => handleDragOver(e)}
      onDragLeave={handleDragLeave}
      onDrop={handleCanvasDrop}
    >
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-2">Form Preview</h2>
          <p className="text-muted-foreground">Configure your form fields and see the live preview</p>
        </div>

        {fields.map((field, index) => (
          <div
            key={field.id}
            className={cn(
              "group relative transition-all duration-200",
              dragOverIndex === index && "border-t-4 border-primary pt-4",
              draggedIndex === index && "opacity-50 scale-95",
            )}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDrop={(e) => handleDrop(e, index)}
          >
            <Card
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md",
                selectedField?.id === field.id ? "ring-2 ring-primary border-primary/50" : "hover:border-primary/30",
              )}
              onClick={() => onSelectField(field)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <FieldRenderer field={field} />
                  </div>

                  <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteField(field.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {selectedField?.id === field.id && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        {field.type}
                      </Badge>
                      <span>•</span>
                      <span>ID: {field.id}</span>
                      {field.required && (
                        <>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs">
                            Required
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ))}

        {/* Drop zone at the end */}
        <div
          className={cn(
            "h-16 border-2 border-dashed border-transparent rounded-lg transition-colors duration-200 flex items-center justify-center",
            isDragOverCanvas && "border-primary bg-primary/5",
          )}
          onDragOver={(e) => {
            e.preventDefault()
            setIsDragOverCanvas(true)
          }}
          onDrop={handleCanvasDrop}
        >
          {isDragOverCanvas && <div className="text-sm text-primary font-medium">Drop field here to add to form</div>}
        </div>
      </div>
    </div>
  )
}
