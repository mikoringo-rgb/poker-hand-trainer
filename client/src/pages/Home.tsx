import { useState } from 'react';
import PlayerSetup from '@/components/PlayerSetup';
import GameBoard from '@/components/GameBoard';

export default function Home() {
  const [gameStarted, setGameStarted] = useState(false);
  const [playerCount, setPlayerCount] = useState(2);
  const [gameMode, setGameMode] = useState<'holdem' | 'omaha' | 'omaha-hilo'>('holdem');
  
  const handleStart = (count: number, mode: 'holdem' | 'omaha' | 'omaha-hilo') => {
    setPlayerCount(count);
    setGameMode(mode);
    setGameStarted(true);
  };
  
  const handleBack = () => {
    setGameStarted(false);
  };
  
  if (gameStarted) {
    return <GameBoard playerCount={playerCount} gameMode={gameMode} onBack={handleBack} />;
  }
  
  return <PlayerSetup onStart={handleStart} />;
}
