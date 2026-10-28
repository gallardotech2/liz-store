import { WhatsAppOrderButton } from "@/components/shop/WhatsAppOrderButton"

interface ProductCardActionProps {
  productId: number
  productName: string
  productImage: string
  productPrice: number
  whatsappNumber?: string
  unavailableLabel?: string | null
}

export function ProductCardAction({
  productId,
  productName,
  productImage,
  productPrice,
  whatsappNumber,
  unavailableLabel = null,
}: ProductCardActionProps) {
  if (unavailableLabel) {
    return (
      <span className="flex h-10 w-full items-center justify-center rounded-xl bg-[#F3F4F6] text-center text-[11px] font-semibold text-[#9CA3B8] dark:bg-surface dark:text-ink-soft">
        {unavailableLabel}
      </span>
    )
  }

  return (
    <WhatsAppOrderButton
      productId={productId}
      productName={productName}
      productImage={productImage}
      productPrice={productPrice}
      whatsappNumber={whatsappNumber}
      compact
      label="Pedir"
      className="h-10"
    />
  )
}
