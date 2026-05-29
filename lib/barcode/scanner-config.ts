import { Html5QrcodeSupportedFormats } from "html5-qrcode";

/** Common retail barcodes plus QR codes for product labels. */
export const RETAIL_BARCODE_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.QR_CODE,
];

export const BARCODE_SCANNER_CAMERA_CONFIG = {
  facingMode: "environment" as const,
};

export const BARCODE_SCANNER_VIEW_CONFIG = {
  fps: 12,
  qrbox: { width: 280, height: 180 },
  aspectRatio: 1.6,
  disableFlip: false,
};

export const BARCODE_SCANNER_ENGINE_CONFIG = {
  formatsToSupport: RETAIL_BARCODE_FORMATS,
  verbose: false,
};
