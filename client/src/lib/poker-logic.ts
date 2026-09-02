import type { Card, Suit, Rank } from '@shared/schema';

const rankValues: Record<Rank, number> = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  'J': 11,
  'Q': 12,
  'K': 13,
  'A': 14,
};

export interface HighHandEvaluation {
  rank: number;
  name: string;
  usedCards: Card[];
  description: string;
  handScore: number[];

  /**
   * Omaha / Big O only.
   *
   * All 2-hole-card combinations that make the exact same
   * best High hand.
   */
  allBestHoleCardCombos?: Card[][];
}

export interface LowHandEvaluation {
  hasLow: boolean;
  lowScore?: number[];

  /**
   * Full five-card Low hand:
   * exactly 2 hole + exactly 3 board.
   *
   * Kept for compatibility with the original application.
   */
  usedCards?: Card[];

  /**
   * All 2-hole-card combinations that make the exact same
   * best qualifying Low.
   */
  allBestHoleCardCombos?: Card[][];
}

export function createDeck(): Card[] {
  const suits: Suit[] = ['♠', '♥', '♦', '♣'];
  const ranks: Rank[] = [
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    'J',
    'Q',
    'K',
    'A',
  ];

  const deck: Card[] = [];

  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank });
    }
  }

  return shuffleDeck(deck);
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

// ─────────────────────────────────────────────────────────────
// General helpers
// ─────────────────────────────────────────────────────────────

function getCombinations(arr: Card[], k: number): Card[][] {
  if (k === 0) return [[]];
  if (arr.length === 0) return [];
  if (k > arr.length) return [];

  const [first, ...rest] = arr;

  const withFirst = getCombinations(rest, k - 1).map((combo) => [
    first,
    ...combo,
  ]);

  const withoutFirst = getCombinations(rest, k);

  return [...withFirst, ...withoutFirst];
}

function cardKey(card: Card): string {
  return `${card.rank}${card.suit}`;
}

function sameCardSet(cards1: Card[], cards2: Card[]): boolean {
  if (cards1.length !== cards2.length) return false;

  const first = cards1.map(cardKey).sort();
  const second = cards2.map(cardKey).sort();

  return first.every((key, index) => key === second[index]);
}

function addUniqueCardCombo(
  combos: Card[][],
  candidate: Card[],
): Card[][] {
  if (combos.some((combo) => sameCardSet(combo, candidate))) {
    return combos;
  }

  return [...combos, candidate];
}

// ─────────────────────────────────────────────────────────────
// High
// ─────────────────────────────────────────────────────────────

export function evaluateHand(
  playerCards: Card[],
  communityCards: Card[],
): HighHandEvaluation {
  const allCards = [...playerCards, ...communityCards];

  let bestHand: HighHandEvaluation = {
    rank: 0,
    name: 'High Card',
    usedCards: [],
    description: '',
    handScore: [0],
  };

  const combinations = getCombinations(allCards, 5);

  for (const combo of combinations) {
    const evaluation = evaluateFiveCards(combo);

    if (
      compareHands(
        evaluation.handScore,
        bestHand.handScore,
      ) > 0
    ) {
      bestHand = evaluation;
    }
  }

  return bestHand;
}

/**
 * Omaha / Big O High
 *
 * This function works with:
 * - 4-card Omaha
 * - 5-card Big O
 * - other Omaha formats
 *
 * because it always evaluates every combination of:
 *
 * exactly 2 hole cards + exactly 3 board cards.
 */
export function evaluateOmahaHand(
  playerCards: Card[],
  communityCards: Card[],
): HighHandEvaluation {
  let bestHand: HighHandEvaluation | null = null;

  let allBestHoleCardCombos: Card[][] = [];

  const holeCombos = getCombinations(playerCards, 2);
  const boardCombos = getCombinations(communityCards, 3);

  for (const holeCombo of holeCombos) {
    let bestForHoleCombo: HighHandEvaluation | null = null;

    for (const boardCombo of boardCombos) {
      const fiveCards = [
        ...holeCombo,
        ...boardCombo,
      ];

      const evaluation = evaluateFiveCards(fiveCards);

      if (
        !bestForHoleCombo ||
        compareHands(
          evaluation.handScore,
          bestForHoleCombo.handScore,
        ) > 0
      ) {
        bestForHoleCombo = evaluation;
      }
    }

    if (!bestForHoleCombo) continue;

    if (
      !bestHand ||
      compareHands(
        bestForHoleCombo.handScore,
        bestHand.handScore,
      ) > 0
    ) {
      bestHand = bestForHoleCombo;
      allBestHoleCardCombos = [holeCombo];
    } else if (
      compareHands(
        bestForHoleCombo.handScore,
        bestHand.handScore,
      ) === 0
    ) {
      allBestHoleCardCombos = addUniqueCardCombo(
        allBestHoleCardCombos,
        holeCombo,
      );
    }
  }

  if (!bestHand) {
    return {
      rank: 0,
      name: 'High Card',
      usedCards: [],
      description: '',
      handScore: [0],
      allBestHoleCardCombos: [],
    };
  }

  return {
    ...bestHand,
    allBestHoleCardCombos,
  };
}

function compareHands(
  score1: number[],
  score2: number[],
): number {
  for (
    let i = 0;
    i < Math.max(score1.length, score2.length);
    i++
  ) {
    const val1 = score1[i] || 0;
    const val2 = score2[i] || 0;

    if (val1 > val2) return 1;
    if (val1 < val2) return -1;
  }

  return 0;
}

function evaluateFiveCards(
  cards: Card[],
): HighHandEvaluation {
  const sorted = [...cards].sort(
    (a, b) =>
      rankValues[b.rank] - rankValues[a.rank],
  );

  const isFlush = cards.every(
    (card) => card.suit === cards[0].suit,
  );

  const straightResult = checkStraight(sorted);
  const isStraight = straightResult.isStraight;

  const rankCounts = new Map<Rank, number>();

  sorted.forEach((card) => {
    rankCounts.set(
      card.rank,
      (rankCounts.get(card.rank) || 0) + 1,
    );
  });

  const countGroups = Array.from(
    rankCounts.entries(),
  ).sort((a, b) => {
    if (b[1] !== a[1]) {
      return b[1] - a[1];
    }

    return (
      rankValues[b[0]] -
      rankValues[a[0]]
    );
  });

  const counts = countGroups.map(
    (group) => group[1],
  );

  const ranksInOrder = countGroups.map(
    (group) => rankValues[group[0]],
  );

  // Straight Flush
  if (isFlush && isStraight) {
    return {
      rank: 9,
      name: 'Straight Flush',
      usedCards: sorted,
      description: `${straightRankName(
        straightResult.highCard,
      )}-high Straight Flush`,
      handScore: [
        9,
        straightResult.highCard,
      ],
    };
  }

  // Four of a Kind
  if (counts[0] === 4) {
    return {
      rank: 8,
      name: 'Four of a Kind',
      usedCards: sorted,
      description: 'Four of a Kind',
      handScore: [
        8,
        ranksInOrder[0],
        ranksInOrder[1],
      ],
    };
  }

  // Full House
  if (
    counts[0] === 3 &&
    counts[1] === 2
  ) {
    return {
      rank: 7,
      name: 'Full House',
      usedCards: sorted,
      description: 'Full House',
      handScore: [
        7,
        ranksInOrder[0],
        ranksInOrder[1],
      ],
    };
  }

  // Flush
  if (isFlush) {
    const flushValues = sorted.map(
      (card) => rankValues[card.rank],
    );

    return {
      rank: 6,
      name: 'Flush',
      usedCards: sorted,
      description: `${sorted[0].rank}-high Flush`,
      handScore: [
        6,
        ...flushValues,
      ],
    };
  }

  // Straight
  if (isStraight) {
    return {
      rank: 5,
      name: 'Straight',
      usedCards: sorted,
      description: `${straightRankName(
        straightResult.highCard,
      )}-high Straight`,
      handScore: [
        5,
        straightResult.highCard,
      ],
    };
  }

  // Three of a Kind
  if (counts[0] === 3) {
    return {
      rank: 4,
      name: 'Three of a Kind',
      usedCards: sorted,
      description: 'Three of a Kind',
      handScore: [
        4,
        ...ranksInOrder,
      ],
    };
  }

  // Two Pair
  if (
    counts[0] === 2 &&
    counts[1] === 2
  ) {
    return {
      rank: 3,
      name: 'Two Pair',
      usedCards: sorted,
      description: 'Two Pair',
      handScore: [
        3,
        ...ranksInOrder,
      ],
    };
  }

  // One Pair
  if (counts[0] === 2) {
    return {
      rank: 2,
      name: 'One Pair',
      usedCards: sorted,
      description: 'One Pair',
      handScore: [
        2,
        ...ranksInOrder,
      ],
    };
  }

  // High Card
  return {
    rank: 1,
    name: 'High Card',
    usedCards: sorted,
    description: `${sorted[0].rank}-high`,
    handScore: [
      1,
      ...sorted.map(
        (card) => rankValues[card.rank],
      ),
    ],
  };
}

function checkStraight(
  sortedCards: Card[],
): {
  isStraight: boolean;
  highCard: number;
} {
  const uniqueValues = [
    ...new Set(
      sortedCards.map(
        (card) => rankValues[card.rank],
      ),
    ),
  ].sort((a, b) => b - a);

  if (uniqueValues.length !== 5) {
    return {
      isStraight: false,
      highCard: 0,
    };
  }

  // A-2-3-4-5
  if (
    uniqueValues[0] === 14 &&
    uniqueValues[1] === 5 &&
    uniqueValues[2] === 4 &&
    uniqueValues[3] === 3 &&
    uniqueValues[4] === 2
  ) {
    return {
      isStraight: true,
      highCard: 5,
    };
  }

  for (
    let i = 0;
    i < uniqueValues.length - 1;
    i++
  ) {
    if (
      uniqueValues[i] -
        uniqueValues[i + 1] !==
      1
    ) {
      return {
        isStraight: false,
        highCard: 0,
      };
    }
  }

  return {
    isStraight: true,
    highCard: uniqueValues[0],
  };
}

function straightRankName(
  value: number,
): string {
  if (value === 14) return 'A';
  if (value === 13) return 'K';
  if (value === 12) return 'Q';
  if (value === 11) return 'J';

  return String(value);
}

// ─────────────────────────────────────────────────────────────
// High winners
// ─────────────────────────────────────────────────────────────

export function determineWinners(
  evaluations: Array<{
    playerId: number;
    rank: number;
    usedCards: Card[];
    handScore?: number[];
  }>,
): number[] {
  if (evaluations.length === 0) {
    return [];
  }

  let bestEval = evaluations[0];
  let winners = [
    evaluations[0].playerId,
  ];

  for (
    let i = 1;
    i < evaluations.length;
    i++
  ) {
    const current = evaluations[i];

    const comparison = compareHands(
      current.handScore ||
        [current.rank],
      bestEval.handScore ||
        [bestEval.rank],
    );

    if (comparison > 0) {
      bestEval = current;
      winners = [current.playerId];
    } else if (comparison === 0) {
      winners.push(current.playerId);
    }
  }

  return winners;
}

// ─────────────────────────────────────────────────────────────
// Low
// ─────────────────────────────────────────────────────────────

/**
 * Omaha / Big O Low
 *
 * Eight or Better
 * Ace-to-Five
 *
 * Exactly:
 * 2 hole cards + 3 board cards
 */
export function evaluateLowHand(
  playerCards: Card[],
  communityCards: Card[],
): LowHandEvaluation {
  let bestLow:
    | LowHandEvaluation
    | null = null;

  let allBestHoleCardCombos: Card[][] = [];

  const holeCombos =
    getCombinations(playerCards, 2);

  const boardCombos =
    getCombinations(
      communityCards,
      3,
    );

  for (const holeCombo of holeCombos) {
    let bestForHoleCombo:
      | LowHandEvaluation
      | null = null;

    for (const boardCombo of boardCombos) {
      const fiveCards = [
        ...holeCombo,
        ...boardCombo,
      ];

      const lowEval =
        evaluateFiveCardsForLow(
          fiveCards,
        );

      if (!lowEval.hasLow) {
        continue;
      }

      if (
        !bestForHoleCombo ||
        compareLowHands(
          lowEval.lowScore!,
          bestForHoleCombo.lowScore!,
        ) < 0
      ) {
        bestForHoleCombo = lowEval;
      }
    }

    if (!bestForHoleCombo) {
      continue;
    }

    if (
      !bestLow ||
      compareLowHands(
        bestForHoleCombo.lowScore!,
        bestLow.lowScore!,
      ) < 0
    ) {
      bestLow = bestForHoleCombo;
      allBestHoleCardCombos = [
        holeCombo,
      ];
    } else if (
      compareLowHands(
        bestForHoleCombo.lowScore!,
        bestLow.lowScore!,
      ) === 0
    ) {
      allBestHoleCardCombos =
        addUniqueCardCombo(
          allBestHoleCardCombos,
          holeCombo,
        );
    }
  }

  if (!bestLow) {
    return {
      hasLow: false,
      allBestHoleCardCombos: [],
    };
  }

  return {
    ...bestLow,
    allBestHoleCardCombos,
  };
}

function evaluateFiveCardsForLow(
  cards: Card[],
): LowHandEvaluation {
  const lowValues = cards.map(
    (card) => {
      const value =
        rankValues[card.rank];

      return value === 14
        ? 1
        : value;
    },
  );

  // Eight or Better:
  // every rank must be 8 or lower.
  if (
    lowValues.some(
      (value) => value > 8,
    )
  ) {
    return {
      hasLow: false,
    };
  }

  // A qualifying Low must contain
  // five different ranks.
  if (
    new Set(lowValues).size !== 5
  ) {
    return {
      hasLow: false,
    };
  }

  /**
   * Low is ranked from its
   * highest card downward.
   *
   * Example:
   *
   * 6-4-3-2-A
   * beats
   * 6-5-4-3-2
   */
  const sortedValues = [
    ...lowValues,
  ].sort((a, b) => b - a);

  return {
    hasLow: true,
    lowScore: sortedValues,
    usedCards: cards,
  };
}

function compareLowHands(
  score1: number[],
  score2: number[],
): number {
  for (let i = 0; i < 5; i++) {
    if (score1[i] < score2[i]) {
      return -1;
    }

    if (score1[i] > score2[i]) {
      return 1;
    }
  }

  return 0;
}

// ─────────────────────────────────────────────────────────────
// Low winners
// ─────────────────────────────────────────────────────────────

export function determineLowWinners(
  lowEvaluations: Array<{
    playerId: number;
    hasLow: boolean;
    lowScore?: number[];
    usedCards?: Card[];
  }>,
): number[] {
  const validLows =
    lowEvaluations.filter(
      (evaluation) =>
        evaluation.hasLow,
    );

  if (validLows.length === 0) {
    return [];
  }

  let bestLow = validLows[0];

  let winners = [
    validLows[0].playerId,
  ];

  for (
    let i = 1;
    i < validLows.length;
    i++
  ) {
    const current = validLows[i];

    const comparison =
      compareLowHands(
        current.lowScore!,
        bestLow.lowScore!,
      );

    if (comparison < 0) {
      bestLow = current;

      winners = [
        current.playerId,
      ];
    } else if (
      comparison === 0
    ) {
      winners.push(
        current.playerId,
      );
    }
  }

  return winners;
}

// ─────────────────────────────────────────────────────────────
// Big O V2 Used Cards validation
// ─────────────────────────────────────────────────────────────

/**
 * Returns true when the user's selected
 * two Hole Cards are one of the valid
 * combinations capable of making the
 * player's exact best High or Low hand.
 *
 * This prevents an arbitrary evaluator
 * tie-break from marking a legitimate
 * Used Cards selection as incorrect.
 */
export function isValidBestHoleSelection(
  selectedCards: Card[],
  validHoleCardCombos:
    | Card[][]
    | undefined,
): boolean {
  if (
    selectedCards.length !== 2 ||
    !validHoleCardCombos
  ) {
    return false;
  }

  return validHoleCardCombos.some(
    (combo) =>
      sameCardSet(
        selectedCards,
        combo,
      ),
  );
}
