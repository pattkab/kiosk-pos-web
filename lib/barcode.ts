export function normalizeScannedCode(value: string) {
  return value.trim().replace(/[\r\n\t]+$/g, "");
}

export function isLikelyScannerBurst({
  code,
  firstKeyAt,
  lastKeyAt,
  submittedAt,
}: {
  code: string;
  firstKeyAt: number;
  lastKeyAt: number;
  submittedAt: number;
}) {
  const normalized = normalizeScannedCode(code);
  if (normalized.length < 4) return false;

  const duration = Math.max(1, lastKeyAt - firstKeyAt);
  const averageDelay = duration / normalized.length;
  const submitDelay = submittedAt - lastKeyAt;

  return averageDelay <= 55 && submitDelay <= 180;
}
