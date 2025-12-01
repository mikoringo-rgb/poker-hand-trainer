import { useState } from 'react';
import FeedbackBanner from '../FeedbackBanner';
import { Button } from '@/components/ui/button';

export default function FeedbackBannerExample() {
  const [show, setShow] = useState<'correct' | 'incorrect' | null>(null);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-800 to-green-900 flex items-center justify-center gap-4">
      {show && (
        <FeedbackBanner
          isCorrect={show === 'correct'}
          message={show === 'correct' ? '答對了！' : '答錯了，再試一次'}
          onClose={() => setShow(null)}
        />
      )}
      <Button onClick={() => setShow('correct')}>Show Correct</Button>
      <Button onClick={() => setShow('incorrect')}>Show Incorrect</Button>
    </div>
  );
}
