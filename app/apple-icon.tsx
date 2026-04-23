import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
        <svg width="100" height="140" viewBox="0 0 36 50">
          <rect x="0" y="4" width="36" height="6" fill="#C8A96E" />
          <rect x="0" y="4" width="6" height="46" fill="#C8A96E" />
          <rect x="30" y="4" width="6" height="46" fill="#C8A96E" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
