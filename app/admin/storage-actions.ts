"use server"

import { requireAdmin } from "@/lib/supabase/admin-auth"
import { createUploadTicket, type UploadTicket } from "@/lib/supabase/storage"

export async function requestImageUploadTicket(
  folder: "products" | "categories",
  ext: string,
): Promise<UploadTicket> {
  await requireAdmin()
  return createUploadTicket(folder, ext)
}
