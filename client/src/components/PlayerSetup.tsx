// client/src/components/PlayerSetup.tsx

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

type GameMode = 'holdem' | 'omaha' | 'big-o';

interface PlayerSetupProps {
  onStartGame: (
    playerCount: number,
    gameMode: GameMode
  ) => void;
}

export default function PlayerSetup({
  onStartGame,
}: PlayerSetupProps) {
  const [playerCount, setPlayerCount] = useState(4);
  const [gameMode, setGameMode] =
    useState<GameMode>('big-o');

  const gameModes: {
    value: GameMode;
    title: string;
    description: string;
  }[] = [
    {
      value: 'holdem',
      title: "Texas Hold'em",
      description: '2 hole cards',
    },
    {
      value: 'omaha',
      title: 'Omaha',
      description: '4 hole cards · Exactly 2 + 3',
    },
    {
      value: 'big-o',
      title: 'Big O',
      description: '5 hole cards · Hi-Lo 8 or Better',
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center text-3xl font-bold">
            Poker Hand Trainer
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <div className="text-lg font-semibold mb-3">
              Game
            </div>

            <div className="flex flex-col gap-3">
              {gameModes.map((mode) => {
                const isSelected =
                  gameMode === mode.value;

                return (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() =>
                      setGameMode(mode.value)
                    }
                    className={[
                      'w-full rounded-xl border px-4 py-4 text-left transition-all',
                      'flex items-center justify-between gap-4',
                      isSelected
                        ? 'bg-green-600 border-green-700 text-white'
                        : 'bg-white border-slate-300 text-slate-900',
                    ].join(' ')}
                  >
                    <span className="text-lg font-semibold whitespace-nowrap">
                      {mode.title}
                    </span>

                    <span
                      className={[
                        'text-sm text-right',
                        isSelected
                          ? 'text-white/85'
                          : 'text-slate-500',
                      ].join(' ')}
                    >
                      {mode.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-lg font-semibold mb-3">
              Players
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[2, 3, 4].map((count) => {
                const isSelected =
                  playerCount === count;

                return (
                  <button
                    key={count}
                    type="button"
                    onClick={() =>
                      setPlayerCount(count)
                    }
                    className={[
                      'rounded-xl border py-4 text-xl font-medium transition-all',
                      isSelected
                        ? 'bg-green-600 border-green-700 text-white'
                        : 'bg-white border-slate-300 text-slate-900',
                    ].join(' ')}
                  >
                    {count}
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            type="button"
            onClick={() =>
              onStartGame(
                playerCount,
                gameMode
              )
            }
            className="w-full h-14 text-xl font-semibold bg-green-600 hover:bg-green-700"
          >
            Start Training
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
