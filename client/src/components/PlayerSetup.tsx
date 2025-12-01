import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PlayerSetupProps {
  onStart: (playerCount: number, gameMode: 'holdem' | 'omaha' | 'omaha-hilo') => void;
}

export default function PlayerSetup({ onStart }: PlayerSetupProps) {
  const [selectedCount, setSelectedCount] = useState(2);
  const [gameMode, setGameMode] = useState<'holdem' | 'omaha' | 'omaha-hilo'>('holdem');
  
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-black to-neutral-950"></div>
      
      <Card className="w-full max-w-md bg-white/5 backdrop-blur-sm border-white/10 text-white relative z-10">
        <CardHeader>
          <CardTitle className="text-2xl text-center text-white font-light tracking-wide">Poker Training</CardTitle>
          <CardDescription className="text-center text-white/50 font-light text-sm">
            Select Mode & Players
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="text-xs font-light text-white/60 mb-3 tracking-wider">GAME MODE</div>
            <div className="grid grid-cols-1 gap-2">
              <Button
                data-testid="button-mode-holdem"
                onClick={() => setGameMode('holdem')}
                variant="ghost"
                className={`h-10 text-sm font-light border transition-all ${
                  gameMode === 'holdem' 
                    ? 'border-yellow-400 text-yellow-400 bg-yellow-400/10' 
                    : 'border-white/20 text-white/80 hover:border-white/40'
                }`}
              >
                Texas Hold'em
              </Button>
              <Button
                data-testid="button-mode-omaha"
                onClick={() => setGameMode('omaha')}
                variant="ghost"
                className={`h-10 text-sm font-light border transition-all ${
                  gameMode === 'omaha' 
                    ? 'border-yellow-400 text-yellow-400 bg-yellow-400/10' 
                    : 'border-white/20 text-white/80 hover:border-white/40'
                }`}
              >
                Omaha PLO
              </Button>
              <Button
                data-testid="button-mode-omaha-hilo"
                onClick={() => setGameMode('omaha-hilo')}
                variant="ghost"
                className={`h-10 text-sm font-light border transition-all ${
                  gameMode === 'omaha-hilo' 
                    ? 'border-yellow-400 text-yellow-400 bg-yellow-400/10' 
                    : 'border-white/20 text-white/80 hover:border-white/40'
                }`}
              >
                Omaha Hi-Lo
              </Button>
            </div>
          </div>
          
          <div>
            <div className="text-xs font-light text-white/60 mb-3 tracking-wider">PLAYERS</div>
            <div className="grid grid-cols-3 gap-3">
              {[2, 3, 4].map((count) => (
                <Button
                  key={count}
                  data-testid={`button-player-count-${count}`}
                  onClick={() => setSelectedCount(count)}
                  variant="ghost"
                  className={`h-16 text-xl font-light border transition-all ${
                    selectedCount === count 
                      ? 'border-yellow-400 text-yellow-400 bg-yellow-400/10' 
                      : 'border-white/20 text-white/80 hover:border-white/40'
                  }`}
                >
                  {count}
                </Button>
              ))}
            </div>
          </div>
          
          <Button
            data-testid="button-start-game"
            onClick={() => onStart(selectedCount, gameMode)}
            variant="ghost"
            className="w-full h-10 text-sm font-light tracking-wider border border-yellow-400 text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20"
          >
            START
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
