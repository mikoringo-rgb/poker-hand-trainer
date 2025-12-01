import { Check, X, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FeedbackBannerProps {
  isCorrect: boolean;
  message: string;
  time?: number;
  onClose: () => void;
  onNewGame?: () => void;
}

interface FeedbackBannerPropsExtended extends FeedbackBannerProps {
  onBack?: () => void;
}

export default function FeedbackBanner({ isCorrect, message, time, onClose, onNewGame, onBack }: FeedbackBannerPropsExtended) {
  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <div
        data-testid={`feedback-${isCorrect ? 'correct' : 'incorrect'}`}
        className={cn(
          "pointer-events-auto rounded-full backdrop-blur-md border",
          "px-6 py-2",
          "flex items-center gap-2 animate-in zoom-in-95",
          isCorrect 
            ? "bg-green-500/20 text-green-400 border-green-400/30" 
            : "bg-red-500/20 text-red-400 border-red-400/30"
        )}
      >
        {/* 圖示 */}
        {isCorrect ? (
          <Check className="w-5 h-5" />
        ) : (
          <X className="w-5 h-5" />
        )}
        
        {/* Message */}
        <div className="flex items-center gap-2">
          <span className="font-light text-base whitespace-nowrap">
            {isCorrect ? 'Correct' : 'Incorrect'}
          </span>
          {isCorrect && time !== undefined && (
            <span className="text-sm opacity-70 whitespace-nowrap font-light">
              {time.toFixed(1)}s
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
