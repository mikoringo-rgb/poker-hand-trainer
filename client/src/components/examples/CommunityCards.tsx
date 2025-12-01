import CommunityCards from '../CommunityCards';

export default function CommunityCardsExample() {
  return (
    <div className="p-8 bg-gradient-to-br from-green-800 to-green-900">
      <CommunityCards
        cards={[
          { suit: '♠', rank: 'A' },
          { suit: '♥', rank: 'K' },
          { suit: '♦', rank: 'Q' },
          { suit: '♣', rank: 'J' },
          { suit: '♠', rank: '10' }
        ]}
        showResult
        usedCards={[
          { suit: '♠', rank: 'A' },
          { suit: '♥', rank: 'K' },
          { suit: '♦', rank: 'Q' }
        ]}
      />
    </div>
  );
}
