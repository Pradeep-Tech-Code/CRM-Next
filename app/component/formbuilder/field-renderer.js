
"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"

const LOCATION_DATA = {
  USA: {
    California: ["Los Angeles", "San Francisco", "San Diego"],
    Texas: ["Houston", "Dallas", "Austin"],
    NewYork: ["New York City", "Buffalo", "Rochester"],
  },
  India: {
    Maharashtra: ["Mumbai", "Pune", "Nagpur"],
    Karnataka: ["Bengaluru", "Mysuru", "Mangaluru"],
    Delhi: ["New Delhi", "Dwarka", "Rohini"],
  },
  Canada: {
    Ontario: ["Toronto", "Ottawa", "Hamilton"],
    Quebec: ["Montreal", "Quebec City", "Laval"],
    BC: ["Vancouver", "Victoria", "Richmond"],
  },
}

const PHONE_COUNTRIES = [
  { code: "US", label: "United States", dial: "+1", len: 10 },
  { code: "IN", label: "India", dial: "+91", len: 10 },
  { code: "GB", label: "United Kingdom", dial: "+44", len: 10 },
  { code: "CA", label: "Canada", dial: "+1", len: 10 },
  { code: "AU", label: "Australia", dial: "+61", len: 9 },
]

export function FieldRenderer({ field, value, onChange, disabled = false, invalid = false, error }) {

  console.log("hhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh", field)
  // Get placeholder text - show error message if invalid, otherwise use field placeholder
  const getPlaceholder = () => {
    if (invalid && error) {
      return error // Show validation message in placeholder
    }
    return field.placeholder || (field.type === "email" ? "Enter your email" : "")
  }

  const getSelectPlaceholder = () => {
    if (invalid && error) {
      return error // Show validation message in placeholder
    }
    return field.placeholder || "Select an option"
  }

  const renderField = () => {
    const placeholder = getPlaceholder()
    const selectPlaceholder = getSelectPlaceholder()

    switch (field.type) {
      case "text":
        return (
          <Input
            type="text"
            placeholder={placeholder}
            value={value || ""}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={disabled}
            className={`bg-input ${invalid ? "border-red-500 text-red-500 placeholder-red-500 focus-visible:ring-red-500" : ""}`}
          />
        )

      case "email":
        return (
          <Input
            type="email"
            placeholder={placeholder}
            value={value || ""}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={disabled}
            className={`bg-input ${invalid ? "border-red-500 text-red-500 placeholder-red-500 focus-visible:ring-red-500" : ""}`}
          />
        )

      case "number":
        return (
          <Input
            type="number"
            placeholder={placeholder}
            value={value || ""}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={disabled}
            min={field.validation?.min}
            max={field.validation?.max}
            className={`bg-input ${invalid ? "border-red-500 text-red-500 placeholder-red-500 focus-visible:ring-red-500" : ""}`}
          />
        )

      case "textarea":
        return (
          <Textarea
            placeholder={placeholder}
            value={value || ""}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={disabled}
            className={`bg-input min-h-[100px] ${invalid ? "border-red-500 text-red-500 placeholder-red-500 focus-visible:ring-red-500" : ""}`}
          />
        )

      case "select":
        console.log("HIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII",field)

        if (field.validation?.multiple) {
          // Multiple select using Command inside a Popover for a dropdown UX
          const selectedValues = Array.isArray(value) ? value : []
          return (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  disabled={disabled}
                  className={`flex h-10 w-full items-center justify-between rounded-md border bg-input px-3 py-2 text-sm hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-50 ${
                    invalid 
                      ? "border-red-500 text-red-500 placeholder-red-500" 
                      : "border-input text-foreground"
                  }`}
                >
                  <span className="truncate">
                    {selectedValues.length > 0
                      ? `${selectedValues.length} selected`
                      : selectPlaceholder}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="p-0 w-72 sm:w-80 bg-background text-foreground border border-border shadow-md" align="start">
                <Command className="bg-background text-foreground">
                  <CommandInput placeholder="Search..." />
                  <CommandEmpty>No option found.</CommandEmpty>
                  <CommandList>
                    <CommandGroup>
                      {field.options
                        ?.filter((option) => option && option.trim() !== "")
                        .map((option, index) => {
                        console.log("HIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIIII")

                          const checked = selectedValues.includes(option)
                          return (
                            <CommandItem
                              key={`${field.id}-${index}`}
                              value={option}
                              onSelect={() => {
                                if (!onChange) return
                                if (checked) {
                                  onChange(selectedValues.filter((v) => v !== option))
                                } else {
                                  onChange([...selectedValues, option])
                                }
                              }}
                              className="cursor-pointer"
                            >
                              <span className="mr-2 flex h-4 w-4 items-center justify-center border rounded-sm bg-background">
                                {checked && <Check className="h-3 w-3" />}
                              </span>
                              {option}
                            </CommandItem>
                          )
                        })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )
        } else {
          // Single select
          return (
            <Select value={value || ""} onValueChange={onChange} disabled={disabled}>
              <SelectTrigger className={`bg-input ${invalid ? "border-red-500 text-red-500" : ""}`}>
                <SelectValue placeholder={selectPlaceholder} />
              </SelectTrigger>
              <SelectContent className="bg-background text-foreground border border-border shadow-md z-50">
                {field.options
                  ?.filter((option) => option && option.trim() !== "")
                  .map((option, index) => (
                    <SelectItem
                      key={index}
                      value={option || `option-${index}`}
                      className="hover:bg-accent hover:text-accent-foreground cursor-pointer"
                    >
                      {option}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          )
        }

      case "checkbox":
        return (
          <div className="space-y-3">
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.id}-${index}`}
                  checked={Array.isArray(value) ? value.includes(option) : false}
                  onCheckedChange={(checked) => {
                    if (!onChange) return
                    const currentValue = Array.isArray(value) ? value : []
                    if (checked) {
                      onChange([...currentValue, option])
                    } else {
                      onChange(currentValue.filter((v) => v !== option))
                    }
                  }}
                  disabled={disabled}
                  className={invalid ? "border-red-500" : ""}
                />
                <Label htmlFor={`${field.id}-${index}`} className={`text-sm font-normal cursor-pointer ${invalid ? "text-red-500" : ""}`}>
                  {option}
                </Label>
              </div>
            ))}
            {invalid && (
              <div className="text-xs text-red-500 font-medium">
                {error}
              </div>
            )}
          </div>
        )

      case "radio":
        return (
          <div className="space-y-3">
            <RadioGroup value={value} onValueChange={onChange} disabled={disabled} className={invalid ? "text-red-500" : ""}>
              {field.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${field.id}-${index}`} className={invalid ? "border-red-500" : ""} />
                  <Label htmlFor={`${field.id}-${index}`} className="text-sm font-normal cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {invalid && (
              <div className="text-xs text-red-500 font-medium">
                {error}
              </div>
            )}
          </div>
        )

      case "file":
        return (
          <div className="space-y-2">
            <Input
              type="file"
              onChange={(e) => onChange?.(e.target.files?.[0] || null)}
              disabled={disabled}
              className={`bg-input file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 ${
                invalid ? "border-red-500" : ""
              }`}
              accept={field.validation?.accept}
              multiple={field.validation?.multiple}
            />
            {invalid && (
              <div className="text-xs text-red-500 font-medium">
                {error}
              </div>
            )}
          </div>
        )

      case "datetime":
        return (
          <Input
            type="datetime-local"
            placeholder={placeholder}
            value={value || ""}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={disabled}
            className={`bg-input ${invalid ? "border-red-500 text-red-500 placeholder-red-500 focus-visible:ring-red-500" : ""}`}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        )

      case "location": {
        const current = value || {}
        const countries = Object.keys(LOCATION_DATA)
        const states = current.country ? Object.keys(LOCATION_DATA[current.country] || {}) : []
        const cities = current.country && current.state ? LOCATION_DATA[current.country]?.[current.state] || [] : []

        const handleCountry = (country) => {
          onChange?.({ country, state: undefined, city: undefined })
        }
        const handleState = (state) => {
          onChange?.({ country: current.country, state, city: undefined })
        }
        const handleCity = (city) => {
          onChange?.({ country: current.country, state: current.state, city })
        }

        const getLocationPlaceholder = (type) => {
          if (invalid && error) {
            if (type === "country") return error
            if (type === "state" && !current.country) return "Select country first"
            if (type === "city" && !current.state) return "Select state first"
          }
          return type === "country" ? "Select country" : type === "state" ? "Select state" : "Select city"
        }

        return (
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Country</Label>
                <Select value={current.country || ""} onValueChange={handleCountry} disabled={disabled}>
                  <SelectTrigger className={`bg-input ${invalid ? "border-red-500 text-red-500" : ""}`}>
                    <SelectValue placeholder={getLocationPlaceholder("country")} />
                  </SelectTrigger>
                  <SelectContent className="bg-background text-foreground border border-border">
                    {countries.map((c) => (
                      <SelectItem key={c} value={c} className="hover:bg-accent">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">State</Label>
                <Select value={current.state || ""} onValueChange={handleState} disabled={disabled || !current.country}>
                  <SelectTrigger className={`bg-input ${invalid ? "border-red-500 text-red-500" : ""}`}>
                    <SelectValue placeholder={getLocationPlaceholder("state")} />
                  </SelectTrigger>
                  <SelectContent className="bg-background text-foreground border border-border">
                    {states.map((s) => (
                      <SelectItem key={s} value={s} className="hover:bg-accent">
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">City</Label>
                <Select value={current.city || ""} onValueChange={handleCity} disabled={disabled || !current.state}>
                  <SelectTrigger className={`bg-input ${invalid ? "border-red-500 text-red-500" : ""}`}>
                    <SelectValue placeholder={getLocationPlaceholder("city")} />
                  </SelectTrigger>
                  <SelectContent className="bg-background text-foreground border border-border">
                    {cities.map((city) => (
                      <SelectItem key={city} value={city} className="hover:bg-accent">
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {invalid && error && !current.country && (
              <div className="text-xs text-red-500 font-medium">
                {error}
              </div>
            )}
          </div>
        )
      }

      case "phone": {
        const current = value || {}
        const country = current.country || "US"
        const number = current.number || ""
        const handleCountry = (c) => onChange?.({ country: c, number })
        const handleNumber = (val) => {
          onChange?.({ country, number: val })
        }

        return (
          <div className="space-y-2">
            <div className="grid grid-cols-[120px_1fr] gap-2">
              <Select value={country} onValueChange={handleCountry} disabled={disabled}>
                <SelectTrigger className={`bg-input ${invalid ? "border-red-500 text-red-500" : ""}`}>
                  <SelectValue placeholder={invalid && error ? error : "CC"} />
                </SelectTrigger>
                <SelectContent className="bg-background text-foreground border border-border">
                  {PHONE_COUNTRIES.map((c) => (
                    <SelectItem key={c.code} value={c.code} className="hover:bg-accent">
                      {c.dial} {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="tel"
                inputMode="tel"
                placeholder={invalid && error ? error : (field.placeholder || "Phone number")}
                value={number}
                onChange={(e) => handleNumber(e.target.value)}
                disabled={disabled}
                className={`bg-input ${invalid ? "border-red-500 text-red-500 placeholder-red-500 focus-visible:ring-red-500" : ""}`}
                aria-label="Phone number"
              />
            </div>
            {!invalid && (
              <p className="text-xs text-muted-foreground">Select country code, then enter local number (digits only).</p>
            )}
          </div>
        )
      }

      default:
        return (
          <div className={`text-muted-foreground ${invalid ? "text-red-500" : ""}`}>
            {invalid && error ? error : "Unknown field type"}
          </div>
        )
    }
  }

  return (
    <div className="space-y-2 w-full">
      <Label className={`text-sm font-medium ${invalid ? "text-red-500" : ""}`}>
        {field.label}
        {field.required && <span className="text-red-500 ml-1 font-bold">*</span>}
      </Label>
      {renderField()}
      {/* Remove the error message display below the field */}
      {!invalid && field.validation?.pattern && (
        <p className="text-xs text-muted-foreground">Pattern: {field.validation.pattern}</p>
      )}
    </div>
  )
}
