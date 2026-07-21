import { useEffect, useMemo, useRef, useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { MatchingGame } from './components/games/matching/MatchingGame';
import { MemoryGame } from './components/games/memory/MemoryGame';
import { PatternGame } from './components/games/patterns/PatternGame';
import { SortingGame } from './components/games/sorting/SortingGame';
import { QuizGame } from './components/games/quiz/QuizGame';
import { GameWorld, GameWorldMessage } from './components/games/GameWorld';
import { Button } from './components/common/Button';
import { gameDefinitions } from './data/games';
import { getQuizQuestions } from './services/questionService';
import { HomePage } from './pages/HomePage';
import { SummaryPage } from './pages/SummaryPage';
import { LandingPage } from './pages/LandingPage';
import { GameId, GameResult, LearnerSettings, QuizQuestion } from './types';
import { useSpeech } from './hooks/useSpeech';
import { getLocalLearnerState, saveGameSession, saveLearnerSettings } from './services/learnerProgressService';
import { preloadCriticalAssets, preloadImageAssets } from './services/assetPreloadService';
import type { ImageAssetId } from './assets/assetManifest';

const quizGameIds: GameId[] = ['letters', 'numbers', 'shapes', 'colors'];

function App() {
  const [settings, setSettings] = useState<LearnerSettings>(() => {
    const learner = getLocalLearnerState();
    return { age: learner.age, difficulty: learner.difficulty, voiceEnabled: learner.voiceEnabled };
  });
  const [selectedGameId, setSelectedGameId] = useState<GameId | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const [playSessionKey, setPlaySessionKey] = useState(0);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [isQuizLoading, setIsQuizLoading] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const recordedPlaySessionKeyRef = useRef<number | null>(null);
  const { getSpeakProps } = useSpeech(settings.voiceEnabled);

  const selectedGame = useMemo(
    () => gameDefinitions.find((game) => game.id === selectedGameId) ?? null,
    [selectedGameId]
  );

  useEffect(() => {
    preloadCriticalAssets();
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadQuiz() {
      if (!selectedGameId || !quizGameIds.includes(selectedGameId)) {
        setQuizQuestions([]);
        setIsQuizLoading(false);
        return;
      }

      setIsQuizLoading(true);
      const questions = await getQuizQuestions(selectedGameId, settings.age, settings.difficulty).catch(() => []);
      if (!isActive) return;
      setQuizQuestions(questions);
      setIsQuizLoading(false);
    }

    loadQuiz();
    return () => {
      isActive = false;
    };
  }, [playSessionKey, selectedGameId, settings.age, settings.difficulty]);

  function handleSettingsChange(nextSettings: LearnerSettings) {
    setSettings(nextSettings);
    saveLearnerSettings(nextSettings);
  }

  function handleSelectGame(gameId: GameId) {
    const nextGame = gameDefinitions.find((game) => game.id === gameId);
    const assetsToPreload = [nextGame?.backgroundAssetId, nextGame?.imageAssetId]
      .filter((assetId): assetId is ImageAssetId => Boolean(assetId));
    preloadImageAssets(assetsToPreload);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSelectedGameId(gameId);
    setResult(null);
    recordedPlaySessionKeyRef.current = null;
    setPlaySessionKey((previous) => previous + 1);
  }

  function handleFinish(score: number, total: number, stars: number) {
    if (recordedPlaySessionKeyRef.current === playSessionKey) return;
    recordedPlaySessionKeyRef.current = playSessionKey;
    setResult({ score, total, stars });
    if (!selectedGame || !selectedGameId) return;

    saveGameSession({
      gameId: selectedGameId,
      gameTitle: selectedGame.title,
      age: settings.age,
      difficulty: settings.difficulty,
      score,
      total,
      stars
    });
  }

  function handleBackToGamesMenu() {
    setSelectedGameId(null);
    setResult(null);
    setShowLanding(false);
  }

  function handleBackToLanding() {
    setSelectedGameId(null);
    setResult(null);
    setShowLanding(true);
  }

  function handlePlayAgain() {
    setResult(null);
    recordedPlaySessionKeyRef.current = null;
    setPlaySessionKey((previous) => previous + 1);
  }

  function renderContent() {
    if (!selectedGame || !selectedGameId) {
      return <HomePage settings={settings} onSettingsChange={handleSettingsChange} onSelectGame={handleSelectGame} />;
    }

    if (result) {
      return (
        <SummaryPage
          title={selectedGame.title}
          result={result}
          voiceEnabled={settings.voiceEnabled}
          onPlayAgain={handlePlayAgain}
          onBackHome={handleBackToGamesMenu}
        />
      );
    }

    if (selectedGameId === 'matching') {
      return <MatchingGame key={playSessionKey} age={settings.age} difficulty={settings.difficulty} voiceEnabled={settings.voiceEnabled} onBack={handleBackToGamesMenu} onFinish={handleFinish} />;
    }
    if (selectedGameId === 'memory') {
      return <MemoryGame key={playSessionKey} age={settings.age} difficulty={settings.difficulty} voiceEnabled={settings.voiceEnabled} onBack={handleBackToGamesMenu} onFinish={handleFinish} />;
    }
    if (selectedGameId === 'patterns') {
      return <PatternGame key={playSessionKey} age={settings.age} difficulty={settings.difficulty} voiceEnabled={settings.voiceEnabled} onBack={handleBackToGamesMenu} onFinish={handleFinish} />;
    }
    if (selectedGameId === 'sorting') {
      return <SortingGame key={playSessionKey} age={settings.age} difficulty={settings.difficulty} voiceEnabled={settings.voiceEnabled} onBack={handleBackToGamesMenu} onFinish={handleFinish} />;
    }

    if (quizGameIds.includes(selectedGameId) && isQuizLoading) {
      return (
        <GameWorld gameId={selectedGameId} title={selectedGame.title} onBack={handleBackToGamesMenu} backSpeakProps={getSpeakProps<HTMLButtonElement>('חזרה לתפריט המשחקים')} status="מכינים את המשחק">
          <GameWorldMessage title="טוענים שאלות..." />
        </GameWorld>
      );
    }

    if (quizGameIds.includes(selectedGameId) && !quizQuestions.length) {
      return (
        <GameWorld gameId={selectedGameId} title={selectedGame.title} onBack={handleBackToGamesMenu} backSpeakProps={getSpeakProps<HTMLButtonElement>('חזרה לתפריט המשחקים')}>
          <GameWorldMessage title="התוכן לא נטען">
            <Button onClick={handleBackToGamesMenu}>חזרה לתפריט</Button>
          </GameWorldMessage>
        </GameWorld>
      );
    }

    if (quizGameIds.includes(selectedGameId)) {
      return (
        <QuizGame
          key={playSessionKey}
          title={selectedGame.title}
          gameId={selectedGameId as QuizQuestion['category']}
          questions={quizQuestions}
          voiceEnabled={settings.voiceEnabled}
          onBack={handleBackToGamesMenu}
          onFinish={handleFinish}
        />
      );
    }

    return null;
  }

  if (showLanding) {
    return <LandingPage voiceEnabled={settings.voiceEnabled} onStart={() => setShowLanding(false)} />;
  }

  return (
    <AppShell
      title={selectedGame?.title ?? 'לומדים בכיף'}
      subtitle={selectedGame ? 'משחקי למידה בעברית' : 'בוחרים משחק, מתנסים ומתקדמים בקצב שלכם.'}
      compact={Boolean(selectedGame && !result)}
      rightSlot={(
        <Button variant="ghost" className="app-shell__lobby-button" onClick={handleBackToLanding} {...getSpeakProps<HTMLButtonElement>('חזרה למסך הפתיחה')}>
          למסך הפתיחה
        </Button>
      )}
    >
      {renderContent()}
    </AppShell>
  );
}

export default App;
