import { DetectiveGame, DetectiveGameProps } from '../detective/DetectiveGame';
export function MemoryGame(props: Omit<DetectiveGameProps, 'gameId'>) {
  return <DetectiveGame {...props} gameId="memory" />;
}
