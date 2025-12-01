import type { Card, Suit, Rank } from '@shared/schema';

const rankValues: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

export function createDeck(): Card[] {
  const suits: Suit[] = ['♠', '♥', '♦', '♣'];
  const ranks: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
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

export function evaluateHand(playerCards: Card[], communityCards: Card[]): {
  rank: number;
  name: string;
  usedCards: Card[];
  description: string;
  handScore: number[];
} {
  const allCards = [...playerCards, ...communityCards];
  
  let bestHand = { 
    rank: 0, 
    name: 'High Card', 
    usedCards: [] as Card[], 
    description: '',
    handScore: [0]
  };
  
  const combinations = getCombinations(allCards, 5);
  
  for (const combo of combinations) {
    const evaluation = evaluateFiveCards(combo);
    if (compareHands(evaluation.handScore, bestHand.handScore) > 0) {
      bestHand = evaluation;
    }
  }
  
  return bestHand;
}

export function evaluateOmahaHand(playerCards: Card[], communityCards: Card[]): {
  rank: number;
  name: string;
  usedCards: Card[];
  description: string;
  handScore: number[];
} {
  let bestHand = { 
    rank: 0, 
    name: 'High Card', 
    usedCards: [] as Card[], 
    description: '',
    handScore: [0]
  };
  
  const holeCombos = getCombinations(playerCards, 2);
  const boardCombos = getCombinations(communityCards, 3);
  
  for (const holeCombo of holeCombos) {
    for (const boardCombo of boardCombos) {
      const fiveCards = [...holeCombo, ...boardCombo];
      const evaluation = evaluateFiveCards(fiveCards);
      if (compareHands(evaluation.handScore, bestHand.handScore) > 0) {
        bestHand = evaluation;
      }
    }
  }
  
  return bestHand;
}

function getCombinations(arr: Card[], k: number): Card[][] {
  if (k === 0) return [[]];
  if (arr.length === 0) return [];
  
  const [first, ...rest] = arr;
  const withFirst = getCombinations(rest, k - 1).map(combo => [first, ...combo]);
  const withoutFirst = getCombinations(rest, k);
  
  return [...withFirst, ...withoutFirst];
}

function compareHands(score1: number[], score2: number[]): number {
  for (let i = 0; i < Math.max(score1.length, score2.length); i++) {
    const val1 = score1[i] || 0;
    const val2 = score2[i] || 0;
    if (val1 > val2) return 1;
    if (val1 < val2) return -1;
  }
  return 0;
}

function evaluateFiveCards(cards: Card[]): {
  rank: number;
  name: string;
  usedCards: Card[];
  description: string;
  handScore: number[];
} {
  const sorted = [...cards].sort((a, b) => rankValues[b.rank] - rankValues[a.rank]);
  
  const isFlush = cards.every(card => card.suit === cards[0].suit);
  const straightResult = checkStraight(sorted);
  const isStraight = straightResult.isStraight;
  
  const rankCounts = new Map<Rank, number>();
  sorted.forEach(card => {
    rankCounts.set(card.rank, (rankCounts.get(card.rank) || 0) + 1);
  });
  
  const countGroups = Array.from(rankCounts.entries())
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return rankValues[b[0]] - rankValues[a[0]];
    });
  
  const counts = countGroups.map(g => g[1]);
  const ranksInOrder = countGroups.map(g => rankValues[g[0]]);
  
  if (isFlush && isStraight) {
    return { 
      rank: 9, 
      name: 'Straight Flush', 
      usedCards: sorted,
      description: `${sorted[0].rank}-high Straight Flush`,
      handScore: [9, straightResult.highCard]
    };
  }
  
  if (counts[0] === 4) {
    return { 
      rank: 8, 
      name: 'Four of a Kind', 
      usedCards: sorted,
      description: 'Four of a Kind',
      handScore: [8, ranksInOrder[0], ranksInOrder[1]]
    };
  }
  
  if (counts[0] === 3 && counts[1] === 2) {
    return { 
      rank: 7, 
      name: 'Full House', 
      usedCards: sorted,
      description: 'Full House',
      handScore: [7, ranksInOrder[0], ranksInOrder[1]]
    };
  }
  
  if (isFlush) {
    return { 
      rank: 6, 
      name: 'Flush', 
      usedCards: sorted,
      description: `${sorted[0].rank}-high Flush`,
      handScore: [6, ...ranksInOrder]
    };
  }
  
  if (isStraight) {
    return { 
      rank: 5, 
      name: 'Straight', 
      usedCards: sorted,
      description: `${sorted[0].rank}-high Straight`,
      handScore: [5, straightResult.highCard]
    };
  }
  
  if (counts[0] === 3) {
    return { 
      rank: 4, 
      name: 'Three of a Kind', 
      usedCards: sorted,
      description: 'Three of a Kind',
      handScore: [4, ...ranksInOrder]
    };
  }
  
  if (counts[0] === 2 && counts[1] === 2) {
    return { 
      rank: 3, 
      name: 'Two Pair', 
      usedCards: sorted,
      description: 'Two Pair',
      handScore: [3, ...ranksInOrder]
    };
  }
  
  if (counts[0] === 2) {
    return { 
      rank: 2, 
      name: 'One Pair', 
      usedCards: sorted,
      description: 'One Pair',
      handScore: [2, ...ranksInOrder]
    };
  }
  
  return { 
    rank: 1, 
    name: 'High Card', 
    usedCards: sorted,
    description: `${sorted[0].rank}-high`,
    handScore: [1, ...ranksInOrder]
  };
}

function checkStraight(sortedCards: Card[]): { isStraight: boolean; highCard: number } {
  const values = sortedCards.map(c => rankValues[c.rank]);
  
  // Check A-2-3-4-5 (wheel)
  if (values[0] === 14 && values[1] === 5 && values[2] === 4 && values[3] === 3 && values[4] === 2) {
    return { isStraight: true, highCard: 5 };
  }
  
  // Check regular straight
  for (let i = 0; i < values.length - 1; i++) {
    if (values[i] - values[i + 1] !== 1) {
      return { isStraight: false, highCard: 0 };
    }
  }
  
  return { isStraight: true, highCard: values[0] };
}

export function determineWinners(evaluations: Array<{ 
  playerId: number; 
  rank: number; 
  usedCards: Card[];
  handScore?: number[];
}>): number[] {
  if (evaluations.length === 0) return [];
  
  let bestEval = evaluations[0];
  let winners = [evaluations[0].playerId];
  
  for (let i = 1; i < evaluations.length; i++) {
    const current = evaluations[i];
    const comparison = compareHands(
      current.handScore || [current.rank], 
      bestEval.handScore || [bestEval.rank]
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

export function evaluateLowHand(playerCards: Card[], communityCards: Card[]): {
  hasLow: boolean;
  lowScore?: number[];
  usedCards?: Card[];
} {
  let bestLow: { hasLow: boolean; lowScore?: number[]; usedCards?: Card[] } = { hasLow: false };
  
  const holeCombos = getCombinations(playerCards, 2);
  const boardCombos = getCombinations(communityCards, 3);
  
  for (const holeCombo of holeCombos) {
    for (const boardCombo of boardCombos) {
      const fiveCards = [...holeCombo, ...boardCombo];
      const lowEval = evaluateFiveCardsForLow(fiveCards);
      
      if (lowEval.hasLow) {
        if (!bestLow.hasLow || compareLowHands(lowEval.lowScore!, bestLow.lowScore!) < 0) {
          bestLow = lowEval;
        }
      }
    }
  }
  
  return bestLow;
}

function evaluateFiveCardsForLow(cards: Card[]): {
  hasLow: boolean;
  lowScore?: number[];
  usedCards?: Card[];
} {
  const lowValues = cards.map(c => {
    const val = rankValues[c.rank];
    // Ace counts as 1 for low
    return val === 14 ? 1 : val;
  });
  
  // All cards must be 8 or below
  if (lowValues.some(v => v > 8)) {
    return { hasLow: false };
  }
  
  // Must have 5 different ranks (no pairs)
  // This is the key rule - pairs, trips, etc. disqualify a low hand
  const uniqueValues = new Set(lowValues);
  if (uniqueValues.size !== 5) {
    return { hasLow: false };
  }
  
  // Sort from highest to lowest for comparison (lower is better)
  const sortedValues = [...lowValues].sort((a, b) => b - a);
  
  // Note: Straights and flushes do NOT disqualify a low hand in Hi-Lo
  // A-2-3-4-5 (wheel) is the best possible low hand even though it's a straight
  // Flushes are also ignored for low hand qualification
  
  return {
    hasLow: true,
    lowScore: sortedValues,
    usedCards: cards
  };
}

function compareLowHands(score1: number[], score2: number[]): number {
  // Compare from highest card to lowest (scores are sorted high to low)
  // Lower values are better for low hands
  for (let i = 0; i < 5; i++) {
    if (score1[i] < score2[i]) return -1; // score1 is better (lower)
    if (score1[i] > score2[i]) return 1;  // score2 is better (lower)
  }
  return 0; // tie
}

export function determineLowWinners(lowEvaluations: Array<{
  playerId: number;
  hasLow: boolean;
  lowScore?: number[];
  usedCards?: Card[];
}>): number[] {
  const validLows = lowEvaluations.filter(e => e.hasLow);
  
  if (validLows.length === 0) return [];
  
  let bestLow = validLows[0];
  let winners = [validLows[0].playerId];
  
  for (let i = 1; i < validLows.length; i++) {
    const current = validLows[i];
    const comparison = compareLowHands(current.lowScore!, bestLow.lowScore!);
    
    if (comparison < 0) {
      bestLow = current;
      winners = [current.playerId];
    } else if (comparison === 0) {
      winners.push(current.playerId);
    }
  }
  
  return winners;
}
