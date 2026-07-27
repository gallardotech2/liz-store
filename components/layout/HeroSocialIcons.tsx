"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { getSocialLinks } from "@/lib/queries/social-links"
import type { SocialLink } from "@/lib/queries/social-links"
import { FaWhatsapp, FaTiktok, FaInstagram, FaFacebook } from "react-icons/fa"

const HERO_ICONS: Record<string, { icon: React.ReactNode; style?: React.CSSProperties; className?: string }> = {
  whatsapp: {
    icon: <FaWhatsapp className="text-[18px] flex-shrink-0" />,
    style: { background: "#25D366" },
  },
  tiktok: {
    icon: <FaTiktok className="text-[18px] flex-shrink-0" />,
    style: { background: "#000000" },
  },
  instagram: {
    icon: <FaInstagram className="text-[18px] flex-shrink-0" />,
    style: {
      background:
        "radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)",
    },
  },
  facebook: {
    icon: <FaFacebook className="text-[18px] flex-shrink-0" />,
    style: { background: "#1877F2" },
  },
}

export function HeroSocialIcons() {
  const [links, setLinks] = useState<SocialLink[]>([])

  useEffect(() => {
    const supabase = createClient()
    getSocialLinks(supabase).then(setLinks)
  }, [])

  return links.map((link) => {
    const config = HERO_ICONS[link.platform]
    return (
      <a
        key={link.platform}
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center w-8 h-8 rounded-full text-white no-underline transition-transform duration-300 hover:scale-110"
        style={config?.style}
        aria-label={link.label}
      >
        {config?.icon}
      </a>
    )
  })
}
