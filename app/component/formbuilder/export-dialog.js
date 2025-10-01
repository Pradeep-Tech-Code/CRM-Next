"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Copy, Code } from "lucide-react"

export function ExportDialog({ fields, children }) {
  const [copied, setCopied] = useState(null)

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const generateReactCode = () => {
    return `import { useForm } from "@tanstack/react-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export function GeneratedForm() {
  const form = useForm({
    defaultValues: {
${fields
  .map(
    (field) =>
      `      ${field.id}: ${
        field.type === "checkbox" || (field.type === "select" && field.validation?.multiple) ? "[]" : '""'
      }`,
  )
  .join(",\n")}
    },
    onSubmit: async ({ value }) => {
      console.log("Form submitted:", value)
      // Handle form submission here
    },
  })

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}>
${fields
  .map((field) => {
    const fieldCode = generateFieldCode(field)
    return `      <form.Field name="${field.id}">
        {(fieldApi) => (
          <div className="space-y-2">
            ${fieldCode}
          </div>
        )}
      </form.Field>`
  })
  .join("\n\n")}
      
      <Button type="submit">Submit</Button>
    </form>
  )
}`
  }

  const generateFieldCode = (field) => {
    const label = `<Label>${field.label}${field.required ? " *" : ""}</Label>`

    switch (field.type) {
      case "text":
      case "email":
        return `${label}
            <Input
              type="${field.type}"
              placeholder="${field.placeholder || ""}"
              value={fieldApi.state.value}
              onChange={(e) => fieldApi.handleChange(e.target.value)}
            />`

      case "number":
        return `${label}
            <Input
              type="number"
              placeholder="${field.placeholder || ""}"
              value={fieldApi.state.value}
              onChange={(e) => fieldApi.handleChange(e.target.value)}
              ${field.validation?.min ? `min={${field.validation.min}}` : ""}
              ${field.validation?.max ? `max={${field.validation.max}}` : ""}
            />`

      case "textarea":
        return `${label}
            <Textarea
              placeholder="${field.placeholder || ""}"
              value={fieldApi.state.value}
              onChange={(e) => fieldApi.handleChange(e.target.value)}
            />`

      case "select":
        if (Boolean(JSON.parse(JSON.stringify(!!fields.find((f) => f.id === field.id)?.validation?.multiple)))) {
          return `${label}
            <div className="space-y-2 border border-input rounded-md bg-input p-2">
              <div className="text-sm text-muted-foreground mb-1">
                {Array.isArray(fieldApi.state.value) && fieldApi.state.value.length > 0
                  ? \`\${fieldApi.state.value.length} selected\`
                  : "${field.placeholder || "Select options"}"}
              </div>
${(field.options || [])
  .filter((option) => option && option.trim() !== "")
  .map(
    (option, index) => `              <div className="flex items-center space-x-2">
                <Checkbox
                  id="${field.id}-${index}"
                  checked={Array.isArray(fieldApi.state.value) ? fieldApi.state.value.includes("${option}") : false}
                  onCheckedChange={(checked) => {
                    const current = Array.isArray(fieldApi.state.value) ? fieldApi.state.value : []
                    if (checked) {
                      fieldApi.handleChange([...current, "${option}"])
                    } else {
                      fieldApi.handleChange(current.filter(v => v !== "${option}"))
                    }
                  }}
                />
                <Label htmlFor="${field.id}-${index}" className="text-sm font-normal cursor-pointer">${option}</Label>
              </div>`,
  )
  .join("\n")}
            </div>`
        }

        return `${label}
            <Select value={fieldApi.state.value} onValueChange={fieldApi.handleChange}>
              <SelectTrigger>
                <SelectValue placeholder="${field.placeholder || "Select an option"}" />
              </SelectTrigger>
              <SelectContent>
${field.options
  ?.filter((option) => option && option.trim() !== "")
  .map((option) => `                <SelectItem value="${option}">${option}</SelectItem>`)
  .join("\n")}
              </SelectContent>
            </Select>`

      case "checkbox":
        return `${label}
            <div className="space-y-2">
${field.options
  ?.map(
    (option, index) => `              <div className="flex items-center space-x-2">
                <Checkbox
                  id="${field.id}-${index}"
                  checked={fieldApi.state.value?.includes("${option}")}
                  onCheckedChange={(checked) => {
                    const current = fieldApi.state.value || []
                    if (checked) {
                      fieldApi.handleChange([...current, "${option}"])
                    } else {
                      fieldApi.handleChange(current.filter(v => v !== "${option}"))
                    }
                  }}
                />
                <Label htmlFor="${field.id}-${index}">${option}</Label>
              </div>`,
  )
  .join("\n")}
            </div>`

      case "radio":
        return `${label}
            <RadioGroup value={fieldApi.state.value} onValueChange={fieldApi.handleChange}>
${field.options
  ?.map(
    (option, index) => `              <div className="flex items-center space-x-2">
                <RadioGroupItem value="${option}" id="${field.id}-${index}" />
                <Label htmlFor="${field.id}-${index}">${option}</Label>
              </div>`,
  )
  .join("\n")}
            </RadioGroup>`

      default:
        return `${label}
            <Input value={fieldApi.state.value} onChange={(e) => fieldApi.handleChange(e.target.value)} />`
    }
  }

  const generateJSONSchema = () => {
    return JSON.stringify(
      {
        title: "Generated Form",
        type: "object",
        properties: fields.reduce((acc, field) => {
          let fieldSchema

          if (field.type === "number") {
            fieldSchema = { type: "number", title: field.label }
          } else if (field.type === "checkbox" || (field.type === "select" && field.validation?.multiple)) {
            fieldSchema = {
              type: "array",
              title: field.label,
              items: { type: "string", ...(field.options ? { enum: field.options } : {}) },
              uniqueItems: true,
            }
          } else {
            fieldSchema = {
              type: "string",
              title: field.label,
              ...(field.options ? { enum: field.options } : {}),
            }
          }

          if (field.placeholder) fieldSchema.description = field.placeholder
          if (field.validation?.min != null) fieldSchema.minimum = field.validation.min
          if (field.validation?.max != null) fieldSchema.maximum = field.validation.max

          if (field.validation?.pattern && field.validation.pattern.trim() !== "") {
            try {
              new RegExp(field.validation.pattern.trim())
              fieldSchema.pattern = field.validation.pattern.trim()
            } catch (e) {
              console.warn("Skipping invalid regex pattern in export:", field.validation.pattern)
            }
          }

          acc[field.id] = fieldSchema
          return acc
        }, {}),
        required: fields.filter((f) => f.required).map((f) => f.id),
      },
      null,
      2,
    )
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Export Form
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="react" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="react">React Component</TabsTrigger>
            <TabsTrigger value="json">JSON Schema</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
          </TabsList>

          <TabsContent value="react" className="mt-4 overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">React + TanStack Form</Badge>
                  <span className="text-sm text-muted-foreground">{fields.length} fields</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(generateReactCode(), "react")}
                  className="gap-2"
                >
                  {copied === "react" ? "Copied!" : <Copy className="h-4 w-4" />}
                  {copied === "react" ? "" : "Copy"}
                </Button>
              </div>
              <pre className="bg-muted p-4 rounded-md text-xs overflow-auto max-h-96 font-mono">
                {generateReactCode()}
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="json" className="mt-4 overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">JSON Schema</Badge>
                  <span className="text-sm text-muted-foreground">Standard format</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(generateJSONSchema(), "json")}
                  className="gap-2"
                >
                  {copied === "json" ? "Copied!" : <Copy className="h-4 w-4" />}
                  {copied === "json" ? "" : "Copy"}
                </Button>
              </div>
              <pre className="bg-muted p-4 rounded-md text-xs overflow-auto max-h-96 font-mono">
                {generateJSONSchema()}
              </pre>
            </div>
          </TabsContent>

          <TabsContent value="config" className="mt-4 overflow-hidden">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Form Configuration</Badge>
                  <span className="text-sm text-muted-foreground">Raw field data</span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(JSON.stringify(fields, null, 2), "config")}
                  className="gap-2"
                >
                  {copied === "config" ? "Copied!" : <Copy className="h-4 w-4" />}
                  {copied === "config" ? "" : "Copy"}
                </Button>
              </div>
              <pre className="bg-muted p-4 rounded-md text-xs overflow-auto max-h-96 font-mono">
                {JSON.stringify(fields, null, 2)}
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
