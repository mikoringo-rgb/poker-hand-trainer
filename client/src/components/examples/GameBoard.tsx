import GameBoard from '../GameBoard';

export default function GameBoardExample() {
  return <GameBoard playerCount={4} onBack={() => console.log('Back clicked')} />;
}
