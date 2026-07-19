import { Header } from "./Header"
import { Footer } from "./Footer"

interface ShopLayoutProps {
  children: React.ReactNode
  categories?: Array<{ name: string; slug: string }>
}

export function ShopLayout({ children, categories = [] }: ShopLayoutProps) {
  return (
    <>
      <Header categories={categories} />
      <main className="flex-1">{children}</main>
      <Footer categories={categories} />
    </>
  )
}
