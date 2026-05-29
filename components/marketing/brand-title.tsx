import { cn } from "@/lib/utils";

type BrandTitleProps = {
  className?: string;
  posClassName?: string;
  as?: "span" | "h1";
};

/** "Kiosk" + accent-colored "POS" for marketing surfaces. */
export function BrandTitle({
  className,
  posClassName,
  as: Tag = "span",
}: BrandTitleProps) {
  return (
    <Tag className={className}>
      Kiosk{" "}
      <span
        className={cn(
          "bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-400 bg-clip-text text-transparent",
          posClassName,
        )}
      >
        POS
      </span>
    </Tag>
  );
}

export function PointOfSaleLabel({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "font-semibold tracking-wide text-emerald-300/95",
        className,
      )}
    >
      Point of Sale
    </span>
  );
}
