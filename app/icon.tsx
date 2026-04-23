import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1A1814",
        }}
      >
        {/* Doorway: two posts + lintel, open at the bottom */}
        <svg width="22" height="30" viewBox="0 0 36 50">
          <rect x="0" y="4" width="36" height="6" fill="#C8A96E" />
          <rect x="0" y="4" width="6" height="46" fill="#C8A96E" />
          <rect x="30" y="4" width="6" height="46" fill="#C8A96E" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
