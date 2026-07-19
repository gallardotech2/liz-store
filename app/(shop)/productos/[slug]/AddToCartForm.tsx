"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { formatCurrency } from "@/lib/utils"

interface AddToCartFormProps {
  productId: number
  productName: string
  productSlug: string
  price: number
  stock: number
  addToCartAction: (formData: FormData) => Promise<void>
}

export function AddToCartForm({
  productId,
  productName,
  productSlug,
  price,
  stock,
  addToCartAction,
}: AddToCartFormProps) {
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (action: "cart" | "buy") => {
    setLoading(true)
    const formData = new FormData()
    formData.set("productId", String(productId))
    formData.set("quantity", String(quantity))
    await addToCartAction(formData)
    if (action === "buy") {
      router.push("/checkout")
    } else {
      router.refresh()
    }
    setLoading(false)
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
        <Button
          variant="buy"
          disabled={loading}
          onClick={() => handleSubmit("buy")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          {loading ? "Procesando..." : "Comprar ahora"}
        </Button>
        <Button
          variant="primary"
          disabled={loading}
          onClick={() => handleSubmit("cart")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          {loading ? "Agregando..." : "Agregar al carrito"}
        </Button>
      </div>
    </>
  )
}
