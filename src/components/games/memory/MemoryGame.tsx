import { useEffect, useMemo, useState } from 'react';
import { Age, Difficulty } from '../../../types';
import { getMemoryCards } from '../../../services/questionService';
import { useSpeech } from '../../../hooks/useSpeech';
import { Button } from '../../common/Button';
import { gameInstructions } from '../../../data/gameInstructions';
import { calculateStars } from '../../../utils/helpers';

interface MemoryGameProps {
  age: Age;
  difficulty: Difficulty;
  voiceEnabled: boolean;
  onBack: () => void;
  onFinish: (score: number, total: number, stars: number) => void;
}

export function MemoryGame({ age, difficulty, voiceEnabled, onBack, onFinish }: MemoryGameProps) {
  const { speak, stop, getSpeakProps } = useSpeech(voiceEnabled);
  const cards = useMemo(() => getMemoryCards(age, difficulty), [age, difficulty]);
  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [matchedPairIds, setMatchedPairIds] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const totalPairs = cards.length / 2;

  useEffect(() => {
    speak(gameInstructions.memory.intro);
    return stop;
  }, [speak, stop]);

  useEffect(() => {
    if (matchedPairIds.length === totalPairs && totalPairs > 0) {
      const stars = calculateStars(matchedPairIds.length, totalPairs, {
        attempts: moves,
        idealAttempts: totalPairs,
        forgivingExtraAttempts: Math.ceil(totalPairs * 0.9)
      });
      onFinish(matchedPairIds.length, totalPairs, stars);
    }
  }, [matchedPairIds.length, moves, onFinish, totalPairs]);

  function handleCardClick(cardId: string) {
    if (flippedIds.includes(cardId)) return;
    const card = cards.find((item) => item.id === cardId);
    if (!card || matchedPairIds.includes(card.pairId) || flippedIds.length === 2) return;

    speak(card.value);
    const nextFlipped = [...flippedIds, cardId];
    setFlippedIds(nextFlipped);

    if (nextFlipped.length === 2) {
      setMoves((previous) => previous + 1);
      const [firstId, secondId] = nextFlipped;
      const firstCard = cards.find((item) => item.id === firstId);
      const secondCard = cards.find((item) => item.id === secondId);

      if (firstCard && secondCard && firstCard.pairId === secondCard.pairId) {
        window.setTimeout(() => {
          speak('מצוין, מצאתם זוג!');
          setMatchedPairIds((previous) => [...previous, firstCard.pairId]);
          setFlippedIds([]);
        }, 450);
      } else {
        window.setTimeout(() => {
          speak('לא זוג, נסו לזכור איפה הקלפים היו.');
          setFlippedIds([]);
        }, 800);
      }
    }
  }

  return (
    <section className="panel game-panel game-panel--memory">
      <div className="panel__header">
        <Button variant="ghost" onClick={onBack} {...getSpeakProps<HTMLButtonElement>('חזרה לתפריט המשחקים')}>חזרה לתפריט המשחקים</Button>
        <div className="score-pill">זוגות: {matchedPairIds.length}</div>
      </div>

      <div className="question-card question-card--animated">
        <span className="question-card__tag">🃏 משחק זיכרון</span>
        <h2>מצאו זוגות תואמים</h2>
        <p>הפכו שני קלפים בכל פעם וזכרו איפה כל ציור נמצא.</p>

        <div className="memory-grid">
          {cards.map((card) => {
            const isVisible = flippedIds.includes(card.id) || matchedPairIds.includes(card.pairId);
            return (
              <button key={card.id} type="button" className={`memory-card ${isVisible ? 'memory-card--visible' : ''}`} onClick={() => handleCardClick(card.id)} aria-label={isVisible ? `קלף ${card.value}` : 'קלף מוסתר'} {...getSpeakProps<HTMLButtonElement>(isVisible ? `קלף ${card.value}` : 'קלף מוסתר')}>
                <span>{isVisible ? card.value : '❓'}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
