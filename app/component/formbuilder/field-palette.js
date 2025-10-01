"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Type,
  Mail,
  Hash,
  ChevronDown,
  CheckSquare,
  AlignLeft,
  Circle,
  Upload,
  Calendar,
  PanelLeft,
  MapPin,
  Phone,
} from "lucide-react"

const fieldTypes = [
  { type: "text", label: "Text Input", icon: Type, description: "Single line text" },
  { type: "email", label: "Email", icon: Mail, description: "Email validation" },
  { type: "phone", label: "Phone Number", icon: Phone, description: "Country code + number" },
  { type: "number", label: "Number", icon: Hash, description: "Numeric input" },
  { type: "textarea", label: "Textarea", icon: AlignLeft, description: "Multi-line text" },
  { type: "select", label: "Select", icon: ChevronDown, description: "Dropdown options" },
  { type: "checkbox", label: "Checkbox", icon: CheckSquare, description: "Multiple choice" },
  { type: "radio", label: "Radio", icon: Circle, description: "Single choice" },
  { type: "file", label: "File Upload", icon: Upload, description: "File attachment" },
  { type: "datetime", label: "Date Time", icon: Calendar, description: "Date and time picker" },
  { type: "location", label: "Location", icon: MapPin, description: "Country → State → City" },
]

export function FieldPalette({ onAddField, collapsed = false, onToggleCollapse }) {
  const handleDragStart = (e, fieldType) => {
    e.dataTransfer.setData("application/json", JSON.stringify({ type: "field", fieldType }))
    e.dataTransfer.effectAllowed = "copy"
  }

  return (
    <div className={`h-full bg-sidebar border-r border-sidebar-border ${collapsed ? "w-16" : "w-64"} transition-all duration-300 flex flex-col`}>
      <Card className={`border-0 shadow-none bg-transparent m-0 h-full flex flex-col ${collapsed ? "p-2" : "p-4"}`}>
        <CardHeader className={`p-0 ${collapsed ? "mb-2" : "mb-4"} flex-shrink-0`}>
          <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between"} gap-2`}>
            {!collapsed && (
              <CardTitle className="text-sm font-semibold text-sidebar-foreground uppercase tracking-wide flex items-center gap-2">
                <div className="w-2 h-2 bg-sidebar-primary rounded-full"></div>
                Field Types
              </CardTitle>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex-shrink-0"
              onClick={onToggleCollapse}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <PanelLeft className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        {/* Scrollable Content Area */}
        <CardContent className="p-0 flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto pr-1">
            <div className={collapsed ? "space-y-1" : "space-y-2"}>
              {fieldTypes.map((field) => {
                const Icon = field.icon
                return (
                  <Button
                    key={field.type}
                    variant="ghost"
                    className={`w-full ${
                      collapsed 
                        ? "justify-center p-2 h-10 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" 
                        : "justify-start h-auto p-3 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    } field-type-button cursor-grab active:cursor-grabbing rounded-md transition-colors`}
                    onClick={() => onAddField(field.type)}
                    draggable
                    onDragStart={(e) => handleDragStart(e, field.type)}
                    title={collapsed ? `${field.label} — ${field.description}` : undefined}
                  >
                    {collapsed ? (
                      <Icon className="h-5 w-5" />
                    ) : (
                      <div className="flex items-start gap-3 w-full">
                        <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 text-left min-w-0">
                          <div className="font-medium text-sm truncate">{field.label}</div>
                          <div className="text-xs text-sidebar-foreground/70 truncate">{field.description}</div>
                        </div>
                      </div>
                    )}
                  </Button>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}