import { useMemo, useRef, useState } from 'react';
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
import { Age, Difficulty, GameId, GameResult, LearnerSettings, PlayerProfile } from './types';
import { useSpeech } from './hooks/useSpeech';
import { ParentDashboardPage } from './pages/ParentDashboardPage';
import { ParentGatePage } from './pages/ParentGatePage';
import { PlayerProfilePage } from './pages/PlayerProfilePage';
import { createPlayerProfile, getStoredPlayers, getStoredSessions, saveGameSession, savePlayers, saveSessions } from './services/playerProgressService';

const quizGameIds: GameId[] = ['letters', 'numbers', 'shapes', 'colors'];

function App() {
  const [players, setPlayers] = useState<PlayerProfile[]>(() => getStoredPlayers());
  const [sessions, setSessions] = useState(() => getStoredSessions());
  const [activePlayerId, setActivePlayerId] = useState(() => getStoredPlayers()[0]?.id ?? '');
  const activePlayer = players.find((player) => player.id === activePlayerId) ?? players[0];
  const [settings, setSettings] = useState<LearnerSettings>({
    age: activePlayer?.age ?? 4,
    difficulty: activePlayer?.difficulty ?? getDefaultDifficultyByAge(activePlayer?.age ?? 4),
    voiceEnabled: true
  });
  const [selectedGameId, setSelectedGameId] = useState<GameId | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const [playSessionKey, setPlaySessionKey] = useState(0);
  const recordedPlaySessionKeyRef = useRef<number | null>(null);
  const [showLanding, setShowLanding] = useState(true);
  const [showParentDashboard, setShowParentDashboard] = useState(false);
  const [showPlayerProfile, setShowPlayerProfile] = useState(false);
  const [isParentAreaUnlocked, setIsParentAreaUnlocked] = useState(false);
  const { getSpeakProps } = useSpeech(settings.voiceEnabled);

  const selectedGame = useMemo(() => gameDefinitions.find((game) => game.id === selectedGameId) ?? null, [selectedGameId]);

  function persistPlayers(nextPlayers: PlayerProfile[]) {
    setPlayers(nextPlayers);
    savePlayers(nextPlayers);
  }

  function handleSettingsChange(nextSettings: LearnerSettings) {
    if (!activePlayer) return;
    const updatedPlayer = {
      ...activePlayer,
      age: nextSettings.age,
      difficulty: nextSettings.difficulty
    };
    persistPlayers(players.map((player) => player.id === activePlayer.id ? updatedPlayer : player));
    setSettings(nextSettings);
  }

  function handleAddPlayer(name: string, age: Age, difficulty: Difficulty) {
    const nextPlayer = {
      ...createPlayerProfile(name, age),
      difficulty
    };
    const updatedPlayers = [...players, nextPlayer];
    persistPlayers(updatedPlayers);
    setActivePlayerId(nextPlayer.id);
    setSettings((previous) => ({
      ...previous,
      age: nextPlayer.age,
      difficulty: nextPlayer.difficulty
    }));
  }

  function handleSelectPlayer(playerId: string) {
    const nextPlayer = players.find((player) => player.id === playerId);
    if (!nextPlayer) return;
    setActivePlayerId(playerId);
    setSettings((previous) => ({
      ...previous,
      age: nextPlayer.age,
      difficulty: nextPlayer.difficulty
    }));
  }

  function handleDeletePlayer(playerId: string) {
    const nextPlayers = players.filter((player) => player.id !== playerId);
    const safePlayers = nextPlayers.length ? nextPlayers : [createPlayerProfile('שחקן/ית 1', 4)];
    const nextActivePlayer = safePlayers[0];
    const nextSessions = sessions.filter((session) => session.playerId !== playerId);
    persistPlayers(safePlayers);
    setSessions(nextSessions);
    saveSessions(nextSessions);
    setActivePlayerId(nextActivePlayer.id);
    setSettings((previous) => ({
      ...previous,
      age: nextActivePlayer.age,
      difficulty: nextActivePlayer.difficulty
    }));
  }

  function handleSelectGame(gameId: GameId) {
    setSelectedGameId(gameId);
    setResult(null);
    recordedPlaySessionKeyRef.current = null;
    setPlaySessionKey((previous) => previous + 1);
  }

  function handleFinish(score: number, total: number, stars: number) {
    if (recordedPlaySessionKeyRef.current === playSessionKey) return;
    recordedPlaySessionKeyRef.current = playSessionKey;
    setResult({ score, total, stars });
    if (!selectedGame || !selectedGameId || !activePlayer) return;

    const savedSession = saveGameSession({
      playerId: activePlayer.id,
      gameId: selectedGameId,
      gameTitle: selectedGame.title,
      age: settings.age,
      difficulty: settings.difficulty,
      score,
      total,
      stars
    });
    setSessions((previous) => [savedSession, ...previous].slice(0, 240));
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
    setShowParentDashboard(false);
    setShowPlayerProfile(false);
    setIsParentAreaUnlocked(false);
  }

  function handlePlayAgain() {
    setResult(null);
    recordedPlaySessionKeyRef.current = null;
    setPlaySessionKey((previous) => previous + 1);
  }

  function renderContent() {
    if (!selectedGame || !selectedGameId) {
      return (
        <HomePage
          settings={settings}
          onSettingsChange={handleSettingsChange}
          onSelectGame={handleSelectGame}
        />
      );
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

  if (showParentDashboard) {
    return (
      <AppShell
        title="אזור ההורים"
        subtitle="מעקב רגוע אחר התקדמות הילדים בכל המשחקים, לפי שחקן ולפי פעילות."
        rightSlot={(
          <>
            {isParentAreaUnlocked ? (
              <Button variant="secondary" className="app-shell__lobby-button" onClick={() => setIsParentAreaUnlocked(false)}>
                נעילת אזור הורים
              </Button>
            ) : null}
            <Button variant="ghost" className="app-shell__lobby-button" onClick={() => setShowParentDashboard(false)}>
              חזרה למשחקים
            </Button>
          </>
        )}
      >
        {isParentAreaUnlocked ? (
          <ParentDashboardPage players={players} sessions={sessions} onBack={() => setShowParentDashboard(false)} />
        ) : (
          <ParentGatePage onBack={() => setShowParentDashboard(false)} onUnlocked={() => setIsParentAreaUnlocked(true)} />
        )}
      </AppShell>
    );
  }

  if (showPlayerProfile && activePlayer) {
    return (
      <AppShell
        title="פרופיל שחקן"
        subtitle="ניהול שחקנים, גיל ורמת קושי לפני שמתחילים לשחק."
        rightSlot={(
          <div className="app-shell__actions">
            <Button variant="secondary" className="app-shell__lobby-button" onClick={() => {
              setShowPlayerProfile(false);
              setShowParentDashboard(true);
            }}>
              אזור הורים
            </Button>
            <Button variant="ghost" className="app-shell__lobby-button" onClick={() => setShowPlayerProfile(false)}>
              חזרה למשחקים
            </Button>
          </div>
        )}
      >
        <PlayerProfilePage
          players={players}
          activePlayer={activePlayer}
          settings={settings}
          onSettingsChange={handleSettingsChange}
          onAddPlayer={handleAddPlayer}
          onSelectPlayer={handleSelectPlayer}
          onDeletePlayer={handleDeletePlayer}
          onBack={() => setShowPlayerProfile(false)}
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      title="לומדים בכיף"
      subtitle="משחקי למידה צבעוניים ומהנים בעברית לילדים בגילאי 3 עד 6, עם קול הדרכה, אנימציות ותוכן מותאם גיל."
      rightSlot={(
        <div className="app-shell__actions">
          {activePlayer ? (
            <Button variant="secondary" className="app-shell__profile-button" onClick={() => setShowPlayerProfile(true)} {...getSpeakProps<HTMLButtonElement>(`פרופיל השחקן ${activePlayer.name}`)}>
              {activePlayer.name}
            </Button>
          ) : null}
          <Button variant="secondary" className="app-shell__lobby-button" onClick={() => {
            setShowPlayerProfile(false);
            setShowParentDashboard(true);
          }} {...getSpeakProps<HTMLButtonElement>('אזור הורים')}>
            אזור הורים
          </Button>
          <Button variant="ghost" className="app-shell__lobby-button" onClick={handleBackToLobby} {...getSpeakProps<HTMLButtonElement>('חזרה ללובי')}>
            חזרה ללובי
          </Button>
        </div>
      )}
    >
      {renderContent()}
    </AppShell>
  );
}

export default App;
