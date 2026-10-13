"use server"

import { revalidatePath, updateTag } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/supabase/admin-auth"
import { updateSocialLink } from "@/lib/queries/social-links"

export async function saveSocialLink(id: number, url: string) {
  await requireAdmin()
  const supabase = await createClient()
  const { error } = await updateSocialLink(supabase, id, { url })
  if (error) throw new Error(error.message)
  updateTag("social-links")
  revalidatePath("/", "layout")
}
