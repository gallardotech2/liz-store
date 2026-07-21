"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { addToCartAction } from "@/app/(shop)/carrito/actions"

interface AddToCartFormProps {
  productId: number
  productName: string
  productSlug: string
  price: number
  stock: number
}

export function AddToCartForm({
  productId,
  productName,
  productSlug,
  price,
  stock,
}: AddToCartFormProps) {
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  async function addAndGo(formData: FormData) {
    setError("")
    setLoading(true)
    try {
      formData.set("productId", String(productId))
      formData.set("quantity", String(quantity))
      await addToCartAction(formData)
      router.push("/checkout")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ocurrió un error. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  async function addAndStay(formData: FormData) {
    setError("")
    setLoading(true)
    try {
      formData.set("productId", String(productId))
      formData.set("quantity", String(quantity))
      await addToCartAction(formData)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ocurrió un error. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="product-quantity flex items-center gap-3 my-6">
        <span className="font-semibold text-sm">Cantidad:</span>
        <button
          type="button"
          className="w-10 h-10 rounded-full border border-[rgb(251,132,150)] bg-white cursor-pointer text-lg transition-all duration-300 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary disabled:opacity-40"
          onClick={() => setQuantity(Math.max(1, quantity - 1))}
          disabled={quantity <= 1}
        >
          −
        </button>
        <input
          type="number"
          value={quantity}
          min={1}
          max={stock}
          onChange={(e) =>
            setQuantity(
              Math.min(stock, Math.max(1, parseInt(e.target.value) || 1)),
            )
          }
          className="w-15 text-center border border-[#DDD] rounded-[8px] p-2.5 text-base font-semibold"
        />
        <button
          type="button"
          className="w-10 h-10 rounded-full border border-[rgb(251,132,150)] bg-white cursor-pointer text-lg transition-all duration-300 flex items-center justify-center hover:bg-primary hover:text-white hover:border-primary disabled:opacity-40"
          onClick={() => setQuantity(Math.min(stock, quantity + 1))}
          disabled={quantity >= stock}
        >
          +
        </button>
      </div>

      <div className="product-buttons flex gap-3 my-6 max-md:flex-col">
        <form action={addAndGo} className="contents">
          <Button variant="buy" type="submit" disabled={loading}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            {loading ? "Procesando..." : "Comprar ahora"}
          </Button>
        </form>

        <form action={addAndStay} className="contents">
          <Button variant="primary" type="submit" disabled={loading}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            {loading ? "Agregando..." : "Agregar al carrito"}
          </Button>
        </form>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-[rgba(231,76,60,0.08)] border border-[rgba(231,76,60,0.2)] text-[#E74C3C] text-[13px] mt-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {error}
        </div>
      )}
    </>
  )
}
