import { DetectiveGame, DetectiveGameProps } from '../detective/DetectiveGame';
export function PatternGame(props: Omit<DetectiveGameProps, 'gameId'>) {
  return <DetectiveGame {...props} gameId="patterns" />;
}
