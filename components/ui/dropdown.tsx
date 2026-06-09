import type { SelectHTMLAttributes, Ref } from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

type DropdownProps = SelectHTMLAttributes<HTMLSelectElement> & {
  wrapperClassName?: string
  ref?: Ref<HTMLSelectElement>
}

export function Dropdown({ className, wrapperClassName, children, ref, ...props }: DropdownProps) {
  return (
    <div className={cn("relative w-full", wrapperClassName)}>
      <select
        ref={ref}
        className={cn(
          "block w-full appearance-none rounded-2xl border border-slate-300 bg-white px-4 py-3 pr-10 text-slate-950 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-900/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
      />
    </div>
  )
}
