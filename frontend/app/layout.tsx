import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpineCare AI｜脊椎肿瘤复查助手",
  description: "帮助脊椎肿瘤患者完成复查提醒、报告解析、症状问诊与风险提示的 PWA 医疗网页应用。",
  applicationName: "SpineCare AI",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SpineCare AI"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
