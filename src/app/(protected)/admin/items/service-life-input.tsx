'use client'

import { useState } from 'react'
import { updateItem } from '@/features/inventory/api/item-actions'
import { Loader2 } from 'lucide-react'

export function ServiceLifeInput({ id, initialValue }: { id: string, initialValue: number }) {
  const [value, setValue] = useState(initialValue)
  const [loading, setLoading] = useState(false)

  const handleBlur = async () => {
    if (value === initialValue) return
    setLoading(true)
    await updateItem(id, { service_life: value })
    setLoading(false)
  }

  return (
    <div className="relative group flex items-center gap-2">
      <input 
        type="number"
        value={value}
        onChange={(e) => setValue(parseInt(e.target.value) || 0)}
        onBlur={handleBlur}
        className="w-16 bg-gray-50 dark:bg-zinc-800 border-0 rounded-lg p-2 text-xs font-bold text-center focus:ring-2 ring-blue-500/20"
      />
      {loading && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
      <span className="text-[10px] text-gray-400 font-bold">년</span>
    </div>
  )
}
