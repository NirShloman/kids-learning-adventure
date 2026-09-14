import { DetectiveGame, DetectiveGameProps } from '../detective/DetectiveGame';
export function MatchingGame(props: Omit<DetectiveGameProps, 'gameId'>) {
  return <DetectiveGame {...props} gameId="matching" />;
}
