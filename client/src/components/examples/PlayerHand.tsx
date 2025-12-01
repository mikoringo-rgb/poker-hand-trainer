import PlayerHand from '../PlayerHand';

export default function PlayerHandExample() {
  return (
    <div className="flex gap-8 p-8 bg-gradient-to-br from-green-800 to-green-900">
      <PlayerHand
        playerId={1}
        cards={[
          { suit: '♠', rank: 'A' },
          { suit: '♥', rank: 'K' }
        ]}
        onSelectWinner={() => console.log('Winner selected')}
      />
      <PlayerHand
        playerId={2}
        cards={[
          { suit: '♦', rank: 'Q' },
          { suit: '♣', rank: 'J' }
        ]}
        isSelected
        onSelectWinner={() => console.log('Winner selected')}
      />
      <PlayerHand
        playerId={3}
        cards={[
          { suit: '♠', rank: '10' },
          { suit: '♥', rank: '9' }
        ]}
        showResult
        isWinner
        handName="同花順"
        usedCards={[{ suit: '♠', rank: '10' }]}
      />
    </div>
  );
}
