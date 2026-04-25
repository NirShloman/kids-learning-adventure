import { useMemo, useState } from 'react';
import { AppShell } from './components/layout/AppShell';
import { MatchingGame } from './components/games/matching/MatchingGame';
import { MemoryGame } from './components/games/memory/MemoryGame';
import { QuizGame } from './components/games/quiz/QuizGame';
import { gameDefinitions } from './data/games';
import { getDefaultDifficultyByAge } from './data/levels';
import { getQuizQuestions } from './services/questionService';
import { HomePage } from './pages/HomePage';
import { SummaryPage } from './pages/SummaryPage';
import { LandingPage } from './pages/LandingPage';
import { GameId, GameResult, LearnerSettings } from './types';

function App() {
  const [settings, setSettings] = useState<LearnerSettings>({ age: 4, difficulty: getDefaultDifficultyByAge(4), voiceEnabled: true });
  const [selectedGameId, setSelectedGameId] = useState<GameId | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const [playSessionKey, setPlaySessionKey] = useState(0);
  const [showLanding, setShowLanding] = useState(true);

  const selectedGame = useMemo(() => gameDefinitions.find((game) => game.id === selectedGameId) ?? null, [selectedGameId]);

  function handleSettingsChange(nextSettings: LearnerSettings) {
    // Sync difficulty with age when age changes
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

  function handleBackHome() {
    setSelectedGameId(null);
    setResult(null);
    setShowLanding(true);
  }

  function handlePlayAgain() {
    setResult(null);
    setPlaySessionKey((previous) => previous + 1);
  }

  function renderContent() {
    if (showLanding) {
      return (
        <LandingPage
          settings={settings}
          onSettingsChange={handleSettingsChange}
          onStart={() => setShowLanding(false)}
        />
      );
    }

    if (!selectedGame || !selectedGameId) {
      return <HomePage settings={settings} onSettingsChange={handleSettingsChange} onSelectGame={handleSelectGame} />;
    }

    if (result) {
      return <SummaryPage title={selectedGame.title} result={result} onPlayAgain={handlePlayAgain} onBackHome={handleBackHome} />;
    }

    if (selectedGameId === 'matching') {
      return <MatchingGame key={playSessionKey} age={settings.age} difficulty={settings.difficulty} voiceEnabled={settings.voiceEnabled} onBack={handleBackHome} onFinish={handleFinish} />;
    }

    if (selectedGameId === 'memory') {
      return <MemoryGame key={playSessionKey} age={settings.age} difficulty={settings.difficulty} voiceEnabled={settings.voiceEnabled} onBack={handleBackHome} onFinish={handleFinish} />;
    }

    return (
      <QuizGame
        key={playSessionKey}
        title={selectedGame.title}
        questions={getQuizQuestions(selectedGameId, settings.age, settings.difficulty)}
        voiceEnabled={settings.voiceEnabled}
        onBack={handleBackHome}
        onFinish={handleFinish}
      />
    );
  }

  return (
    <AppShell title="לומדים בכיף" subtitle="משחקי למידה צבעוניים ומהנים בעברית לילדים בגילאי 3 עד 6, מותאמים לדפדפן ולמובייל.">
      {renderContent()}
    </AppShell>
  );
}

export default App;
