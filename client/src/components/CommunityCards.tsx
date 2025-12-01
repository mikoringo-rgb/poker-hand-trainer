import type { Card } from '@shared/schema';
import PlayingCard from './PlayingCard';

interface CommunityCardsProps {
  cards: Card[];
  usedCards?: Card[];
  lowUsedCards?: Card[];
  showResult?: boolean;
  isHiLo?: boolean;
}

export default function CommunityCards({ cards, usedCards = [], lowUsedCards = [], showResult = false, isHiLo = false }: CommunityCardsProps) {
  const isCardUsedHigh = (card: Card) => {
    if (!showResult || usedCards.length === 0) return false;
    return usedCards.some(uc => uc.suit === card.suit && uc.rank === card.rank);
  };
  
  const isCardUsedLow = (card: Card) => {
    if (!showResult || lowUsedCards.length === 0) return false;
    return lowUsedCards.some(uc => uc.suit === card.suit && uc.rank === card.rank);
  };
  
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10">
      {showResult && isHiLo ? (
        <div className="flex flex-col gap-2">
          {/* High 牌 */}
          <div className="flex flex-col gap-1">
            <div className="text-[10px] font-light text-yellow-400 text-center tracking-wider">HIGH</div>
            <div className="flex gap-1 justify-center">
              {cards.map((card, idx) => {
                const usedHigh = isCardUsedHigh(card);
                return (
                  <PlayingCard
                    key={`high-${idx}`}
                    card={card}
                    highlighted={usedHigh}
                    dimmed={!usedHigh}
                    size="sm"
                  />
                );
              })}
            </div>
          </div>
          
          {/* Low 牌 - 只在有 Low 赢家时显示 */}
          {lowUsedCards.length > 0 && (
            <div className="flex flex-col gap-1">
              <div className="text-[10px] font-light text-blue-400 text-center tracking-wider">LOW</div>
              <div className="flex gap-1 justify-center">
                {cards.map((card, idx) => {
                  const usedLow = isCardUsedLow(card);
                  return (
                    <PlayingCard
                      key={`low-${idx}`}
                      card={card}
                      highlightedLow={usedLow}
                      dimmed={!usedLow}
                      size="sm"
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex gap-2 justify-center">
          {cards.map((card, idx) => {
            const usedHigh = isCardUsedHigh(card);
            const usedLow = isCardUsedLow(card);
            
            return (
              <PlayingCard
                key={idx}
                card={card}
                dimmed={showResult && !usedHigh && !usedLow}
                highlighted={showResult && usedHigh}
                highlightedLow={showResult && usedLow}
                size="sm"
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
