import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Korea Score Predictor",
  description: "대한민국 경기 스코어 예측 QR 이벤트",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
