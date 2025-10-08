"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trash2, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { FieldRenderer } from "./field-renderer"

export function SortableFieldItem({ field, selectedField, onSelectField, onDeleteField, isActive }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 'auto',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative transition-all duration-200",
        isDragging && "opacity-30 scale-95 shadow-lg",
      )}
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
            <div 
              className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
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
  )
}