import { DelayedLoader } from "@/components/ui/DelayedLoader"

export default function AdminLoading() {
  return (
    <DelayedLoader
      variant="overlay"
      label="Cargando panel"
      labelClassName="text-[13px] font-medium text-[#9CA3B8]"
    />
  )
}