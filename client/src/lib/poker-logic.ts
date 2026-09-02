import type { Card, HandEvaluation } from "@shared/schema";

// ─────────────────────────────────────────────────────────────
// High hand evaluation
// ─────────────────────────────────────────────────────────────

const RANK_VALUE: Record<Card["rank"], number> = {
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
  "7": 7,
  "8": 8,
  "9": 9,
  "10": 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

function combinations<T>(items: T[], choose: number): T[][] {
  const result: T[][] = [];

  const walk = (start: number, picked: T[]) => {
    if (picked.length === choose) {
      result.push([...picked]);
      return;
    }

    for (let i = start; i < items.length; i++) {
      picked.push(items[i]);
      walk(i + 1, picked);
      picked.pop();
    }
  };

  walk(0, []);
  return result;
}

function cardKey(card: Card): string {
  return `${card.rank}${card.suit}`;
}

function sameCardSet(a: Card[], b: Card[]): boolean {
  if (a.length !== b.length) return false;

  const left = a.map(cardKey).sort();
  const right = b.map(cardKey).sort();

  return left.every((key, index) => key === right[index]);
}

function evaluateFiveCardHigh(cards: Card[]): HandEvaluation {
  const values = cards
    .map((card) => RANK_VALUE[card.rank])
    .sort((a, b) => b - a);

  const suits = cards.map((card) => card.suit);

  const counts = new Map<number, number>();
  for (const value of values) {
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  const uniqueValues = [...new Set(values)].sort((a, b) => b - a);

  let straightHigh = 0;

  if (uniqueValues.length === 5) {
    if (uniqueValues[0] - uniqueValues[4] === 4) {
      straightHigh = uniqueValues[0];
    } else if (
      uniqueValues[0] === 14 &&
      uniqueValues[1] === 5 &&
      uniqueValues[2] === 4 &&
      uniqueValues[3] === 3 &&
      uniqueValues[4] === 2
    ) {
      straightHigh = 5;
    }
  }

  const isFlush = suits.every((suit) => suit === suits[0]);

  const grouped = [...counts.entries()].sort((a, b) => {
    if (a[1] !== b[1]) return b[1] - a[1];
    return b[0] - a[0];
  });

  // Straight Flush
  if (isFlush && straightHigh) {
    return {
      rank: 8,
      name: straightHigh === 14 ? "Royal Flush" : "Straight Flush",
      values: [straightHigh],
      cards,
    };
  }

  // Four of a Kind
  if (grouped[0][1] === 4) {
    const quad = grouped[0][0];
    const kicker = grouped[1][0];

    return {
      rank: 7,
      name: "Four of a Kind",
      values: [quad, kicker],
      cards,
    };
  }

  // Full House
  if (grouped[0][1] === 3 && grouped[1][1] === 2) {
    return {
      rank: 6,
      name: "Full House",
      values: [grouped[0][0], grouped[1][0]],
      cards,
    };
  }

  // Flush
  if (isFlush) {
    return {
      rank: 5,
      name: "Flush",
      values,
      cards,
    };
  }

  // Straight
  if (straightHigh) {
    return {
      rank: 4,
      name: "Straight",
      values: [straightHigh],
      cards,
    };
  }

  // Three of a Kind
  if (grouped[0][1] === 3) {
    const trips = grouped[0][0];
    const kickers = grouped
      .slice(1)
      .map(([value]) => value)
      .sort((a, b) => b - a);

    return {
      rank: 3,
      name: "Three of a Kind",
      values: [trips, ...kickers],
      cards,
    };
  }

  // Two Pair
  if (grouped[0][1] === 2 && grouped[1][1] === 2) {
    const pairs = [grouped[0][0], grouped[1][0]].sort((a, b) => b - a);
    const kicker = grouped[2][0];

    return {
      rank: 2,
      name: "Two Pair",
      values: [...pairs, kicker],
      cards,
    };
  }

  // One Pair
  if (grouped[0][1] === 2) {
    const pair = grouped[0][0];
    const kickers = grouped
      .slice(1)
      .map(([value]) => value)
      .sort((a, b) => b - a);

    return {
      rank: 1,
      name: "One Pair",
      values: [pair, ...kickers],
      cards,
    };
  }

  // High Card
  return {
    rank: 0,
    name: "High Card",
    values,
    cards,
  };
}

export function compareHighHands(
  a: HandEvaluation,
  b: HandEvaluation,
): number {
  if (a.rank !== b.rank) {
    return a.rank > b.rank ? 1 : -1;
  }

  const length = Math.max(a.values.length, b.values.length);

  for (let i = 0; i < length; i++) {
    const av = a.values[i] ?? 0;
    const bv = b.values[i] ?? 0;

    if (av !== bv) {
      return av > bv ? 1 : -1;
    }
  }

  return 0;
}

export function evaluateHoldemHand(
  holeCards: Card[],
  communityCards: Card[],
): HandEvaluation {
  const allCards = [...holeCards, ...communityCards];
  const fiveCardCombos = combinations(allCards, 5);

  let best: HandEvaluation | null = null;

  for (const combo of fiveCardCombos) {
    const evaluation = evaluateFiveCardHigh(combo);

    if (!best || compareHighHands(evaluation, best) > 0) {
      best = evaluation;
    }
  }

  if (!best) {
    throw new Error("Unable to evaluate Hold'em hand.");
  }

  return best;
}

// ─────────────────────────────────────────────────────────────
// Omaha / Big O High
//
// APT rule basis:
// Exactly 2 hole cards + exactly 3 community cards.
// Big O uses 5 hole cards.
// ─────────────────────────────────────────────────────────────

export interface OmahaHighEvaluation extends HandEvaluation {
  usedCards: Card[];
  usedBoardCards: Card[];
  allBestHoleCardCombos: Card[][];
}

export function evaluateOmahaHigh(
  holeCards: Card[],
  communityCards: Card[],
): OmahaHighEvaluation {
  const holeCombos = combinations(holeCards, 2);
  const boardCombos = combinations(communityCards, 3);

  let best: OmahaHighEvaluation | null = null;
  let allBestHoleCardCombos: Card[][] = [];

  for (const holeCombo of holeCombos) {
    let bestForThisHoleCombo: HandEvaluation | null = null;
    let bestBoardForThisHoleCombo: Card[] = [];

    for (const boardCombo of boardCombos) {
      const evaluation = evaluateFiveCardHigh([
        ...holeCombo,
        ...boardCombo,
      ]);

      if (
        !bestForThisHoleCombo ||
        compareHighHands(evaluation, bestForThisHoleCombo) > 0
      ) {
        bestForThisHoleCombo = evaluation;
        bestBoardForThisHoleCombo = boardCombo;
      }
    }

    if (!bestForThisHoleCombo) continue;

    if (!best || compareHighHands(bestForThisHoleCombo, best) > 0) {
      best = {
        ...bestForThisHoleCombo,
        usedCards: holeCombo,
        usedBoardCards: bestBoardForThisHoleCombo,
        allBestHoleCardCombos: [holeCombo],
      };

      allBestHoleCardCombos = [holeCombo];
    } else if (compareHighHands(bestForThisHoleCombo, best) === 0) {
      if (
        !allBestHoleCardCombos.some((combo) =>
          sameCardSet(combo, holeCombo),
        )
      ) {
        allBestHoleCardCombos.push(holeCombo);
      }
    }
  }

  if (!best) {
    throw new Error("Unable to evaluate Omaha/Big O high hand.");
  }

  best.allBestHoleCardCombos = allBestHoleCardCombos;

  return best;
}

// ─────────────────────────────────────────────────────────────
// Omaha / Big O Low
//
// Eight or Better
// Ace-to-Five
// Straights and flushes do not count against Low.
// Five different ranks are required.
// Compare highest card first; lower wins.
// ─────────────────────────────────────────────────────────────

export interface LowEvaluation {
  qualifies: boolean;
  values: number[];
  name: string;
  cards: Card[];
  usedCards: Card[];
  usedBoardCards: Card[];
  allBestHoleCardCombos: Card[][];
}

function lowValue(card: Card): number {
  if (card.rank === "A") return 1;
  return RANK_VALUE[card.rank];
}

function evaluateFiveCardLow(cards: Card[]): {
  qualifies: boolean;
  values: number[];
  name: string;
} {
  const values = cards
    .map(lowValue)
    .sort((a, b) => b - a);

  const unique = [...new Set(values)];

  if (unique.length !== 5) {
    return {
      qualifies: false,
      values: [],
      name: "No Qualifying Low",
    };
  }

  if (values[0] > 8) {
    return {
      qualifies: false,
      values: [],
      name: "No Qualifying Low",
    };
  }

  const display = values
    .map((value) => (value === 1 ? "A" : String(value)))
    .join("-");

  return {
    qualifies: true,
    values,
    name: `${display} Low`,
  };
}

export function compareLowHands(
  a: LowEvaluation,
  b: LowEvaluation,
): number {
  if (a.qualifies && !b.qualifies) return 1;
  if (!a.qualifies && b.qualifies) return -1;
  if (!a.qualifies && !b.qualifies) return 0;

  for (let i = 0; i < 5; i++) {
    const av = a.values[i];
    const bv = b.values[i];

    if (av !== bv) {
      // Lower card is the better Low.
      return av < bv ? 1 : -1;
    }
  }

  return 0;
}

export function evaluateOmahaLow(
  holeCards: Card[],
  communityCards: Card[],
): LowEvaluation {
  const holeCombos = combinations(holeCards, 2);
  const boardCombos = combinations(communityCards, 3);

  let best: LowEvaluation | null = null;
  let allBestHoleCardCombos: Card[][] = [];

  for (const holeCombo of holeCombos) {
    let bestForThisHoleCombo: LowEvaluation | null = null;

    for (const boardCombo of boardCombos) {
      const low = evaluateFiveCardLow([
        ...holeCombo,
        ...boardCombo,
      ]);

      if (!low.qualifies) continue;

      const evaluation: LowEvaluation = {
        qualifies: true,
        values: low.values,
        name: low.name,
        cards: [...holeCombo, ...boardCombo],
        usedCards: holeCombo,
        usedBoardCards: boardCombo,
        allBestHoleCardCombos: [holeCombo],
      };

      if (
        !bestForThisHoleCombo ||
        compareLowHands(evaluation, bestForThisHoleCombo) > 0
      ) {
        bestForThisHoleCombo = evaluation;
      }
    }

    if (!bestForThisHoleCombo) continue;

    if (!best || compareLowHands(bestForThisHoleCombo, best) > 0) {
      best = bestForThisHoleCombo;
      allBestHoleCardCombos = [holeCombo];
    } else if (compareLowHands(bestForThisHoleCombo, best) === 0) {
      if (
        !allBestHoleCardCombos.some((combo) =>
          sameCardSet(combo, holeCombo),
        )
      ) {
        allBestHoleCardCombos.push(holeCombo);
      }
    }
  }

  if (!best) {
    return {
      qualifies: false,
      values: [],
      name: "No Qualifying Low",
      cards: [],
      usedCards: [],
      usedBoardCards: [],
      allBestHoleCardCombos: [],
    };
  }

  best.allBestHoleCardCombos = allBestHoleCardCombos;

  return best;
}

// ─────────────────────────────────────────────────────────────
// Winner helpers
// ─────────────────────────────────────────────────────────────

export function findHighWinners<T extends { high: HandEvaluation }>(
  players: T[],
): number[] {
  if (players.length === 0) return [];

  let winners = [0];

  for (let i = 1; i < players.length; i++) {
    const comparison = compareHighHands(
      players[i].high,
      players[winners[0]].high,
    );

    if (comparison > 0) {
      winners = [i];
    } else if (comparison === 0) {
      winners.push(i);
    }
  }

  return winners;
}

export function findLowWinners<T extends { low: LowEvaluation }>(
  players: T[],
): number[] {
  const qualifying = players
    .map((player, index) => ({ player, index }))
    .filter(({ player }) => player.low.qualifies);

  if (qualifying.length === 0) return [];

  let winners = [qualifying[0].index];

  for (let i = 1; i < qualifying.length; i++) {
    const candidateIndex = qualifying[i].index;

    const comparison = compareLowHands(
      players[candidateIndex].low,
      players[winners[0]].low,
    );

    if (comparison > 0) {
      winners = [candidateIndex];
    } else if (comparison === 0) {
      winners.push(candidateIndex);
    }
  }

  return winners;
}

export function isValidBestHoleSelection(
  selectedCards: Card[],
  validCombos: Card[][],
): boolean {
  if (selectedCards.length !== 2) return false;

  return validCombos.some((combo) =>
    sameCardSet(combo, selectedCards),
  );
}
