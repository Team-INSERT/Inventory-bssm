"use client"

import { SearchableCombobox } from "@/components/ui/searchable-combobox"
import type { SearchableComboboxProps } from "@/components/ui/searchable-combobox"

type StorageLocationComboboxProps = SearchableComboboxProps

export function StorageLocationCombobox({
  placeholder = "보관 위치 선택",
  searchPlaceholder,
  allowEmpty = false,
  emptyLabel = "전체",
  required = false,
  className,
  id,
  value,
  onChange,
  options,
}: StorageLocationComboboxProps) {
  return (
    <SearchableCombobox
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      allowEmpty={allowEmpty}
      emptyLabel={emptyLabel}
      required={required}
      className={className}
      id={id}
      idPrefix="storage-location"
    />
  )
}
