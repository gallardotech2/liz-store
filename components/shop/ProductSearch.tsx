"use client"

import { useId } from "react"

interface ProductSearchFieldsProps {
  defaultValue?: string
  inputClassName?: string
  id?: string
}

export function ProductSearchFields({
  defaultValue = "",
  inputClassName = "",
  id,
}: ProductSearchFieldsProps) {
  const autoId = useId()
  const inputId = id ?? autoId

  return (
    <div className={`relative flex items-center ${inputClassName}`}>
      <label htmlFor={inputId} className="sr-only">
        Buscar productos
      </label>
      <button
        type="submit"
        aria-label="Buscar"
        className="absolute left-1.5 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full text-primary transition-colors duration-200 hover:bg-primary/10 active:scale-95 cursor-pointer border-none bg-transparent"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
      </button>
      <input
        type="search"
        id={inputId}
        name="q"
        defaultValue={defaultValue}
        placeholder="Buscar..."
        autoComplete="off"
        className="w-full rounded-full border border-[#DDD] dark:border-line bg-white dark:bg-surface py-2.5 pl-11 pr-4 text-[14px] font-sans text-[#2D2D2D] dark:text-ink-strong placeholder:text-[#9E9E9E] dark:placeholder:text-ink-soft focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden"
      />
    </div>
  )
}

interface ProductSearchProps {
  defaultValue?: string
  className?: string
}

export function ProductSearch({ defaultValue = "", className = "" }: ProductSearchProps) {
  return (
    <form
      action="/productos"
      method="GET"
      role="search"
      className={`flex items-center ${className}`}
      onSubmit={(e) => {
        const q = (new FormData(e.currentTarget).get("q") as string | null)?.trim()
        if (!q) e.preventDefault()
      }}
    >
      <ProductSearchFields defaultValue={defaultValue} inputClassName="flex-1" />
    </form>
  )
}
