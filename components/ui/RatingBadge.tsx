import { Star } from "lucide-react";
import { formatRating } from "@/lib/utils";

type RatingBadgeProps = {
  rating: number;
  size?: "sm" | "md";
};

export function RatingBadge({ rating, size = "md" }: RatingBadgeProps) {
  if (!rating) return null;
  const isSmall = size === "sm";

  return (
    <span className={`flex items-center gap-0.5 font-semibold text-amber-400 ${isSmall ? "text-xs" : "text-sm"}`}>
      <Star className={isSmall ? "h-3 w-3" : "h-4 w-4"} fill="currentColor" />
      {formatRating(rating)}
    </span>
  );
}
