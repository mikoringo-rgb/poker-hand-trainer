import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RotateCcw, ChevronLeft, Check } from 'lucide-react';
import PlayerHand from './PlayerHand';
import CommunityCards from './CommunityCards';
import Timer from './Timer';
import FeedbackBanner from './FeedbackBanner';
import { createDeck, evaluateHand, evaluateOmahaHand, determineWinners, evaluateLowHand, determineLowWinners } from '@/lib/poker-logic';
import type { Card } from '@shared/schema';

interface GameBoardProps {
  playerCount: number;
  gameMode: 'holdem' | 'omaha' | 'omaha-hilo';
  onBack: () => void;
}

export default function GameBoard({ playerCount, gameMode, onBack }: GameBoardProps) {
  const [playerHands, setPlayerHands] = useState<Card[][]>([]);
  const [communityCards, setCommunityCards] = useState<Card[]>([]);
  const [selectedWinners, setSelectedWinners] = useState<number[]>([]);
  const [selectedHighWinners, setSelectedHighWinners] = useState<number[]>([]);
  const [selectedLowWinners, setSelectedLowWinners] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; message: string; time?: number } | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [evaluations, setEvaluations] = useState<Array<{
    playerId: number;
    rank: number;
    name: string;
    usedCards: Card[];
    handScore?: number[];
  }>>([]);
  const [lowEvaluations, setLowEvaluations] = useState<Array<{
    playerId: number;
    hasLow: boolean;
    lowScore?: number[];
    usedCards?: Card[];
  }>>([]);
  
  const dealCards = () => {
    const deck = createDeck();
    const hands: Card[][] = [];
    let cardIndex = 0;
    
    const cardsPerPlayer = (gameMode === 'omaha' || gameMode === 'omaha-hilo') ? 4 : 2;
    
    for (let i = 0; i < playerCount; i++) {
      const hand = [];
      for (let j = 0; j < cardsPerPlayer; j++) {
        hand.push(deck[cardIndex++]);
      }
      hands.push(hand);
    }
    
    const board = deck.slice(cardIndex, cardIndex + 5);
    
    setPlayerHands(hands);
    setCommunityCards(board);
    setSelectedWinners([]);
    setSelectedHighWinners([]);
    setSelectedLowWinners([]);
    setShowResult(false);
    setFeedback(null);
    setCurrentTime(0);
    setTimerRunning(true);
    
    const evals = hands.map((hand, idx) => {
      const evaluation = (gameMode === 'omaha' || gameMode === 'omaha-hilo')
        ? evaluateOmahaHand(hand, board)
        : evaluateHand(hand, board);
      return {
        playerId: idx + 1,
        rank: evaluation.rank,
        name: evaluation.name,
        usedCards: evaluation.usedCards,
        handScore: evaluation.handScore
      };
    });
    setEvaluations(evals);
    
    if (gameMode === 'omaha-hilo') {
      const lowEvals = hands.map((hand, idx) => {
        const lowEval = evaluateLowHand(hand, board);
        return {
          playerId: idx + 1,
          ...lowEval
        };
      });
      setLowEvaluations(lowEvals);
    }
  };
  
  useEffect(() => {
    dealCards();
  }, [playerCount]);
  
  const handleSelectWinner = (playerId: number) => {
    if (showResult) return;
    if (gameMode === 'omaha-hilo') return;
    
    setSelectedWinners(prev => {
      if (prev.includes(playerId)) {
        return prev.filter(id => id !== playerId);
      } else {
        return [...prev, playerId];
      }
    });
  };
  
  const handleSelectHighWinner = (playerId: number) => {
    if (showResult) return;
    setSelectedHighWinners(prev => {
      if (prev.includes(playerId)) {
        return prev.filter(id => id !== playerId);
      } else {
        return [...prev, playerId];
      }
    });
  };
  
  const handleSelectLowWinner = (playerId: number) => {
    if (showResult) return;
    setSelectedLowWinners(prev => {
      if (prev.includes(playerId)) {
        return prev.filter(id => id !== playerId);
      } else {
        return [...prev, playerId];
      }
    });
  };
  
  const handleSubmit = () => {
    if (gameMode === 'omaha-hilo') {
      if (selectedHighWinners.length === 0 && selectedLowWinners.length === 0) return;
      
      setTimerRunning(false);
      setShowResult(true);
      
      const actualHighWinners = determineWinners(evaluations);
      const actualLowWinners = determineLowWinners(lowEvaluations);
      
      const highCorrect = 
        selectedHighWinners.length === actualHighWinners.length &&
        selectedHighWinners.every(id => actualHighWinners.includes(id));
        
      const lowCorrect = actualLowWinners.length === 0 
        ? selectedLowWinners.length === 0
        : (selectedLowWinners.length === actualLowWinners.length &&
           selectedLowWinners.every(id => actualLowWinners.includes(id)));
      
      const isCorrect = highCorrect && lowCorrect;
      
      setFeedback({
        isCorrect,
        message: isCorrect ? '答對了！' : '答錯了，再試一次',
        time: currentTime
      });
    } else {
      if (selectedWinners.length === 0) return;
      
      setTimerRunning(false);
      setShowResult(true);
      
      const actualWinners = determineWinners(evaluations);
      
      const isCorrect = 
        selectedWinners.length === actualWinners.length &&
        selectedWinners.every(id => actualWinners.includes(id));
      
      setFeedback({
        isCorrect,
        message: isCorrect ? '答對了！' : '答錯了，再試一次',
        time: currentTime
      });
    }
  };
  
  const winners = showResult ? determineWinners(evaluations) : [];
  const lowWinners = showResult && gameMode === 'omaha-hilo' ? determineLowWinners(lowEvaluations) : [];
  
  return (
    <div className="min-h-screen bg-black relative">
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-black to-neutral-950"></div>
      
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-4">
        <Button
          data-testid="button-back"
          onClick={onBack}
          size="icon"
          variant="secondary"
          className="hover-elevate active-elevate-2 rounded-full"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        
        <div className="w-20"></div>
        
        {showResult ? (
          <Button
            data-testid="button-new-game"
            onClick={dealCards}
            size="icon"
            variant="secondary"
            className="hover-elevate active-elevate-2 rounded-full"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
        ) : (gameMode === 'omaha-hilo' ? (selectedHighWinners.length > 0 || selectedLowWinners.length > 0) : selectedWinners.length > 0) ? (
          <Button
            data-testid="button-submit"
            onClick={handleSubmit}
            size="icon"
            variant="secondary"
            className="hover-elevate active-elevate-2 rounded-full"
          >
            <Check className="w-5 h-5" />
          </Button>
        ) : (
          <div className="w-9"></div>
        )}
      </div>
      
      {/* 计时器 - 中央上方 */}
      {!showResult && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20">
          <Timer
            isRunning={timerRunning}
            onTimeUpdate={(time) => setCurrentTime(time)}
          />
        </div>
      )}
      
      {/* Game Area - 使用固定尺寸容器和 Grid 布局 */}
      <div className="relative z-10 flex items-center justify-center py-2 sm:py-4" style={{ minHeight: 'calc(100dvh - 100px)' }}>
        <div className="w-full max-w-4xl px-2 sm:px-4">
          <div className="grid grid-rows-[auto_auto_auto] sm:grid-rows-[auto_1fr_auto] gap-2 sm:gap-4">
            {/* 上排玩家 */}
            <div className="flex justify-between items-start gap-2 sm:gap-4">
              {/* 玩家1 - 左上 */}
              {playerHands[0] && (
                <div className="max-w-[140px] sm:max-w-[180px]">
                  <PlayerHand
                    playerId={1}
                    cards={playerHands[0]}
                    onSelectWinner={gameMode === 'omaha-hilo' ? undefined : () => handleSelectWinner(1)}
                    isSelected={selectedWinners.includes(1)}
                    onSelectHighWinner={gameMode === 'omaha-hilo' ? () => handleSelectHighWinner(1) : undefined}
                    onSelectLowWinner={gameMode === 'omaha-hilo' ? () => handleSelectLowWinner(1) : undefined}
                    isHighSelected={selectedHighWinners.includes(1)}
                    isLowSelected={selectedLowWinners.includes(1)}
                    usedCards={evaluations[0]?.usedCards || []}
                    lowUsedCards={lowEvaluations[0]?.usedCards || []}
                    showResult={showResult}
                    isWinner={winners.includes(1)}
                    isLowWinner={lowWinners.includes(1)}
                    handName={evaluations[0]?.name}
                    disabled={showResult}
                    isHiLo={gameMode === 'omaha-hilo'}
                  />
                </div>
              )}
              
              {/* 玩家2 - 右上 */}
              {playerHands[1] && (
                <div className="max-w-[140px] sm:max-w-[180px]">
                  <PlayerHand
                    playerId={2}
                    cards={playerHands[1]}
                    onSelectWinner={gameMode === 'omaha-hilo' ? undefined : () => handleSelectWinner(2)}
                    isSelected={selectedWinners.includes(2)}
                    onSelectHighWinner={gameMode === 'omaha-hilo' ? () => handleSelectHighWinner(2) : undefined}
                    onSelectLowWinner={gameMode === 'omaha-hilo' ? () => handleSelectLowWinner(2) : undefined}
                    isHighSelected={selectedHighWinners.includes(2)}
                    isLowSelected={selectedLowWinners.includes(2)}
                    usedCards={evaluations[1]?.usedCards || []}
                    lowUsedCards={lowEvaluations[1]?.usedCards || []}
                    showResult={showResult}
                    isWinner={winners.includes(2)}
                    isLowWinner={lowWinners.includes(2)}
                    handName={evaluations[1]?.name}
                    disabled={showResult}
                    isHiLo={gameMode === 'omaha-hilo'}
                  />
                </div>
              )}
            </div>
            
            {/* 中央 - 公牌 */}
            <div className="flex items-center justify-center">
              <CommunityCards
                cards={communityCards}
                usedCards={showResult && winners.length > 0 ? 
                  evaluations.find(e => winners.includes(e.playerId))?.usedCards || [] : []}
                lowUsedCards={showResult && lowWinners.length > 0 ?
                  lowEvaluations.find(e => lowWinners.includes(e.playerId))?.usedCards || [] : []}
                showResult={showResult}
                isHiLo={gameMode === 'omaha-hilo'}
              />
            </div>
            
            {/* 下排玩家 */}
            <div className="flex justify-between items-end gap-2 sm:gap-4">
              {/* 玩家3 - 左下 */}
              {playerHands[2] && (
                <div className="max-w-[140px] sm:max-w-[180px]">
                  <PlayerHand
                    playerId={3}
                    cards={playerHands[2]}
                    onSelectWinner={gameMode === 'omaha-hilo' ? undefined : () => handleSelectWinner(3)}
                    isSelected={selectedWinners.includes(3)}
                    onSelectHighWinner={gameMode === 'omaha-hilo' ? () => handleSelectHighWinner(3) : undefined}
                    onSelectLowWinner={gameMode === 'omaha-hilo' ? () => handleSelectLowWinner(3) : undefined}
                    isHighSelected={selectedHighWinners.includes(3)}
                    isLowSelected={selectedLowWinners.includes(3)}
                    usedCards={evaluations[2]?.usedCards || []}
                    lowUsedCards={lowEvaluations[2]?.usedCards || []}
                    showResult={showResult}
                    isWinner={winners.includes(3)}
                    isLowWinner={lowWinners.includes(3)}
                    handName={evaluations[2]?.name}
                    disabled={showResult}
                    isHiLo={gameMode === 'omaha-hilo'}
                  />
                </div>
              )}
              
              {/* 玩家4 - 右下 */}
              {playerHands[3] && (
                <div className="max-w-[140px] sm:max-w-[180px]">
                  <PlayerHand
                    playerId={4}
                    cards={playerHands[3]}
                    onSelectWinner={gameMode === 'omaha-hilo' ? undefined : () => handleSelectWinner(4)}
                    isSelected={selectedWinners.includes(4)}
                    onSelectHighWinner={gameMode === 'omaha-hilo' ? () => handleSelectHighWinner(4) : undefined}
                    onSelectLowWinner={gameMode === 'omaha-hilo' ? () => handleSelectLowWinner(4) : undefined}
                    isHighSelected={selectedHighWinners.includes(4)}
                    isLowSelected={selectedLowWinners.includes(4)}
                    usedCards={evaluations[3]?.usedCards || []}
                    lowUsedCards={lowEvaluations[3]?.usedCards || []}
                    showResult={showResult}
                    isWinner={winners.includes(4)}
                    isLowWinner={lowWinners.includes(4)}
                    handName={evaluations[3]?.name}
                    disabled={showResult}
                    isHiLo={gameMode === 'omaha-hilo'}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {feedback && (
        <FeedbackBanner
          isCorrect={feedback.isCorrect}
          message={feedback.message}
          time={feedback.time}
          onClose={() => setFeedback(null)}
          onNewGame={dealCards}
          onBack={onBack}
        />
      )}
    </div>
  );
}
