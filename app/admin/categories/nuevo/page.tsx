import { CategoryForm } from "@/components/admin/CategoryForm"
import { createCategory } from "../actions"

export default function NewCategoryPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white m-0">Nueva categoría</h1>
        <p className="text-sm text-[#9CA3B8] m-0 mt-1">Completa los campos para agregar una categoría</p>
      </div>
      <div className="bg-secondary-light border border-white/12 rounded-[16px] p-6">
        <CategoryForm action={createCategory} />
      </div>
    </div>
  )
}
