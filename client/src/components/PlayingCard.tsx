import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type GameMode = 'holdem' | 'omaha' | 'big-o';

interface PlayerSetupProps {
  onStart: (playerCount: number, gameMode: GameMode) => void;
}

export default function PlayerSetup({ onStart }: PlayerSetupProps) {
  const [playerCount, setPlayerCount] = useState(4);
  const [gameMode, setGameMode] = useState<GameMode>('big-o');

  const modes: {
    id: GameMode;
    title: string;
    description: string;
  }[] = [
    {
      id: 'holdem',
      title: "Texas Hold'em",
      description: '2 hole cards',
    },
    {
      id: 'omaha',
      title: 'Omaha',
      description: '4 hole cards · Exactly 2 + 3',
    },
    {
      id: 'big-o',
      title: 'Big O',
      description: '5 hole cards · Hi-Lo 8 or Better',
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            Poker Hand Trainer
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="text-sm font-medium">
              Game
            </div>

            <div className="grid grid-cols-3 gap-2">
              {modes.map((mode) => (
                <Button
                  key={mode.id}
                  type="button"
                  variant={
                    gameMode === mode.id
                      ? 'default'
                      : 'outline'
                  }
                  className="h-auto min-h-20 flex flex-col gap-1 px-2 py-3"
                  onClick={() => setGameMode(mode.id)}
                >
                  <span className="font-semibold">
                    {mode.title}
                  </span>

                  <span className="text-[10px] leading-tight opacity-80 whitespace-normal text-center">
                    {mode.description}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">
              Players
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[2, 3, 4].map((count) => (
                <Button
                  key={count}
                  type="button"
                  variant={
                    playerCount === count
                      ? 'default'
                      : 'outline'
                  }
                  onClick={() => setPlayerCount(count)}
                >
                  {count}
                </Button>
              ))}
            </div>
          </div>

          <Button
            type="button"
            className="w-full"
            size="lg"
            onClick={() => onStart(playerCount, gameMode)}
          >
            Start Training
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
