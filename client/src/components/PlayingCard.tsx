import type { Card } from '@shared/schema';
import { cn } from '@/lib/utils';

interface PlayingCardProps {
  card: Card;
  dimmed?: boolean;
  highlighted?: boolean;
  highlightedLow?: boolean;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export default function PlayingCard({ card, dimmed = false, highlighted = false, highlightedLow = false, className, size = 'md' }: PlayingCardProps) {
  const isRed = card.suit === '♥' || card.suit === '♦';
  
  const sizeClasses = {
    xs: 'w-7 h-7 p-0.5',
    sm: 'w-9 h-9 p-1',
    md: 'w-16 h-24 sm:w-20 sm:h-28 p-2',
    lg: 'w-20 h-28 sm:w-24 sm:h-32 p-2.5'
  };
  
  const textSizes = {
    xs: { rank: 'text-sm', suit: 'text-base' },
    sm: { rank: 'text-base', suit: 'text-lg' },
    md: { rank: 'text-2xl sm:text-3xl', suit: 'text-3xl sm:text-4xl' },
    lg: { rank: 'text-3xl sm:text-4xl', suit: 'text-4xl sm:text-5xl' }
  };
  
  return (
    <div
      data-testid={`card-${card.rank}-${card.suit}`}
      className={cn(
        "relative rounded-md shadow-md transition-all duration-300 border border-gray-200",
        "flex items-center justify-center gap-1",
        sizeClasses[size],
        dimmed && "opacity-30 grayscale",
        highlighted && !highlightedLow && "bg-yellow-50 ring-2 ring-yellow-400 border-yellow-400",
        !highlighted && highlightedLow && "bg-gray-50 ring-2 ring-blue-400 border-blue-400",
        highlighted && highlightedLow && "bg-yellow-50 ring-2 ring-blue-400 border-yellow-400",
        !highlighted && !highlightedLow && !dimmed && "bg-gray-50 hover:translate-y-[-2px] hover:shadow-lg",
        !highlighted && !highlightedLow && dimmed && "bg-gray-100 border-gray-300",
        className
      )}
    >
      <div className={cn(
        "flex flex-col items-center justify-center gap-0",
        textSizes[size].rank,
        "font-semibold font-sans leading-none",
        isRed ? "text-red-500" : "text-gray-900"
      )}>
        <div className="leading-none">{card.rank}</div>
        <div className={cn(textSizes[size].suit, "leading-none -mt-0.5")}>{card.suit}</div>
      </div>
    </div>
  );
}
