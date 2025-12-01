import { z } from "zod";

export const suits = ['♠', '♥', '♦', '♣'] as const;
export const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;

export type Suit = typeof suits[number];
export type Rank = typeof ranks[number];

export interface Card {
  suit: Suit;
  rank: Rank;
}

export interface PlayerHand {
  playerId: number;
  cards: Card[];
}

export interface GameState {
  playerCount: number;
  playerHands: PlayerHand[];
  communityCards: Card[];
  deck: Card[];
}

export interface HandEvaluation {
  playerId: number;
  handRank: number;
  handName: string;
  usedCards: Card[];
  description: string;
}
