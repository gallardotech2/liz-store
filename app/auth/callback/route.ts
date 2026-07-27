import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  if (code) {
    const supabase = await createClient()

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const meta = user.user_metadata || {}

        const nombre: string = meta.full_name || meta.name || ""
        const avatar: string | null = meta.avatar_url || null

        if (nombre || avatar) {
          await supabase
            .from("profiles")
            .update({ nombre, avatar } as never)
            .eq("id", user.id)
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single()

        const role = (profile as unknown as { role?: string })?.role
        const redirectTo = role === "admin" ? "/admin" : next

        return NextResponse.redirect(`${origin}${redirectTo}`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=Error+de+autenticación+con+Google`)
}
