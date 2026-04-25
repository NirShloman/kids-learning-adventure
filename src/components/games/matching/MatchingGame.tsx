import { useMemo, useState } from 'react';
import { Age, Difficulty, MatchingPair } from '../../../types';
import { getMatchingPairs } from '../../../services/questionService';
import { useSpeech } from '../../../hooks/useSpeech';
import { Button } from '../../common/Button';
import { shuffleArray } from '../../../utils/helpers';

interface MatchingGameProps {
  age: Age;
  difficulty: Difficulty;
  voiceEnabled: boolean;
  onBack: () => void;
  onFinish: (score: number, total: number, stars: number) => void;
}

export function MatchingGame({ age, difficulty, voiceEnabled, onBack, onFinish }: MatchingGameProps) {
  const { speak } = useSpeech(voiceEnabled);
  const pairs = useMemo(() => getMatchingPairs(age, difficulty), [age, difficulty]);
  const shuffledRight = useMemo(() => shuffleArray(pairs), [pairs]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [tries, setTries] = useState(0);
  const total = pairs.length;

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
        const stars = tries + 1 <= total + 1 ? 3 : tries + 1 <= total + 3 ? 2 : 1;
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
    <section className="panel">
      <div className="panel__header">
        <Button variant="ghost" onClick={onBack}>חזרה לתפריט המשחקים</Button>
        <div className="score-pill">הצלחות: {matchedIds.length}</div>
      </div>

      <div className="question-card">
        <span className="question-card__tag">🧩 משחק התאמה</span>
        <h2>בחרו זוגות מתאימים</h2>
        <p>לחצו על פריט בצד אחד ועל ההתאמה שלו בצד השני.</p>

        <div className="matching-board">
          <div className="matching-column">
            {pairs.map((pair) => (
              <button key={pair.id} type="button" className={`matching-item ${selectedLeft === pair.id ? 'matching-item--active' : ''} ${matchedIds.includes(pair.id) ? 'matching-item--done' : ''}`} onClick={() => handleLeftSelect(pair)}>{pair.left}</button>
            ))}
          </div>
          <div className="matching-column">
            {shuffledRight.map((pair) => (
              <button key={pair.id} type="button" className={`matching-item ${selectedRight === pair.id ? 'matching-item--active' : ''} ${matchedIds.includes(pair.id) ? 'matching-item--done' : ''}`} onClick={() => handleRightSelect(pair)}>{pair.right}</button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
