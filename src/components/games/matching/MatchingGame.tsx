import { useEffect, useMemo, useState } from 'react';
import { Age, Difficulty, MatchingPair } from '../../../types';
import { getMatchingPairs } from '../../../services/questionService';
import { useSpeech } from '../../../hooks/useSpeech';
import { Button } from '../../common/Button';
import { shuffleArray } from '../../../utils/helpers';
import { gameInstructions } from '../../../data/gameInstructions';
import { calculateStars } from '../../../utils/helpers';

interface MatchingGameProps {
  age: Age;
  difficulty: Difficulty;
  voiceEnabled: boolean;
  onBack: () => void;
  onFinish: (score: number, total: number, stars: number) => void;
}

export function MatchingGame({ age, difficulty, voiceEnabled, onBack, onFinish }: MatchingGameProps) {
  const { speak, stop, getSpeakProps } = useSpeech(voiceEnabled);
  const pairs = useMemo(() => getMatchingPairs(age, difficulty), [age, difficulty]);
  const shuffledRight = useMemo(() => shuffleArray(pairs), [pairs]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [tries, setTries] = useState(0);
  const total = pairs.length;

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

  return (
    <section className="panel game-panel game-panel--matching">
      <div className="panel__header">
        <Button variant="ghost" onClick={onBack} {...getSpeakProps<HTMLButtonElement>('חזרה לתפריט המשחקים')}>חזרה לתפריט המשחקים</Button>
        <div className="score-pill">הצלחות: {matchedIds.length}</div>
      </div>

      <div className="question-card question-card--animated">
        <span className="question-card__tag">🧩 משחק התאמה</span>
        <h2>בחרו זוגות מתאימים</h2>
        <p>לחצו על פריט בצד אחד ועל ההתאמה שלו בצד השני.</p>

        <div className="matching-board">
          <div className="matching-column">
            {pairs.map((pair) => (
              <button key={pair.id} type="button" className={`matching-item ${selectedLeft === pair.id ? 'matching-item--active' : ''} ${matchedIds.includes(pair.id) ? 'matching-item--done' : ''}`} onClick={() => handleLeftSelect(pair)} {...getSpeakProps<HTMLButtonElement>(String(pair.left))}>{pair.left}</button>
            ))}
          </div>
          <div className="matching-column">
            {shuffledRight.map((pair) => (
              <button key={pair.id} type="button" className={`matching-item ${selectedRight === pair.id ? 'matching-item--active' : ''} ${matchedIds.includes(pair.id) ? 'matching-item--done' : ''}`} onClick={() => handleRightSelect(pair)} {...getSpeakProps<HTMLButtonElement>(pair.right)}>{pair.right}</button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
