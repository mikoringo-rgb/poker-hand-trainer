import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface TimerProps {
  isRunning: boolean;
  onStop?: (time: number) => void;
  onTimeUpdate?: (time: number) => void;
  className?: string;
}

export default function Timer({ isRunning, onStop, onTimeUpdate, className }: TimerProps) {
  const [seconds, setSeconds] = useState(0);
  
  useEffect(() => {
    if (!isRunning) {
      if (seconds > 0 && onStop) {
        onStop(seconds);
      }
      return;
    }
    
    const interval = setInterval(() => {
      setSeconds(prev => {
        const newTime = prev + 0.1;
        if (onTimeUpdate) {
          onTimeUpdate(newTime);
        }
        return newTime;
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, [isRunning, onStop]);
  
  useEffect(() => {
    if (!isRunning) {
      setSeconds(0);
    }
  }, [isRunning]);
  
  return (
    <div
      data-testid="text-timer"
      className={cn(
        "bg-white/5 backdrop-blur-sm px-6 py-2 rounded-full border border-white/10",
        "font-mono text-2xl text-white/70 font-light tracking-wider",
        className
      )}
    >
      {seconds.toFixed(1)}
    </div>
  );
}
