import { useMemo, useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { MatchingGame } from './components/games/matching/MatchingGame';
import { MemoryGame } from './components/games/memory/MemoryGame';
import { PatternGame } from './components/games/patterns/PatternGame';
import { SortingGame } from './components/games/sorting/SortingGame';
import { QuizGame } from './components/games/quiz/QuizGame';
import { Button } from './components/common/Button';
import { gameDefinitions } from './data/games';
import { getDefaultDifficultyByAge } from './data/levels';
import { getQuizQuestions } from './services/questionService';
import { HomePage } from './pages/HomePage';
import { SummaryPage } from './pages/SummaryPage';
import { LandingPage } from './pages/LandingPage';
import { GameId, GameResult, LearnerSettings } from './types';
import { useSpeech } from './hooks/useSpeech';

const quizGameIds: GameId[] = ['letters', 'numbers', 'shapes', 'colors'];

function App() {
  const [settings, setSettings] = useState<LearnerSettings>({ age: 4, difficulty: getDefaultDifficultyByAge(4), voiceEnabled: true });
  const [selectedGameId, setSelectedGameId] = useState<GameId | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const [playSessionKey, setPlaySessionKey] = useState(0);
  const [showLanding, setShowLanding] = useState(true);
  const { getSpeakProps } = useSpeech(settings.voiceEnabled);

  const selectedGame = useMemo(() => gameDefinitions.find((game) => game.id === selectedGameId) ?? null, [selectedGameId]);

  function handleSettingsChange(nextSettings: LearnerSettings) {
    if (nextSettings.age !== settings.age) {
      nextSettings.difficulty = getDefaultDifficultyByAge(nextSettings.age);
    }
    setSettings(nextSettings);
  }

  function handleSelectGame(gameId: GameId) {
    setSelectedGameId(gameId);
    setResult(null);
    setPlaySessionKey((previous) => previous + 1);
  }

  function handleFinish(score: number, total: number, stars: number) {
    setResult({ score, total, stars });
  }

  function handleBackToGamesMenu() {
    setSelectedGameId(null);
    setResult(null);
    setShowLanding(false);
  }

  function handleBackToLobby() {
    setSelectedGameId(null);
    setResult(null);
    setShowLanding(true);
  }

  function handlePlayAgain() {
    setResult(null);
    setPlaySessionKey((previous) => previous + 1);
  }

  function renderContent() {
    if (!selectedGame || !selectedGameId) {
      return <HomePage settings={settings} onSettingsChange={handleSettingsChange} onSelectGame={handleSelectGame} />;
    }

    if (result) {
      return <SummaryPage title={selectedGame.title} result={result} voiceEnabled={settings.voiceEnabled} onPlayAgain={handlePlayAgain} onBackHome={handleBackToGamesMenu} />;
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

    if (quizGameIds.includes(selectedGameId)) {
      return (
        <QuizGame
          key={playSessionKey}
          title={selectedGame.title}
          gameId={selectedGameId as 'letters' | 'numbers' | 'shapes' | 'colors'}
          questions={getQuizQuestions(selectedGameId, settings.age, settings.difficulty)}
          voiceEnabled={settings.voiceEnabled}
          onBack={handleBackToGamesMenu}
          onFinish={handleFinish}
        />
      );
    }

    return null;
  }

  if (showLanding) {
    return (
      <LandingPage
        settings={settings}
        onSettingsChange={handleSettingsChange}
        onStart={() => setShowLanding(false)}
      />
    );
  }

  return (
    <AppShell
      title="לומדים בכיף"
      subtitle="משחקי למידה צבעוניים ומהנים בעברית לילדים בגילאי 3 עד 6, עם קול הדרכה, אנימציות ותוכן מותאם גיל."
      rightSlot={(
        <Button variant="ghost" className="app-shell__lobby-button" onClick={handleBackToLobby} {...getSpeakProps<HTMLButtonElement>('חזרה ללובי')}>
          חזרה ללובי
        </Button>
      )}
    >
      {renderContent()}
    </AppShell>
  );
}

export default App;
