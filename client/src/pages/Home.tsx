import { useState } from 'react';
import PlayerSetup from '@/components/PlayerSetup';
import GameBoard from '@/components/GameBoard';

type GameMode = 'holdem' | 'omaha' | 'big-o';

export default function Home() {
  const [gameStarted, setGameStarted] = useState(false);
  const [playerCount, setPlayerCount] = useState(2);
  const [gameMode, setGameMode] = useState<GameMode>('holdem');

  const handleStart = (count: number, mode: GameMode) => {
    setPlayerCount(count);
    setGameMode(mode);
    setGameStarted(true);
  };

  const handleBack = () => {
    setGameStarted(false);
  };

  if (gameStarted) {
    return (
      <GameBoard
        playerCount={playerCount}
        gameMode={gameMode}
        onBack={handleBack}
      />
    );
  }

  return <PlayerSetup onStart={handleStart} />;
}
