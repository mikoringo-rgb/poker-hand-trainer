// client/src/components/PlayingCard.tsx

import type { Card } from '@shared/schema';
import { cn } from '@/lib/utils';

interface PlayingCardProps {
  card: Card;
  dimmed?: boolean;
  highlighted?: boolean;
  highlightedLow?: boolean;
  selectedHigh?: boolean;
  selectedLow?: boolean;
  clickable?: boolean;
  onClick?: () => void;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'compact' | 'board';
}

export default function PlayingCard({
  card,
  dimmed = false,
  highlighted = false,
  highlightedLow = false,
  selectedHigh = false,
  selectedLow = false,
  clickable = false,
  onClick,
  className,
  size = 'md',
}: PlayingCardProps) {
  const isRed =
    card.suit === '♥' ||
    card.suit === '♦';

  const sizeClasses = {
    xs: 'w-7 h-7 p-0.5',
    sm: 'w-9 h-9 p-1',

    compact:
      'w-[clamp(42px,11vw,56px)] h-[clamp(48px,7.2svh,62px)] p-1',

    board:
      'w-[clamp(46px,12vw,62px)] h-[clamp(54px,8svh,72px)] p-1',

    md: 'w-16 h-24 sm:w-20 sm:h-28 p-2',
    lg: 'w-20 h-28 sm:w-24 sm:h-32 p-2.5',
  };

  const textSizes = {
    xs: {
      rank: 'text-sm',
      suit: 'text-base',
    },

    sm: {
      rank: 'text-base',
      suit: 'text-lg',
    },

    compact: {
      rank: 'text-[clamp(16px,4.6vw,22px)]',
      suit: 'text-[clamp(18px,5vw,24px)]',
    },

    board: {
      rank: 'text-[clamp(21px,5.8vw,28px)]',
      suit: 'text-[clamp(24px,6.4vw,31px)]',
    },

    md: {
      rank: 'text-2xl sm:text-3xl',
      suit: 'text-3xl sm:text-4xl',
    },

    lg: {
      rank: 'text-3xl sm:text-4xl',
      suit: 'text-4xl sm:text-5xl',
    },
  };

  const content = (
    <>
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-0',
          textSizes[size].rank,
          'font-semibold font-sans leading-none',
          isRed
            ? 'text-red-500'
            : 'text-gray-900',
        )}
      >
        <div className="leading-none">
          {card.rank}
        </div>

        <div
          className={cn(
            textSizes[size].suit,
            'leading-none -mt-0.5',
          )}
        >
          {card.suit}
        </div>
      </div>

      {selectedHigh &&
        selectedLow && (
          <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
            <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
          </div>
        )}
    </>
  );

  const classes = cn(
    'relative rounded-md shadow-md transition-all border border-gray-200',
    'flex items-center justify-center gap-1 select-none',

    sizeClasses[size],

    clickable &&
      'cursor-pointer active:scale-95',

    dimmed &&
      'opacity-30 grayscale',

    highlighted &&
      !highlightedLow &&
      'bg-yellow-50 ring-2 ring-yellow-400 border-yellow-400',

    !highlighted &&
      highlightedLow &&
      'bg-gray-50 ring-2 ring-blue-400 border-blue-400',

    highlighted &&
      highlightedLow &&
      'bg-yellow-50 ring-2 ring-blue-400 border-yellow-400',

    selectedHigh &&
      !selectedLow &&
      'ring-2 ring-yellow-400 border-yellow-400 bg-yellow-50',

    selectedLow &&
      !selectedHigh &&
      'ring-2 ring-blue-400 border-blue-400 bg-blue-50',

    selectedHigh &&
      selectedLow &&
      'ring-2 ring-purple-400 border-purple-400 bg-white',

    !highlighted &&
      !highlightedLow &&
      !selectedHigh &&
      !selectedLow &&
      !dimmed &&
      'bg-gray-50 hover:translate-y-[-1px] hover:shadow-lg',

    !highlighted &&
      !highlightedLow &&
      !selectedHigh &&
      !selectedLow &&
      dimmed &&
      'bg-gray-100 border-gray-300',

    className,
  );

  if (clickable) {
    return (
      <button
        type="button"
        onClick={onClick}
        data-testid={`card-${card.rank}-${card.suit}`}
        className={classes}
      >
        {content}
      </button>
    );
  }

  return (
    <div
      data-testid={`card-${card.rank}-${card.suit}`}
      className={classes}
    >
      {content}
    </div>
  );
}
