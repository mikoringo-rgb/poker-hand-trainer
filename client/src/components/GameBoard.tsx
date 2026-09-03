// client/src/components/GameBoard.tsx

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
type BigOMode = 'high' | 'low';

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

type CardSelections = Record<number, Card[]>;

interface BigOResult {
  overallCorrect: boolean;

  highWinnerCorrect: boolean;
  highUsedCardsCorrect: boolean;

  lowWinnerCorrect: boolean;
  lowUsedCardsCorrect: boolean;

  actualHighWinners: number[];
  actualLowWinners: number[];
}

function sameCard(a: Card, b: Card): boolean {
  return a.rank === b.rank && a.suit === b.suit;
}

function includesCard(cards: Card[], card: Card): boolean {
  return cards.some((item) => sameCard(item, card));
}

function sameNumberSet(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;

  return a.every((value) => b.includes(value));
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
  const [activeBigOMode, setActiveBigOMode] =
    useState<BigOMode>('high');

  const [selectedHighCards, setSelectedHighCards] =
    useState<CardSelections>({});

  const [selectedLowCards, setSelectedLowCards] =
    useState<CardSelections>({});

  const [validationMessage, setValidationMessage] =
    useState('');

  const [showResult, setShowResult] =
    useState(false);

  const [bigOResult, setBigOResult] =
    useState<BigOResult | null>(null);

  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    message: string;
    time?: number;
  } | null>(null);

  const [timerRunning, setTimerRunning] =
    useState(false);

  const [currentTime, setCurrentTime] =
    useState(0);

  const [evaluations, setEvaluations] =
    useState<HighEvaluation[]>([]);

  const [lowEvaluations, setLowEvaluations] =
    useState<LowEvaluation[]>([]);

  // ─────────────────────────────────────────────
  // Deal
  // ─────────────────────────────────────────────

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
        let i = 0;
        i < cardsPerPlayer;
        i++
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

    setValidationMessage('');
    setShowResult(false);
    setBigOResult(null);
    setFeedback(null);

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
          const evaluation =
            evaluateLowHand(
              hand,
              board,
            );

          return {
            playerId: index + 1,
            ...evaluation,
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

  // ─────────────────────────────────────────────
  // Hold'em / Omaha
  // ─────────────────────────────────────────────

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

  // ─────────────────────────────────────────────
  // Big O selection
  // ─────────────────────────────────────────────

  const updateSelection = (
    mode: BigOMode,
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
        includesCard(
          current,
          card,
        );

      if (alreadySelected) {
        return {
          ...previous,
          [playerId]:
            current.filter(
              (selected) =>
                !sameCard(
                  selected,
                  card,
                ),
            ),
        };
      }

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

  const changeBigOMode = (
    mode: BigOMode,
  ) => {
    setActiveBigOMode(mode);
    setValidationMessage('');
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

        return isValidBestHoleSelection(
          selections[playerId] ||
            [],
          evaluation
            .allBestHoleCardCombos,
        );
      },
    );
  };

  // ─────────────────────────────────────────────
  // Result helpers
  // ─────────────────────────────────────────────

  const getCorrectPair = (
    playerId: number,
    mode: BigOMode,
  ): Card[] => {
    const evaluationList =
      mode === 'high'
        ? evaluations
        : lowEvaluations;

    const evaluation =
      evaluationList.find(
        (item) =>
          item.playerId ===
          playerId,
      );

    const combos =
      evaluation
        ?.allBestHoleCardCombos ||
      [];

    if (combos.length === 0) {
      return [];
    }

    const userSelection =
      mode === 'high'
        ? selectedHighCards[
            playerId
          ] || []
        : selectedLowCards[
            playerId
          ] || [];

    const selectedIsValid =
      isValidBestHoleSelection(
        userSelection,
        combos,
      );

    if (selectedIsValid) {
      return userSelection;
    }

    return combos[0];
  };

  const getCardResultClass = (
    playerId: number,
    card: Card,
  ): string => {
    if (!showResult) {
      return '';
    }

    const mode =
      activeBigOMode;

    const userSelections =
      mode === 'high'
        ? selectedHighCards
        : selectedLowCards;

    const actualWinners =
      mode === 'high'
        ? bigOResult
            ?.actualHighWinners ||
          []
        : bigOResult
            ?.actualLowWinners ||
          [];

    const userPair =
      userSelections[
        playerId
      ] || [];

    const correctPair =
      actualWinners.includes(
        playerId,
      )
        ? getCorrectPair(
            playerId,
            mode,
          )
        : [];

    const userSelected =
      includesCard(
        userPair,
        card,
      );

    const correctSelected =
      includesCard(
        correctPair,
        card,
      );

    if (
      correctSelected
    ) {
      return '!ring-4 !ring-green-500 !border-green-500 !bg-green-50';
    }

    if (
      userSelected &&
      !correctSelected
    ) {
      return '!ring-4 !ring-red-500 !border-red-500 !bg-red-50';
    }

    return '';
  };

  // ─────────────────────────────────────────────
  // Submit
  // ─────────────────────────────────────────────

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
        userHighWinners.length ===
        0
      ) {
        setValidationMessage(
          'HIGH 至少要選一位玩家的 2 張 Hole Cards。',
        );
        return;
      }

      setTimerRunning(false);

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

      const highUsedCardsCorrect =
        highWinnerCorrect &&
        validateUsedCards(
          actualHighWinners,
          selectedHighCards,
          evaluations,
        );

      const lowUsedCardsCorrect =
        actualLowWinners.length ===
        0
          ? lowWinnerCorrect &&
            userLowWinners.length ===
              0
          : lowWinnerCorrect &&
            validateUsedCards(
              actualLowWinners,
              selectedLowCards,
              lowEvaluations,
            );

      const overallCorrect =
        highWinnerCorrect &&
        highUsedCardsCorrect &&
        lowWinnerCorrect &&
        lowUsedCardsCorrect;

      setBigOResult({
        overallCorrect,

        highWinnerCorrect,
        highUsedCardsCorrect,

        lowWinnerCorrect,
        lowUsedCardsCorrect,

        actualHighWinners,
        actualLowWinners,
      });

      setShowResult(true);
      setActiveBigOMode('high');

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

  // ─────────────────────────────────────────────
  // BIG O
  // ─────────────────────────────────────────────

  if (gameMode === 'big-o') {
    const highCorrect =
      Boolean(
        bigOResult?.highWinnerCorrect &&
        bigOResult?.highUsedCardsCorrect,
      );

    const lowCorrect =
      Boolean(
        bigOResult?.lowWinnerCorrect &&
        bigOResult?.lowUsedCardsCorrect,
      );

    return (
      <div className="h-[100svh] overflow-hidden bg-black text-white relative">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-black to-neutral-950" />

        <div className="relative z-10 h-full flex flex-col px-2 pt-[max(6px,env(safe-area-inset-top))] pb-[max(6px,env(safe-area-inset-bottom))]">

          {/* HIGH / LOW */}
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
                {showResult &&
                  bigOResult && (
                    <span className="ml-2">
                      {bigOResult.highWinnerCorrect &&
                      bigOResult.highUsedCardsCorrect
                        ? '✓'
                        : '✕'}
                    </span>
                  )}
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

                {showResult &&
                  bigOResult && (
                    <span className="ml-2">
                      {bigOResult.lowWinnerCorrect &&
                      bigOResult.lowUsedCardsCorrect
                        ? '✓'
                        : '✕'}
                    </span>
                  )}
              </Button>
            </div>

            {showResult ? (
              <Button
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

          {/* TIMER */}
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

          {/* RESULT SUMMARY */}
          {showResult &&
            bigOResult && (
              <div className="shrink-0 pt-1 pb-1">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveBigOMode(
                        'high',
                      )
                    }
                    className={[
                      'rounded-lg border-2 px-2 py-1.5 text-left',
                      highCorrect
                        ? 'bg-green-950/80 border-green-500'
                        : 'bg-red-950/80 border-red-500',
                      activeBigOMode ===
                      'high'
                        ? 'ring-2 ring-white/40'
                        : '',
                    ].join(' ')}
                  >
                    <div
                      className={[
                        'text-sm font-bold',
                        highCorrect
                          ? 'text-green-300'
                          : 'text-red-300',
                      ].join(' ')}
                    >
                      HIGH{' '}
                      {highCorrect
                        ? '✓'
                        : '✕'}
                    </div>

                    <div className="mt-0.5 text-[10px] text-white/90">
                      Winner{' '}
                      {bigOResult.highWinnerCorrect
                        ? '✓'
                        : '✕'}

                      <span className="mx-1 text-white/30">
                        |
                      </span>

                      Used{' '}
                      {bigOResult.highUsedCardsCorrect
                        ? '✓'
                        : '✕'}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setActiveBigOMode(
                        'low',
                      )
                    }
                    className={[
                      'rounded-lg border-2 px-2 py-1.5 text-left',
                      lowCorrect
                        ? 'bg-green-950/80 border-green-500'
                        : 'bg-red-950/80 border-red-500',
                      activeBigOMode ===
                      'low'
                        ? 'ring-2 ring-white/40'
                        : '',
                    ].join(' ')}
                  >
                    <div
                      className={[
                        'text-sm font-bold',
                        lowCorrect
                          ? 'text-green-300'
                          : 'text-red-300',
                      ].join(' ')}
                    >
                      LOW{' '}
                      {lowCorrect
                        ? '✓'
                        : '✕'}
                    </div>

                    <div className="mt-0.5 text-[10px] text-white/90">
                      Winner{' '}
                      {bigOResult.lowWinnerCorrect
                        ? '✓'
                        : '✕'}

                      <span className="mx-1 text-white/30">
                        |
                      </span>

                      Used{' '}
                      {bigOResult.lowUsedCardsCorrect
                        ? '✓'
                        : '✕'}
                    </div>
                  </button>
                </div>

                <div className="mt-1 flex items-center justify-between px-1 text-[10px]">
                  <div>
                    <span className="text-green-400">
                      綠框＝正確
                    </span>

                    <span className="mx-2 text-white/25">
                      |
                    </span>

                    <span className="text-red-400">
                      紅框＝妳選錯
                    </span>
                  </div>

                  <div className="text-white/45">
                    {currentTime.toFixed(
                      1,
                    )}
                    s
                  </div>
                </div>
              </div>
            )}

          {/* HANDS */}
          <div className="flex-1 min-h-0 flex flex-col justify-center">

            <div className="flex flex-col gap-[clamp(6px,1.05svh,10px)]">
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
                      key={playerId}
                      className="flex items-center gap-2"
                    >
                      <div className="w-10 shrink-0 text-center text-[11px] text-white/60">
                        P{playerId}
                      </div>

                      <div className="flex flex-1 justify-center gap-[clamp(3px,1vw,6px)]">
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
                                updateSelection(
                                  activeBigOMode,
                                  playerId,
                                  card,
                                )
                              }
                              selectedHigh={
                                !showResult &&
                                highSelection.some(
                                  (
                                    selected,
                                  ) =>
                                    sameCard(
                                      selected,
                                      card,
                                    ),
                                )
                              }
                              selectedLow={
                                !showResult &&
                                lowSelection.some(
                                  (
                                    selected,
                                  ) =>
                                    sameCard(
                                      selected,
                                      card,
                                    ),
                                )
                              }
                              className={
                                getCardResultClass(
                                  playerId,
                                  card,
                                )
                              }
                            />
                          ),
                        )}
                      </div>
                    </div>
                  );
                },
              )}
            </div>

            {/* BOARD SEPARATION */}
            <div className="h-[clamp(10px,1.6svh,18px)] shrink-0" />

            {/* BOARD */}
            <div className="border-t border-white/20 pt-[clamp(7px,1.05svh,11px)]">
              <div className="flex items-center gap-2">
                <div className="w-10 shrink-0 text-center text-[9px] font-semibold tracking-wide text-white/65">
                  BOARD
                </div>

                <div className="flex flex-1 justify-center gap-[clamp(3px,1vw,6px)]">
                  {communityCards.map(
                    (
                      card,
                      index,
                    ) => (
                      <PlayingCard
                        key={`board-${index}`}
                        card={card}
                        size="board"
                      />
                    ),
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* VALIDATION */}
          {validationMessage &&
            !showResult && (
              <div className="shrink-0 text-center text-[11px] text-red-400 py-1">
                {validationMessage}
              </div>
            )}

          {/* BOTTOM */}
          {!showResult ? (
            <Button
              type="button"
              data-testid="button-submit"
              onClick={
                handleSubmit
              }
              className="shrink-0 h-11 w-full bg-white text-black hover:bg-white/90 font-semibold"
            >
              <Check className="w-4 h-4 mr-2" />
              SUBMIT
            </Button>
          ) : (
            <Button
              type="button"
              onClick={
                dealCards
              }
              className="shrink-0 h-11 w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
            >
              NEXT HAND
            </Button>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // EXISTING HOLD'EM / OMAHA
  // ─────────────────────────────────────────────

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
            onClick={
              dealCards
            }
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
            setFeedback(
              null,
            )
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
