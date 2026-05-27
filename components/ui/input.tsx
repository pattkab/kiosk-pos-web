import * as React from "react"
import { Eye, EyeOff, X } from "lucide-react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  clearable?: boolean
  showPasswordToggle?: boolean
}

function setNativeInputValue(input: HTMLInputElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(input, "value")?.set
  const prototype = Object.getPrototypeOf(input)
  const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, "value")?.set

  if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
    prototypeValueSetter.call(input, value)
  } else {
    valueSetter?.call(input, value)
  }
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      clearable,
      showPasswordToggle,
      disabled,
      readOnly,
      value,
      defaultValue,
      onChange,
      ...props
    },
    ref
  ) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    const [inputValue, setInputValue] = React.useState(() =>
      typeof value === "string" || typeof value === "number"
        ? String(value)
        : typeof defaultValue === "string" || typeof defaultValue === "number"
          ? String(defaultValue)
          : ""
    )
    const [passwordVisible, setPasswordVisible] = React.useState(false)
    const isPassword = type === "password"
    const inputType = isPassword && passwordVisible ? "text" : type
    const canUseActions =
      !disabled &&
      !readOnly &&
      !["button", "checkbox", "color", "file", "hidden", "image", "radio", "range", "reset", "submit"].includes(type)
    const shouldShowPasswordToggle = canUseActions && isPassword && showPasswordToggle !== false
    const shouldShowClear =
      canUseActions &&
      (clearable ?? true) &&
      inputValue.length > 0 &&
      type !== "password"
    const rightPadding = shouldShowPasswordToggle ? "pr-16" : shouldShowClear ? "pr-9" : undefined

    React.useEffect(() => {
      if (typeof value === "string" || typeof value === "number") {
        setInputValue(String(value))
      } else if (value == null) {
        setInputValue("")
      }
    }, [value])

    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(event.target.value)
      onChange?.(event)
    }

    const clearInput = () => {
      const input = inputRef.current
      if (!input) return

      setNativeInputValue(input, "")
      setInputValue("")
      input.dispatchEvent(new Event("input", { bubbles: true }))
      input.focus()
    }

    return (
      <div className="relative w-full">
        <input
          type={inputType}
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
            rightPadding,
            className
          )}
          ref={inputRef}
          disabled={disabled}
          readOnly={readOnly}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          {...props}
        />
        {shouldShowClear ? (
          <button
            type="button"
            aria-label="Clear field"
            className="absolute right-1.5 top-1/2 inline-flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            onClick={clearInput}
            tabIndex={-1}
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        ) : null}
        {shouldShowPasswordToggle ? (
          <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
            {inputValue.length > 0 ? (
              <button
                type="button"
                aria-label="Clear password"
                className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                onClick={clearInput}
                tabIndex={-1}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            ) : null}
            <button
              type="button"
              aria-label={passwordVisible ? "Hide password" : "Show password"}
              aria-pressed={passwordVisible}
              className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              onClick={() => {
                setPasswordVisible((current) => !current)
                inputRef.current?.focus()
              }}
              tabIndex={-1}
            >
              {passwordVisible ? (
                <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </button>
          </div>
        ) : null}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
