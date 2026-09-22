import { ImageResponse } from "next/og"

export const alt = "Liz Store — Bisutería y Accesorios Elegantes"
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = "image/png"

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          background: "linear-gradient(135deg, #FDF8F6 0%, #FFE4E9 55%, #FB8496 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-180px",
            right: "-140px",
            width: 460,
            height: 460,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.35)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-200px",
            left: "-160px",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "rgba(201,169,110,0.25)",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 110,
            height: 110,
            borderRadius: "50%",
            background: "rgba(183,110,121,0.12)",
            marginBottom: 32,
          }}
        >
          <span style={{ fontSize: 56, color: "#B76E79" }}>✦</span>
        </div>
        <div
          style={{
            fontSize: 128,
            fontWeight: 700,
            letterSpacing: 3,
            color: "#B76E79",
            textShadow: "0 3px 0 rgba(255,255,255,0.6)",
          }}
        >
          Liz Store
        </div>
        <div
          style={{
            width: 240,
            height: 5,
            borderRadius: 3,
            background: "#C9A96E",
            marginTop: 20,
            marginBottom: 20,
          }}
        />
        <div
          style={{
            fontSize: 44,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "#4A4A4A",
          }}
        >
          Bisutería &amp; Accesorios
        </div>
        <div
          style={{
            fontSize: 28,
            letterSpacing: 3,
            color: "#B76E79",
            marginTop: 28,
          }}
        >
          lizstore.site
        </div>
      </div>
    ),
    { ...size }
  )
}