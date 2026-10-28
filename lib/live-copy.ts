export const PUBLIC_LIVE_TITLE = "En vivo"
export const PUBLIC_LIVE_BADGE_LABEL = "EN VIVO"

export function isDefaultLiveTitle(title?: string | null) {
  const cleanTitle = title?.trim().toLowerCase()

  return (
    !cleanTitle ||
    cleanTitle === "modo live" ||
    cleanTitle === PUBLIC_LIVE_TITLE.toLowerCase()
  )
}

export function getPublicLiveTitle(title?: string | null) {
  const cleanTitle = title?.trim()

  if (isDefaultLiveTitle(cleanTitle)) {
    return PUBLIC_LIVE_TITLE
  }

  return cleanTitle ?? PUBLIC_LIVE_TITLE
}
