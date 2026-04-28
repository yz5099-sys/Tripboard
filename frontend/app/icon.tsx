import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512
};

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
          background: "linear-gradient(135deg, #f9dde2 0%, #dceeff 58%, #fff4cc 100%)",
          fontSize: 220,
          fontWeight: 700,
          color: "#1e293b",
          borderRadius: 120
        }}
      >
        S
      </div>
    ),
    size
  );
}
