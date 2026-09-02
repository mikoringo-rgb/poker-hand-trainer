import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  Check,
  RotateCcw,
} from 'lucide-react';

import PlayerHand from './PlayerHand';
import CommunityCards from './CommunityCards';
import PlayingCard from './PlayingCard';
import Timer from './Timer';
import FeedbackBanner from './FeedbackBanner';

import {
  createDeck,
  evaluateHand,
  evaluateOmahaHand,
  determineWinners,
  evaluateLowHand,
  determineLowWinners,
  isValidBestHoleSelection,
} from '@/lib/poker-logic';

import type { Card } from '@shared/schema';

type GameMode = 'holdem' | 'omaha' | 'big-o';
type BigOSelectionMode = 'high' | 'low';

interface GameBoardProps {
  playerCount: number;
  gameMode: GameMode;
  onBack: () => void;
}

interface HighEvaluation {
  playerId: number;
  rank: number;
  name: string;
  usedCards: Card[];
  handScore?: number[];
  allBestHoleCardCombos?: Card[][];
}

interface LowEvaluation {
  playerId: number;
  hasLow: boolean;
  lowScore?: number[];
  usedCards?: Card[];
  allBestHoleCardCombos?: Card[][];
}

interface BigOResult {
  overallCorrect: boolean;

  highWinnerCorrect: boolean;
  highUsedCardsCorrect: boolean;

  lowWinnerCorrect: boolean;
  lowUsedCardsCorrect: boolean;

  actualHighWinners: number[];
  actualLowWinners: number[];
}

type CardSelections = Record<number, Card[]>;

function sameCard(a: Card, b: Card): boolean {
  return (
    a.rank === b.rank &&
    a.suit === b.suit
  );
}

function cardLabel(card: Card): string {
  return `${card.rank}${card.suit}`;
}

function pairLabel(cards: Card[]): string {
  return cards.map(cardLabel).join(' ');
}

function sameNumberSet(
  first: number[],
  second: number[],
): boolean {
  if (first.length !== second.length) {
    return false;
  }

  return first.every((value) =>
    second.includes(value),
  );
}

export default function GameBoard({
  playerCount,
  gameMode,
  onBack,
}: GameBoardProps) {
  const [playerHands, setPlayerHands] =
    useState<Card[][]>([]);

  const [communityCards, setCommunityCards] =
    useState<Card[]>([]);

  // Hold'em / Omaha
  const [selectedWinners, setSelectedWinners] =
    useState<number[]>([]);

  // Big O
  const [
    activeBigOMode,
    setActiveBigOMode,
  ] = useState<BigOSelectionMode>('high');

  const [
    selectedHighCards,
    setSelectedHighCards,
  ] = useState<CardSelections>({});

  const [
    selectedLowCards,
    setSelectedLowCards,
  ] = useState<CardSelections>({});

  /**
   * Empty Low selection must be distinguishable from
   * "I forgot to examine Low".
   *
   * Once LOW has been opened, zero selected cards means
   * the user's answer is "No qualifying Low".
   */
  const [lowTouched, setLowTouched] =
    useState(false);

  const [validationMessage, setValidationMessage] =
    useState('');

  const [showResult, setShowResult] =
    useState(false);

  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    message: string;
    time?: number;
  } | null>(null);

  const [bigOResult, setBigOResult] =
    useState<BigOResult | null>(null);

  const [timerRunning, setTimerRunning] =
    useState(false);

  const [currentTime, setCurrentTime] =
    useState(0);

  const [evaluations, setEvaluations] =
    useState<HighEvaluation[]>([]);

  const [lowEvaluations, setLowEvaluations] =
    useState<LowEvaluation[]>([]);

  const dealCards = () => {
    const deck = createDeck();

    const hands: Card[][] = [];

    let cardIndex = 0;

    const cardsPerPlayer =
      gameMode === 'big-o'
        ? 5
        : gameMode === 'omaha'
          ? 4
          : 2;

    for (
      let playerIndex = 0;
      playerIndex < playerCount;
      playerIndex++
    ) {
      const hand: Card[] = [];

      for (
        let cardNumber = 0;
        cardNumber < cardsPerPlayer;
        cardNumber++
      ) {
        hand.push(deck[cardIndex++]);
      }

      hands.push(hand);
    }

    const board = deck.slice(
      cardIndex,
      cardIndex + 5,
    );

    setPlayerHands(hands);
    setCommunityCards(board);

    setSelectedWinners([]);

    setSelectedHighCards({});
    setSelectedLowCards({});

    setActiveBigOMode('high');
    setLowTouched(false);

    setValidationMessage('');

    setShowResult(false);
    setFeedback(null);
    setBigOResult(null);

    setCurrentTime(0);
    setTimerRunning(true);

    const highEvals: HighEvaluation[] =
      hands.map((hand, index) => {
        const evaluation =
          gameMode === 'omaha' ||
          gameMode === 'big-o'
            ? evaluateOmahaHand(
                hand,
                board,
              )
            : evaluateHand(
                hand,
                board,
              );

        return {
          playerId: index + 1,
          rank: evaluation.rank,
          name: evaluation.name,
          usedCards:
            evaluation.usedCards,
          handScore:
            evaluation.handScore,
          allBestHoleCardCombos:
            evaluation
              .allBestHoleCardCombos,
        };
      });

    setEvaluations(highEvals);

    if (gameMode === 'big-o') {
      const lows: LowEvaluation[] =
        hands.map((hand, index) => {
          const lowEvaluation =
            evaluateLowHand(
              hand,
              board,
            );

          return {
            playerId: index + 1,
            ...lowEvaluation,
          };
        });

      setLowEvaluations(lows);
    } else {
      setLowEvaluations([]);
    }
  };

  useEffect(() => {
    dealCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerCount, gameMode]);

  // ───────────────────────────────────────────
  // Hold'em / Omaha
  // ───────────────────────────────────────────

  const handleSelectWinner = (
    playerId: number,
  ) => {
    if (
      showResult ||
      gameMode === 'big-o'
    ) {
      return;
    }

    setSelectedWinners((previous) => {
      if (
        previous.includes(playerId)
      ) {
        return previous.filter(
          (id) => id !== playerId,
        );
      }

      return [
        ...previous,
        playerId,
      ];
    });
  };

  // ───────────────────────────────────────────
  // Big O card selection
  // ───────────────────────────────────────────

  const getSelection = (
    mode: BigOSelectionMode,
    playerId: number,
  ): Card[] => {
    if (mode === 'high') {
      return (
        selectedHighCards[playerId] ||
        []
      );
    }

    return (
      selectedLowCards[playerId] ||
      []
    );
  };

  const updateSelection = (
    mode: BigOSelectionMode,
    playerId: number,
    card: Card,
  ) => {
    if (showResult) return;

    const setter =
      mode === 'high'
        ? setSelectedHighCards
        : setSelectedLowCards;

    setter((previous) => {
      const current =
        previous[playerId] || [];

      const alreadySelected =
        current.some((selectedCard) =>
          sameCard(
            selectedCard,
            card,
          ),
        );

      if (alreadySelected) {
        return {
          ...previous,
          [playerId]:
            current.filter(
              (selectedCard) =>
                !sameCard(
                  selectedCard,
                  card,
                ),
            ),
        };
      }

      /**
       * A Big O hand must use exactly
       * two Hole Cards.
       *
       * Do not allow a third card.
       */
      if (current.length >= 2) {
        return previous;
      }

      return {
        ...previous,
        [playerId]: [
          ...current,
          card,
        ],
      };
    });

    setValidationMessage('');
  };

  const handleBigOCardClick = (
    playerId: number,
    card: Card,
  ) => {
    updateSelection(
      activeBigOMode,
      playerId,
      card,
    );
  };

  const changeBigOMode = (
    mode: BigOSelectionMode,
  ) => {
    setActiveBigOMode(mode);
    setValidationMessage('');

    if (mode === 'low') {
      setLowTouched(true);
    }
  };

  const selectedWinnerIds = (
    selections: CardSelections,
  ): number[] => {
    return Object.entries(selections)
      .filter(
        ([, cards]) =>
          cards.length === 2,
      )
      .map(([playerId]) =>
        Number(playerId),
      )
      .sort((a, b) => a - b);
  };

  const hasIncompleteSelection = (
    selections: CardSelections,
  ): boolean => {
    return Object.values(
      selections,
    ).some(
      (cards) =>
        cards.length === 1,
    );
  };

  const validateUsedCards = (
    winnerIds: number[],
    selections: CardSelections,
    evaluationList:
      | HighEvaluation[]
      | LowEvaluation[],
  ): boolean => {
    return winnerIds.every(
      (playerId) => {
        const evaluation =
          evaluationList.find(
            (item) =>
              item.playerId ===
              playerId,
          );

        if (!evaluation) {
          return false;
        }

        const selected =
          selections[playerId] ||
          [];

        return isValidBestHoleSelection(
          selected,
          evaluation
            .allBestHoleCardCombos,
        );
      },
    );
  };

  // ───────────────────────────────────────────
  // Submit
  // ───────────────────────────────────────────

  const handleSubmit = () => {
    if (gameMode === 'big-o') {
      const userHighWinners =
        selectedWinnerIds(
          selectedHighCards,
        );

      const userLowWinners =
        selectedWinnerIds(
          selectedLowCards,
        );

      if (
        hasIncompleteSelection(
          selectedHighCards,
        ) ||
        hasIncompleteSelection(
          selectedLowCards,
        )
      ) {
        setValidationMessage(
          '每位選中的玩家必須選滿 2 張 Hole Cards。',
        );
        return;
      }

      if (
        userHighWinners.length === 0
      ) {
        setValidationMessage(
          'HIGH 至少要選一位玩家的 2 張 Hole Cards。',
        );
        return;
      }

      if (!lowTouched) {
        setValidationMessage(
          '請先切到 LOW 完成 Low 判定；若無 Low，保持零張即可。',
        );
        return;
      }

      setTimerRunning(false);
      setShowResult(true);

      const actualHighWinners =
        determineWinners(
          evaluations,
        );

      const actualLowWinners =
        determineLowWinners(
          lowEvaluations,
        );

      const highWinnerCorrect =
        sameNumberSet(
          userHighWinners,
          actualHighWinners,
        );

      const lowWinnerCorrect =
        sameNumberSet(
          userLowWinners,
          actualLowWinners,
        );

      /**
       * Used Cards is scored independently
       * from winner recognition.
       */
      const highUsedCardsCorrect =
        highWinnerCorrect &&
        validateUsedCards(
          actualHighWinners,
          selectedHighCards,
          evaluations,
        );

      const lowUsedCardsCorrect =
        actualLowWinners.length === 0
          ? (
              lowWinnerCorrect &&
              userLowWinners.length ===
                0
            )
          : (
              lowWinnerCorrect &&
              validateUsedCards(
                actualLowWinners,
                selectedLowCards,
                lowEvaluations,
              )
            );

      const overallCorrect =
        highWinnerCorrect &&
        highUsedCardsCorrect &&
        lowWinnerCorrect &&
        lowUsedCardsCorrect;

      const result: BigOResult = {
        overallCorrect,

        highWinnerCorrect,
        highUsedCardsCorrect,

        lowWinnerCorrect,
        lowUsedCardsCorrect,

        actualHighWinners,
        actualLowWinners,
      };

      setBigOResult(result);

      return;
    }

    // Hold'em / Omaha
    if (
      selectedWinners.length === 0
    ) {
      return;
    }

    setTimerRunning(false);
    setShowResult(true);

    const actualWinners =
      determineWinners(
        evaluations,
      );

    const isCorrect =
      sameNumberSet(
        selectedWinners,
        actualWinners,
      );

    setFeedback({
      isCorrect,
      message: isCorrect
        ? '答對了！'
        : '答錯了，再試一次',
      time: currentTime,
    });
  };

  const winners =
    showResult
      ? determineWinners(
          evaluations,
        )
      : [];

  // ───────────────────────────────────────────
  // Big O result helpers
  // ───────────────────────────────────────────

  const formatBestCombos = (
    playerId: number,
    evaluationList:
      | HighEvaluation[]
      | LowEvaluation[],
  ): string => {
    const evaluation =
      evaluationList.find(
        (item) =>
          item.playerId === playerId,
      );

    const combos =
      evaluation
        ?.allBestHoleCardCombos ||
      [];

    if (combos.length === 0) {
      return '—';
    }

    return combos
      .map(pairLabel)
      .join(' / ');
  };

  // ───────────────────────────────────────────
  // Big O V2 screen
  // ───────────────────────────────────────────

  if (gameMode === 'big-o') {
    const lowSelectionCount =
      selectedWinnerIds(
        selectedLowCards,
      ).length;

    return (
      <div className="h-[100dvh] overflow-hidden bg-black text-white relative">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-black to-neutral-950" />

        <div className="relative z-10 h-full flex flex-col px-2 pt-[max(6px,env(safe-area-inset-top))] pb-[max(6px,env(safe-area-inset-bottom))]">

          {/* Top control */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              data-testid="button-back"
              onClick={onBack}
              size="icon"
              variant="secondary"
              className="h-9 w-9 rounded-full shrink-0"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div className="grid grid-cols-2 gap-2 flex-1">
              <Button
                type="button"
                onClick={() =>
                  changeBigOMode(
                    'high',
                  )
                }
                className={
                  activeBigOMode ===
                  'high'
                    ? 'h-9 bg-yellow-500 hover:bg-yellow-500 text-black font-semibold'
                    : 'h-9 bg-white/10 hover:bg-white/15 text-white'
                }
              >
                HIGH
              </Button>

              <Button
                type="button"
                onClick={() =>
                  changeBigOMode(
                    'low',
                  )
                }
                className={
                  activeBigOMode ===
                  'low'
                    ? 'h-9 bg-blue-500 hover:bg-blue-500 text-white font-semibold'
                    : 'h-9 bg-white/10 hover:bg-white/15 text-white'
                }
              >
                LOW
                {lowTouched &&
                  lowSelectionCount ===
                    0 &&
                  !showResult && (
                    <span className="ml-1 text-[10px] opacity-75">
                      NO LOW
                    </span>
                  )}
              </Button>
            </div>

            {showResult ? (
              <Button
                data-testid="button-new-game"
                onClick={dealCards}
                size="icon"
                variant="secondary"
                className="h-9 w-9 rounded-full shrink-0"
              >
                <RotateCcw className="w-5 h-5" />
              </Button>
            ) : (
              <div className="h-9 w-9 shrink-0" />
            )}
          </div>

          {/* Timer */}
          {!showResult && (
            <div className="flex justify-center shrink-0 py-1">
              <Timer
                isRunning={
                  timerRunning
                }
                onTimeUpdate={(time) =>
                  setCurrentTime(
                    time,
                  )
                }
                className="!text-sm !px-3 !py-1"
              />
            </div>
          )}

          {/* Main hand-reading area */}
          <div className="flex-1 min-h-0 flex flex-col justify-center gap-[clamp(3px,0.7dvh,7px)]">

            {playerHands.map(
              (hand, index) => {
                const playerId =
                  index + 1;

                const highSelection =
                  selectedHighCards[
                    playerId
                  ] || [];

                const lowSelection =
                  selectedLowCards[
                    playerId
                  ] || [];

                return (
                  <div
                    key={
                      playerId
                    }
                    className="flex items-center gap-1.5 min-h-0"
                  >
                    <div className="w-7 shrink-0 text-center text-[11px] text-white/65">
                      P
                      {
                        playerId
                      }
                    </div>

                    <div className="flex flex-1 justify-center gap-[clamp(2px,1vw,5px)]">
                      {hand.map(
                        (
                          card,
                          cardIndex,
                        ) => (
                          <PlayingCard
                            key={`${playerId}-${cardIndex}`}
                            card={
                              card
                            }
                            size="compact"
                            clickable={
                              !showResult
                            }
                            onClick={() =>
                              handleBigOCardClick(
                                playerId,
                                card,
                              )
                            }
                            selectedHigh={highSelection.some(
                              (
                                selectedCard,
                              ) =>
                                sameCard(
                                  selectedCard,
                                  card,
                                ),
                            )}
                            selectedLow={lowSelection.some(
                              (
                                selectedCard,
                              ) =>
                                sameCard(
                                  selectedCard,
                                  card,
                                ),
                            )}
                          />
                        ),
                      )}
                    </div>
                  </div>
                );
              },
            )}

            {/* Board */}
            <div className="flex items-center gap-1.5 border-t border-white/10 pt-[clamp(4px,0.8dvh,8px)]">
              <div className="w-7 shrink-0 text-center text-[9px] text-white/50">
                BD
              </div>

              <div className="flex flex-1 justify-center gap-[clamp(2px,1vw,5px)]">
                {communityCards.map(
                  (
                    card,
                    index,
                  ) => (
                    <PlayingCard
                      key={`board-${index}`}
                      card={
                        card
                      }
                      size="compact"
                    />
                  ),
                )}
              </div>
            </div>
          </div>

          {validationMessage && !showResult && (
            <div className="shrink-0 text-center text-[11px] text-red-400 py-1">
              {validationMessage}
            </div>
          )}

          {/* Submit */}
          {!showResult && (
            <Button
              type="button"
              data-testid="button-submit"
              onClick={
                handleSubmit
              }
              className="shrink-0 h-10 w-full bg-white text-black hover:bg-white/90 font-semibold"
            >
              <Check className="w-4 h-4 mr-2" />
              SUBMIT
            </Button>
          )}
        </div>

        {/* Result overlay */}
        {showResult &&
          bigOResult && (
            <div className="absolute inset-0 z-40 bg-black/75 backdrop-blur-sm flex items-end">
              <div className="w-full max-h-[78dvh] overflow-y-auto rounded-t-2xl bg-neutral-950 border-t border-white/15 px-4 pt-4 pb-[max(16px,env(safe-area-inset-bottom))]">
                <div className="text-center mb-3">
                  <div
                    className={
                      bigOResult.overallCorrect
                        ? 'text-green-400 text-lg font-semibold'
                        : 'text-red-400 text-lg font-semibold'
                    }
                  >
                    {bigOResult.overallCorrect
                      ? 'Correct'
                      : 'Incorrect'}
                  </div>

                  <div className="text-xs text-white/50 mt-1">
                    {currentTime.toFixed(
                      1,
                    )}
                    s
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                  <div className="rounded-lg bg-white/5 p-2">
                    High Winner{' '}
                    {bigOResult.highWinnerCorrect
                      ? '✅'
                      : '❌'}
                  </div>

                  <div className="rounded-lg bg-white/5 p-2">
                    High Used Cards{' '}
                    {bigOResult.highUsedCardsCorrect
                      ? '✅'
                      : '❌'}
                  </div>

                  <div className="rounded-lg bg-white/5 p-2">
                    Low Winner{' '}
                    {bigOResult.lowWinnerCorrect
                      ? '✅'
                      : '❌'}
                  </div>

                  <div className="rounded-lg bg-white/5 p-2">
                    Low Used Cards{' '}
                    {bigOResult.lowUsedCardsCorrect
                      ? '✅'
                      : '❌'}
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-yellow-400 text-xs tracking-wider mb-1">
                      HIGH
                    </div>

                    {bigOResult.actualHighWinners.map(
                      (
                        playerId,
                      ) => (
                        <div
                          key={`high-result-${playerId}`}
                          className="text-white/90"
                        >
                          P
                          {
                            playerId
                          }
                          {' — '}
                          {formatBestCombos(
                            playerId,
                            evaluations,
                          )}
                        </div>
                      ),
                    )}
                  </div>

                  <div>
                    <div className="text-blue-400 text-xs tracking-wider mb-1">
                      LOW
                    </div>

                    {bigOResult.actualLowWinners.length ===
                    0 ? (
                      <div className="text-white/70">
                        No Qualifying
                        Low
                      </div>
                    ) : (
                      bigOResult.actualLowWinners.map(
                        (
                          playerId,
                        ) => (
                          <div
                            key={`low-result-${playerId}`}
                            className="text-white/90"
                          >
                            P
                            {
                              playerId
                            }
                            {' — '}
                            {formatBestCombos(
                              playerId,
                              lowEvaluations,
                            )}
                          </div>
                        ),
                      )
                    )}
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={
                    dealCards
                  }
                  className="w-full mt-5"
                >
                  NEXT HAND
                </Button>

                <Button
                  type="button"
                  onClick={
                    onBack
                  }
                  variant="ghost"
                  className="w-full mt-1 text-white/60"
                >
                  Back
                </Button>
              </div>
            </div>
          )}
      </div>
    );
  }

  // ───────────────────────────────────────────
  // Original Hold'em / Omaha screen
  // ───────────────────────────────────────────

  return (
    <div className="min-h-screen bg-black relative">
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-black to-neutral-950" />

      <div className="relative z-10 flex items-center justify-between p-4">
        <Button
          data-testid="button-back"
          onClick={onBack}
          size="icon"
          variant="secondary"
          className="rounded-full"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <div className="w-20" />

        {showResult ? (
          <Button
            data-testid="button-new-game"
            onClick={dealCards}
            size="icon"
            variant="secondary"
            className="rounded-full"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
        ) : selectedWinners.length >
          0 ? (
          <Button
            data-testid="button-submit"
            onClick={
              handleSubmit
            }
            size="icon"
            variant="secondary"
            className="rounded-full"
          >
            <Check className="w-5 h-5" />
          </Button>
        ) : (
          <div className="w-9" />
        )}
      </div>

      {!showResult && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20">
          <Timer
            isRunning={
              timerRunning
            }
            onTimeUpdate={(time) =>
              setCurrentTime(
                time,
              )
            }
          />
        </div>
      )}

      <div
        className="relative z-10 flex items-center justify-center py-2 sm:py-4"
        style={{
          minHeight:
            'calc(100dvh - 100px)',
        }}
      >
        <div className="w-full max-w-4xl px-2 sm:px-4">
          <div className="grid grid-rows-[auto_auto_auto] gap-2 sm:gap-4">

            <div className="flex justify-between items-start gap-2 sm:gap-4">
              {playerHands[0] && (
                <div className="max-w-[140px] sm:max-w-[180px]">
                  <PlayerHand
                    playerId={
                      1
                    }
                    cards={
                      playerHands[0]
                    }
                    onSelectWinner={() =>
                      handleSelectWinner(
                        1,
                      )
                    }
                    isSelected={selectedWinners.includes(
                      1,
                    )}
                    usedCards={
                      evaluations[0]
                        ?.usedCards ||
                      []
                    }
                    showResult={
                      showResult
                    }
                    isWinner={winners.includes(
                      1,
                    )}
                    handName={
                      evaluations[0]
                        ?.name
                    }
                    disabled={
                      showResult
                    }
                  />
                </div>
              )}

              {playerHands[1] && (
                <div className="max-w-[140px] sm:max-w-[180px]">
                  <PlayerHand
                    playerId={
                      2
                    }
                    cards={
                      playerHands[1]
                    }
                    onSelectWinner={() =>
                      handleSelectWinner(
                        2,
                      )
                    }
                    isSelected={selectedWinners.includes(
                      2,
                    )}
                    usedCards={
                      evaluations[1]
                        ?.usedCards ||
                      []
                    }
                    showResult={
                      showResult
                    }
                    isWinner={winners.includes(
                      2,
                    )}
                    handName={
                      evaluations[1]
                        ?.name
                    }
                    disabled={
                      showResult
                    }
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-center">
              <CommunityCards
                cards={
                  communityCards
                }
                usedCards={
                  showResult &&
                  winners.length >
                    0
                    ? evaluations.find(
                        (
                          evaluation,
                        ) =>
                          winners.includes(
                            evaluation.playerId,
                          ),
                      )
                        ?.usedCards ||
                      []
                    : []
                }
                showResult={
                  showResult
                }
              />
            </div>

            <div className="flex justify-between items-end gap-2 sm:gap-4">
              {playerHands[2] && (
                <div className="max-w-[140px] sm:max-w-[180px]">
                  <PlayerHand
                    playerId={
                      3
                    }
                    cards={
                      playerHands[2]
                    }
                    onSelectWinner={() =>
                      handleSelectWinner(
                        3,
                      )
                    }
                    isSelected={selectedWinners.includes(
                      3,
                    )}
                    usedCards={
                      evaluations[2]
                        ?.usedCards ||
                      []
                    }
                    showResult={
                      showResult
                    }
                    isWinner={winners.includes(
                      3,
                    )}
                    handName={
                      evaluations[2]
                        ?.name
                    }
                    disabled={
                      showResult
                    }
                  />
                </div>
              )}

              {playerHands[3] && (
                <div className="max-w-[140px] sm:max-w-[180px]">
                  <PlayerHand
                    playerId={
                      4
                    }
                    cards={
                      playerHands[3]
                    }
                    onSelectWinner={() =>
                      handleSelectWinner(
                        4,
                      )
                    }
                    isSelected={selectedWinners.includes(
                      4,
                    )}
                    usedCards={
                      evaluations[3]
                        ?.usedCards ||
                      []
                    }
                    showResult={
                      showResult
                    }
                    isWinner={winners.includes(
                      4,
                    )}
                    handName={
                      evaluations[3]
                        ?.name
                    }
                    disabled={
                      showResult
                    }
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {feedback && (
        <FeedbackBanner
          isCorrect={
            feedback.isCorrect
          }
          message={
            feedback.message
          }
          time={
            feedback.time
          }
          onClose={() =>
            setFeedback(null)
          }
          onNewGame={
            dealCards
          }
          onBack={
            onBack
          }
        />
      )}
    </div>
  );
}
