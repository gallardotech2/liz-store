import { cookies } from "next/headers"
import { BottomNav } from "./BottomNav"
import { parseCart, calculateCartTotal, CART_COOKIE } from "@/lib/cart"

export async function BasicLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const cartCount = calculateCartTotal(
    parseCart(cookieStore.get(CART_COOKIE)?.value),
  ).itemCount

  return (
    <>
      <main className="flex-1">{children}</main>
      <div className="md:hidden h-[calc(4rem+env(safe-area-inset-bottom))]" aria-hidden="true" />
      <BottomNav cartCount={cartCount} />
    </>
  )
}