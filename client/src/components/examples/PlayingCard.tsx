import PlayingCard from '../PlayingCard';

export default function PlayingCardExample() {
  return (
    <div className="flex gap-4 p-8 bg-gradient-to-br from-green-800 to-green-900">
      <PlayingCard card={{ suit: '♠', rank: 'A' }} />
      <PlayingCard card={{ suit: '♥', rank: 'K' }} />
      <PlayingCard card={{ suit: '♦', rank: 'Q' }} dimmed />
      <PlayingCard card={{ suit: '♣', rank: 'J' }} highlighted />
    </div>
  );
}
