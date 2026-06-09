"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"
import { Check, ChevronDown, Search } from "lucide-react"

import { cn } from "@/lib/utils"

export type SearchableComboboxProps = {
  value: string
  onChange: (value: string) => void
  options: readonly string[]
  placeholder?: string
  searchPlaceholder?: string
  allowEmpty?: boolean
  emptyLabel?: string
  required?: boolean
  className?: string
  id?: string
  idPrefix?: string
}

type ComboboxOption = {
  value: string
  label: string
}

export function SearchableCombobox({
  value,
  onChange,
  options,
  placeholder = "선택",
  searchPlaceholder,
  allowEmpty = false,
  emptyLabel = "전체",
  required = false,
  className,
  id,
  idPrefix = "searchable-combobox",
}: SearchableComboboxProps) {
  const reactId = useId().replace(/:/g, "")
  const controlId = id ?? `${idPrefix}-${reactId}`
  const listboxId = `${controlId}-listbox`
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")

  const optionList = useMemo<ComboboxOption[]>(() => {
    const baseOptions = options.map((option) => ({ value: option, label: option }))

    if (!allowEmpty) {
      return baseOptions
    }

    return [{ value: "", label: emptyLabel }, ...baseOptions]
  }, [allowEmpty, emptyLabel, options])

  const filteredOptions = useMemo(() => {
    const term = query.trim().toLowerCase()

    if (!term) {
      return optionList
    }

    return optionList.filter((option) => option.label.toLowerCase().includes(term))
  }, [optionList, query])

  const selectedLabel = useMemo(() => {
    if (value.trim() === "") {
      return allowEmpty ? emptyLabel : placeholder
    }

    return optionList.find((option) => option.value === value)?.label ?? value
  }, [allowEmpty, emptyLabel, optionList, placeholder, value])

  function closeCombobox() {
    setOpen(false)
    setQuery("")
  }

  function openCombobox() {
    setQuery("")
    setOpen(true)
  }

  function selectOption(nextValue: string) {
    onChange(nextValue)
    closeCombobox()
  }

  useEffect(() => {
    if (!open) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        closeCombobox()
      }
    }

    document.addEventListener("mousedown", handlePointerDown)

    return () => document.removeEventListener("mousedown", handlePointerDown)
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }

    inputRef.current?.focus()
  }, [open])

  const controlClassName = cn(
    "block w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-left text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10",
  )

  return (
    <div ref={rootRef} className={cn("relative w-full", className)} data-required={required ? "true" : undefined}>
      <div className="relative">
        <Search className={cn("pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400", !open && "hidden")} />
        <input
          ref={inputRef}
          id={controlId}
          type="text"
          role="combobox"
          readOnly={!open}
          value={open ? query : selectedLabel}
          onClick={() => {
            if (!open) {
              openCombobox()
            }
          }}
          onFocus={() => {
            if (!open) {
              openCombobox()
            }
          }}
          onChange={(event) => {
            if (open) {
              setQuery(event.target.value)
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault()
              closeCombobox()
              return
            }

            if (!open && (event.key === "Enter" || event.key === " " || event.key === "ArrowDown")) {
              event.preventDefault()
              openCombobox()
              return
            }

            if (open && event.key === "Enter") {
              event.preventDefault()

              if (filteredOptions.length === 1) {
                selectOption(filteredOptions[0].value)
              }
            }
          }}
          onBlur={(event) => {
            const nextFocus = event.relatedTarget

            if (!nextFocus || !rootRef.current?.contains(nextFocus as Node)) {
              closeCombobox()
            }
          }}
          placeholder={open ? searchPlaceholder ?? `${placeholder} 검색` : placeholder}
          autoComplete="off"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete={open ? "list" : "none"}
          aria-readonly={!open}
          className={cn(controlClassName, open ? "pr-10 pl-11" : "pr-10")}
        />
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400",
            open && "hidden",
          )}
        />
      </div>

      {open ? (
        <div
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.12)]"
        >
          <div className="max-h-60 overflow-auto py-2">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const selected = option.value === value

                return (
                  <button
                    key={`${option.value || "empty"}-${option.label}`}
                    type="button"
                    role="option"
                    tabIndex={-1}
                    aria-selected={selected}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectOption(option.value)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition",
                      selected ? "bg-slate-900/5 text-slate-950" : "text-slate-700 hover:bg-slate-50 hover:text-slate-950",
                    )}
                  >
                    <span className="truncate">{option.label}</span>
                    {selected ? <Check className="h-4 w-4 shrink-0 text-slate-900" /> : null}
                  </button>
                )
              })
            ) : (
              <div className="px-4 py-3 text-sm text-slate-500">검색 결과가 없습니다.</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
