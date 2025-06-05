import * as React from "react"
import { cn } from "@/lib/utils"

interface PopoverProps {
  children: React.ReactNode
  className?: string
}

const PopoverContext = React.createContext<{
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}>({
  open: false,
  setOpen: () => {},
})

export function Popover({ children, className }: PopoverProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <div className={cn("relative inline-block", className)}>
        {children}
      </div>
    </PopoverContext.Provider>
  )
}

interface PopoverTriggerProps {
  children: React.ReactNode
}

export function PopoverTrigger({ children }: PopoverTriggerProps) {
  const { open, setOpen } = React.useContext(PopoverContext)

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setOpen(!open)
  }

  return (
    <div 
      onClick={handleClick}
      className="cursor-pointer"
    >
      {children}
    </div>
  )
}

interface PopoverContentProps {
  children: React.ReactNode
  className?: string
}

export function PopoverContent({ children, className }: PopoverContentProps) {
  const { open, setOpen } = React.useContext(PopoverContext)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [setOpen])

  if (!open) {
    return null
  }

  return (
    <div 
      ref={ref}
      className={cn(
        "absolute z-50 top-full left-0 mt-2 min-w-[8rem] rounded-md border bg-popover p-4 text-popover-foreground shadow-md",
        className
      )}
    >
      {children}
    </div>
  )
} 