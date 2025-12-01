import type { Card } from '@shared/schema';
import PlayingCard from './PlayingCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PlayerHandProps {
  playerId: number;
  cards: Card[];
  onSelectWinner?: () => void;
  isSelected?: boolean;
  onSelectHighWinner?: () => void;
  onSelectLowWinner?: () => void;
  isHighSelected?: boolean;
  isLowSelected?: boolean;
  usedCards?: Card[];
  lowUsedCards?: Card[];
  showResult?: boolean;
  isWinner?: boolean;
  isLowWinner?: boolean;
  handName?: string;
  disabled?: boolean;
  isHiLo?: boolean;
}

export default function PlayerHand({
  playerId,
  cards,
  onSelectWinner,
  isSelected = false,
  onSelectHighWinner,
  onSelectLowWinner,
  isHighSelected = false,
  isLowSelected = false,
  usedCards = [],
  lowUsedCards = [],
  showResult = false,
  isWinner = false,
  isLowWinner = false,
  handName,
  disabled = false,
  isHiLo = false
}: PlayerHandProps) {
  const isCardUsedHigh = (card: Card) => {
    if (!showResult || usedCards.length === 0) return false;
    return usedCards.some(uc => uc.suit === card.suit && uc.rank === card.rank);
  };
  
  const isCardUsedLow = (card: Card) => {
    if (!showResult || !lowUsedCards || lowUsedCards.length === 0) return false;
    return lowUsedCards.some(uc => uc.suit === card.suit && uc.rank === card.rank);
  };
  
  const CardContainer = !isHiLo && onSelectWinner ? 'button' : 'div';
  
  return (
    <div className="flex flex-col items-center gap-3">
      <CardContainer
        {...(!isHiLo && onSelectWinner ? {
          onClick: onSelectWinner,
          disabled: disabled,
          'data-testid': `button-select-winner-${playerId}`
        } : {})}
        className={cn(
          "bg-white/5 backdrop-blur-sm rounded-lg p-3 transition-all border border-white/10",
          !isHiLo && onSelectWinner && !disabled && "cursor-pointer hover:bg-white/10 active:scale-95",
          !isHiLo && isSelected && "ring-1 ring-yellow-400/60 bg-yellow-500/10"
        )}
      >
        <div className="text-xs font-light text-white/70 mb-2 text-center flex items-center justify-center gap-2" data-testid={`text-player-${playerId}`}>
          <span>P{playerId}</span>
          {showResult && isHiLo && isWinner && <span className="text-[10px] text-yellow-400">Hi</span>}
          {showResult && isHiLo && isLowWinner && <span className="text-[10px] text-blue-400">Lo</span>}
        </div>
        
        {showResult && isHiLo ? (
          <div className="flex gap-1 justify-center">
            {cards.map((card, idx) => {
              const usedHigh = isCardUsedHigh(card);
              const usedLow = isCardUsedLow(card);
              const shouldHighlight = isWinner && usedHigh;
              const shouldHighlightLow = isLowWinner && usedLow;
              const shouldDim = !shouldHighlight && !shouldHighlightLow;
              
              return (
                <PlayingCard
                  key={idx}
                  card={card}
                  highlighted={shouldHighlight}
                  highlightedLow={shouldHighlightLow}
                  dimmed={shouldDim}
                  size="xs"
                />
              );
            })}
          </div>
        ) : (
          <div className={cn("flex", cards.length > 2 ? "gap-1" : "gap-2")}>
            {cards.map((card, idx) => {
              const usedHigh = isCardUsedHigh(card);
              const usedLow = isCardUsedLow(card);
              const shouldHighlight = showResult && isWinner && usedHigh;
              const shouldHighlightLow = showResult && isLowWinner && usedLow;
              const shouldDim = showResult && (!shouldHighlight && !shouldHighlightLow);
              
              return (
                <PlayingCard
                  key={idx}
                  card={card}
                  dimmed={shouldDim}
                  highlighted={shouldHighlight}
                  highlightedLow={shouldHighlightLow}
                  size={cards.length > 2 ? "xs" : "sm"}
                />
              );
            })}
          </div>
        )}
        
        {showResult && handName && !isHiLo && (
          <div className={cn(
            "mt-2 text-xs font-light text-center",
            isWinner ? "text-yellow-400" : "text-white/50"
          )} data-testid={`text-handname-${playerId}`}>
            {handName}
          </div>
        )}
      </CardContainer>
      {isHiLo && (
        <div className="flex gap-2">
          {onSelectHighWinner && (
            <Button
              data-testid={`button-select-high-${playerId}`}
              onClick={onSelectHighWinner}
              disabled={disabled}
              variant={isHighSelected ? "default" : "secondary"}
              className={cn(
                "w-16 text-xs",
                isHighSelected && "bg-yellow-500 hover:bg-yellow-600 text-black"
              )}
            >
              {isHighSelected ? '✓' : 'High'}
            </Button>
          )}
          {onSelectLowWinner && (
            <Button
              data-testid={`button-select-low-${playerId}`}
              onClick={onSelectLowWinner}
              disabled={disabled}
              variant={isLowSelected ? "default" : "secondary"}
              className={cn(
                "w-16 text-xs",
                isLowSelected && "bg-blue-500 hover:bg-blue-600 text-black"
              )}
            >
              {isLowSelected ? '✓' : 'Low'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
