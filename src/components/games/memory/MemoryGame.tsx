import { useEffect, useState } from 'react';
import { Age, Difficulty, MemoryCard } from '../../../types';
import { getMemoryCards } from '../../../services/questionService';
import { useSpeech } from '../../../hooks/useSpeech';
import { Button } from '../../common/Button';
import { gameInstructions } from '../../../data/gameInstructions';
import { calculateStars } from '../../../utils/helpers';
import { GameWorld, GameWorldMessage } from '../GameWorld';
import { GameImage } from '../../common/GameImage';
import { playAudioCue, playRecordedVoice } from '../../../services/audioService';
import { motion } from 'motion/react';

interface MemoryGameProps {
  age: Age;
  difficulty: Difficulty;
  voiceEnabled: boolean;
  onBack: () => void;
  onFinish: (score: number, total: number, stars: number) => void;
}

export function MemoryGame({ age, difficulty, voiceEnabled, onBack, onFinish }: MemoryGameProps) {
  const { speak, stop, getSpeakProps } = useSpeech(voiceEnabled);
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [flippedIds, setFlippedIds] = useState<string[]>([]);
  const [matchedPairIds, setMatchedPairIds] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const totalPairs = cards.length / 2;

  useEffect(() => {
    let isActive = true;
    setIsLoading(true);
    setFlippedIds([]);
    setMatchedPairIds([]);
    setMoves(0);

    getMemoryCards(age, difficulty)
      .then((items) => {
        if (!isActive) return;
        setCards(items);
        setIsLoading(false);
      })
      .catch(() => {
        if (!isActive) return;
        setCards([]);
        setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [age, difficulty]);

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

    playAudioCue('flip');
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
          playAudioCue('match');
          playRecordedVoice('pairFound', undefined, () => speak('מצוין, מצאתם זוג!'));
          setMatchedPairIds((previous) => [...previous, firstCard.pairId]);
          setFlippedIds([]);
        }, 450);
      } else {
        window.setTimeout(() => {
          playAudioCue('retry');
          playRecordedVoice('tryAgain', undefined, () => speak('לא זוג, נסו לזכור איפה הקלפים היו.'));
          setFlippedIds([]);
        }, 800);
      }
    }
  }

  if (isLoading) {
    return (
      <GameWorld gameId="memory" scoreLabel="זוגות" scoreValue={matchedPairIds.length} status="מערבבים קלפים" onBack={onBack} backSpeakProps={getSpeakProps<HTMLButtonElement>('חזרה לתפריט המשחקים')}>
        <GameWorldMessage title="טוענים קלפים..." />
      </GameWorld>
    );
  }

  if (!cards.length) {
    return (
      <GameWorld gameId="memory" onBack={onBack} backSpeakProps={getSpeakProps<HTMLButtonElement>('חזרה לתפריט המשחקים')}>
        <GameWorldMessage title="אין קלפים זמינים כרגע">
          <Button onClick={onBack}>חזרה</Button>
        </GameWorldMessage>
      </GameWorld>
    );
  }

  return (
    <GameWorld gameId="memory" scoreLabel="זוגות" scoreValue={matchedPairIds.length} status={`${moves} מהלכים`} onBack={onBack} backSpeakProps={getSpeakProps<HTMLButtonElement>('חזרה לתפריט המשחקים')}>
      <div className="game-play-card game-play-card--memory">
        <span className="question-card__tag">משחק זיכרון</span>
        <h2>מצאו זוגות תואמים</h2>
        <p>הפכו שני קלפים בכל פעם וזכרו איפה כל ציור נמצא.</p>

        <div className="memory-grid game-memory-grid">
          {cards.map((card) => {
            const isVisible = flippedIds.includes(card.id) || matchedPairIds.includes(card.pairId);
            return (
              <motion.button
                key={card.id}
                type="button"
                className={`memory-card game-memory-card ${isVisible ? 'memory-card--visible' : ''}`}
                data-testid="memory-card"
                data-pair-id={card.pairId}
                onClick={() => handleCardClick(card.id)}
                animate={{ rotateY: isVisible ? 180 : 0, scale: matchedPairIds.includes(card.pairId) ? 0.96 : 1 }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: 'spring', stiffness: 320, damping: 26 }}
                aria-label={isVisible ? `קלף ${card.value}` : 'קלף מוסתר'}
                {...getSpeakProps<HTMLButtonElement>(isVisible ? `קלף ${card.value}` : 'קלף מוסתר')}
              >
                <span className="game-memory-card__back" aria-hidden="true">?</span>
                <span className="game-memory-card__front">
                  {card.imageAssetId ? <GameImage assetId={card.imageAssetId} alt="" decorative className="game-token__image" /> : card.value}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </GameWorld>
  );
}
