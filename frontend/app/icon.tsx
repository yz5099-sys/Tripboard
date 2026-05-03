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
          background: "linear-gradient(135deg, #d8aaa5 0%, #f3e5bc 58%, #8f948b 100%)",
          fontSize: 220,
          fontWeight: 700,
          color: "#343331",
          borderRadius: 120
        }}
      >
        T
      </div>
    ),
    size
  );
}
