import PlayerSetup from '../PlayerSetup';

export default function PlayerSetupExample() {
  return <PlayerSetup onStart={(count) => console.log('Starting game with', count, 'players')} />;
}
