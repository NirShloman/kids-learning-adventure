import { useEffect, useMemo, useState } from 'react';
import { Age, Difficulty } from '../../../types';
import { getMemoryCards } from '../../../services/questionService';
import { useSpeech } from '../../../hooks/useSpeech';
import { Button } from '../../common/Button';

interface MemoryGameProps {
  age: Age;
  difficulty: Difficulty;
  voiceEnabled: boolean;
  onBack: () => void;
  onFinish: (score: number, total: number, stars: number) => void;
}

export function MemoryGame({ age, difficulty, voiceEnabled, onBack, onFinish }: MemoryGameProps) {
  const { speak } = useSpeech(voiceEnabled);
  const cards = useMemo(() => getMemoryCards(age, difficulty), [age, difficulty]);
  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [matchedPairIds, setMatchedPairIds] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const totalPairs = cards.length / 2;

  useEffect(() => {
    if (matchedPairIds.length === totalPairs && totalPairs > 0) {
      const stars = moves <= totalPairs + 2 ? 3 : moves <= totalPairs + 5 ? 2 : 1;
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
        window.setTimeout(() => setFlippedIds([]), 800);
      }
    }
  }

  return (
    <section className="panel">
      <div className="panel__header">
        <Button variant="ghost" onClick={onBack}>חזרה לתפריט המשחקים</Button>
        <div className="score-pill">זוגות: {matchedPairIds.length}</div>
      </div>

      <div className="question-card">
        <span className="question-card__tag">🃏 משחק זיכרון</span>
        <h2>מצאו זוגות תואמים</h2>
        <p>הפכו שני קלפים בכל פעם וזכרו איפה כל ציור נמצא.</p>

        <div className="memory-grid">
          {cards.map((card) => {
            const isVisible = flippedIds.includes(card.id) || matchedPairIds.includes(card.pairId);
            return (
              <button key={card.id} type="button" className={`memory-card ${isVisible ? 'memory-card--visible' : ''}`} onClick={() => handleCardClick(card.id)} aria-label={isVisible ? `קלף ${card.value}` : 'קלף מוסתר'}>
                <span>{isVisible ? card.value : '❓'}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
