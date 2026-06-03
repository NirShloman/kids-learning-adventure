import { useEffect, useMemo, useState } from 'react';
import { Age, Difficulty, MatchingPair } from '../../../types';
import { getMatchingPairs } from '../../../services/questionService';
import { useSpeech } from '../../../hooks/useSpeech';
import { Button } from '../../common/Button';
import { shuffleArray, calculateStars } from '../../../utils/helpers';
import { gameInstructions } from '../../../data/gameInstructions';
import { GameWorld, GameWorldMessage } from '../GameWorld';
import { GameImage } from '../../common/GameImage';

interface MatchingGameProps {
  age: Age;
  difficulty: Difficulty;
  voiceEnabled: boolean;
  onBack: () => void;
  onFinish: (score: number, total: number, stars: number) => void;
}

export function MatchingGame({ age, difficulty, voiceEnabled, onBack, onFinish }: MatchingGameProps) {
  const { speak, stop, getSpeakProps } = useSpeech(voiceEnabled);
  const [pairs, setPairs] = useState<MatchingPair[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const shuffledRight = useMemo(() => shuffleArray(pairs), [pairs]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [tries, setTries] = useState(0);
  const total = pairs.length;

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    setSelectedLeft(null);
    setSelectedRight(null);
    setMatchedIds([]);
    setTries(0);

    getMatchingPairs(age, difficulty)
      .then((items) => {
        if (!isActive) return;
        setPairs(items);
        setIsLoading(false);
      })
      .catch(() => {
        if (!isActive) return;
        setPairs([]);
        setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [age, difficulty]);

  useEffect(() => {
    speak(gameInstructions.matching.intro);
    return stop;
  }, [speak, stop]);

  function checkMatch(leftId: string | null, rightId: string | null) {
    if (!leftId || !rightId) return;
    setTries((previous) => previous + 1);

    if (leftId === rightId) {
      const updated = [...matchedIds, leftId];
      setMatchedIds(updated);
      setSelectedLeft(null);
      setSelectedRight(null);
      speak('כל הכבוד, מצאתם התאמה!');
      if (updated.length === total) {
        const stars = calculateStars(updated.length, total, {
          attempts: tries + 1,
          idealAttempts: total,
          forgivingExtraAttempts: Math.ceil(total * 0.75)
        });
        onFinish(updated.length, total, stars);
      }
      return;
    }

    speak('כמעט, נסו שוב');
    window.setTimeout(() => {
      setSelectedLeft(null);
      setSelectedRight(null);
    }, 600);
  }

  function handleLeftSelect(pair: MatchingPair) {
    if (matchedIds.includes(pair.id)) return;
    speak(String(pair.left));
    setSelectedLeft(pair.id);
    checkMatch(pair.id, selectedRight);
  }

  function handleRightSelect(pair: MatchingPair) {
    if (matchedIds.includes(pair.id)) return;
    speak(pair.right);
    setSelectedRight(pair.id);
    checkMatch(selectedLeft, pair.id);
  }

  if (isLoading) {
    return (
      <GameWorld gameId="matching" scoreLabel="התאמות" scoreValue={matchedIds.length} status="מכינים זוגות" onBack={onBack} backSpeakProps={getSpeakProps<HTMLButtonElement>('חזרה לתפריט המשחקים')}>
        <GameWorldMessage title="טוענים זוגות..." />
      </GameWorld>
    );
  }

  if (!pairs.length) {
    return (
      <GameWorld gameId="matching" onBack={onBack} backSpeakProps={getSpeakProps<HTMLButtonElement>('חזרה לתפריט המשחקים')}>
        <GameWorldMessage title="אין זוגות זמינים כרגע">
          <Button onClick={onBack}>חזרה</Button>
        </GameWorldMessage>
      </GameWorld>
    );
  }

  return (
    <GameWorld gameId="matching" scoreLabel="התאמות" scoreValue={matchedIds.length} status={`${matchedIds.length}/${total}`} onBack={onBack} backSpeakProps={getSpeakProps<HTMLButtonElement>('חזרה לתפריט המשחקים')}>
      <div className="game-play-card game-play-card--matching">
        <span className="question-card__tag">משחק התאמה</span>
        <h2>בחרו זוגות מתאימים</h2>
        <p>לחצו על פריט בצד אחד ועל ההתאמה שלו בצד השני.</p>

        <div className="matching-board game-matching-board">
          <div className="matching-column">
            {pairs.map((pair) => (
              <button
                key={pair.id}
                type="button"
                className={`matching-item game-answer-token ${selectedLeft === pair.id ? 'matching-item--active' : ''} ${matchedIds.includes(pair.id) ? 'matching-item--done' : ''}`}
                data-testid="matching-left"
                data-pair-id={pair.id}
                onClick={() => handleLeftSelect(pair)}
                {...getSpeakProps<HTMLButtonElement>(String(pair.left))}
              >
                {pair.leftImageAssetId ? <GameImage assetId={pair.leftImageAssetId} alt="" decorative className="game-token__image" /> : null}
                <span>{pair.left}</span>
              </button>
            ))}
          </div>
          <div className="game-match-lines" aria-hidden="true">
            {pairs.map((pair) => <span key={pair.id} className={matchedIds.includes(pair.id) ? 'game-match-lines__line game-match-lines__line--done' : 'game-match-lines__line'} />)}
          </div>
          <div className="matching-column">
            {shuffledRight.map((pair) => (
              <button
                key={pair.id}
                type="button"
                className={`matching-item game-answer-token ${selectedRight === pair.id ? 'matching-item--active' : ''} ${matchedIds.includes(pair.id) ? 'matching-item--done' : ''}`}
                data-testid="matching-right"
                data-pair-id={pair.id}
                onClick={() => handleRightSelect(pair)}
                {...getSpeakProps<HTMLButtonElement>(pair.right)}
              >
                {pair.rightImageAssetId ? <GameImage assetId={pair.rightImageAssetId} alt="" decorative className="game-token__image" /> : null}
                <span>{pair.right}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </GameWorld>
  );
}
