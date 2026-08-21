"use client"

import { useState, useMemo, useTransition } from "react"
import { useRouter } from "next/navigation"
import { removeFromCartAction } from "@/app/(shop)/carrito/actions"

interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string
  slug: string
  stock?: number
}

interface OrderSummaryProps {
  items: OrderItem[]
}

export function OrderSummary({ items: initialItems }: OrderSummaryProps) {
  const router = useRouter()
  const [items, setItems] = useState(initialItems)
  const [, startTransition] = useTransition()

  const subtotal = useMemo(() =>
    items.reduce((s, i) => s + i.price * i.quantity, 0),
  [items])

  function handleRemove(productId: string) {
    const formData = new FormData()
    formData.append("productId", productId)

    startTransition(async () => {
      await removeFromCartAction(formData)

      const updatedItems = items.filter((i) => i.id !== productId)
      if (updatedItems.length === 0) {
        router.push("/carrito")
        return
      }

      setItems(updatedItems)
      router.refresh()
    })
  }

  return (
    <div className="bg-white rounded-[16px] p-7.5 shadow-[0_1px_3px_rgba(0,0,0,0.08)] sticky top-[100px]">
      <h3 className="text-xl mb-6 pb-4 border-b border-[#EEE] font-serif text-[#2D2D2D]">
        Resumen del pedido
      </h3>
      {items.map((item) => {
        const total = item.price * item.quantity
        return (
          <div
            key={item.id}
            className="flex gap-3 mb-4 pb-4 border-b border-[#F5F5F5]"
          >
            <div className="w-[60px] h-[60px] rounded-[8px] overflow-hidden flex-shrink-0 bg-[#FFFBF9]">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[rgb(251,132,150)] text-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-[#2D2D2D] truncate">{item.name}</div>
              <div className="text-[12px] text-[#6B6B6B]">x{item.quantity}</div>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <div className="text-sm font-semibold text-primary">
                Bs. {total.toFixed(2)}
              </div>
              <button
                onClick={() => handleRemove(item.id)}
                className="flex items-center gap-1 text-[11px] text-[#E74C3C] bg-transparent border-none cursor-pointer hover:text-[#C0392B] transition-colors p-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Eliminar
              </button>
            </div>
          </div>
        )
      })}
      <div className="flex justify-between mb-2 text-[14px]">
        <span className="text-[#6B6B6B]">Subtotal</span>
        <span>Bs. {subtotal.toFixed(2)}</span>
      </div>
      <div className="flex justify-between text-[20px] font-bold text-primary border-t border-[#EEE] pt-4 mt-4 font-serif">
        <span>Total</span>
        <span id="sidebarTotal">Bs. {subtotal.toFixed(2)}</span>
      </div>
    </div>
  )
}
