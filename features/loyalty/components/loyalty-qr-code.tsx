"use client";

import { useEffect, useRef } from "react";

export function LoyaltyQrCode({
  value,
  size = 180,
}: {
  value: string;
  size?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const QRCode = await import("qrcode");
      if (cancelled || !canvasRef.current) return;
      await QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 1,
        color: {
          dark: "#0a0c12",
          light: "#ffffff",
        },
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [size, value]);

  return (
    <canvas
      ref={canvasRef}
      className="rounded-lg border bg-white p-2"
      aria-label={`QR code for loyalty card ${value}`}
    />
  );
}
