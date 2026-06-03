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
import { getDefaultDifficultyByAge } from './data/levels';
import { getQuizQuestions } from './services/questionService';
import { HomePage } from './pages/HomePage';
import { SummaryPage } from './pages/SummaryPage';
import { LandingPage } from './pages/LandingPage';
import { Age, Difficulty, GameId, GameResult, LearnerSettings, PlayerProfile, QuizQuestion } from './types';
import { useSpeech } from './hooks/useSpeech';
import { ParentDashboardPage } from './pages/ParentDashboardPage';
import { ParentGatePage } from './pages/ParentGatePage';
import { PlayerProfilePage } from './pages/PlayerProfilePage';
import { AdminPage } from './pages/AdminPage';
import { createPlayerProfile, getStoredPlayers, getStoredSessions, loadPlayersWithSync, loadSessionsWithSync, saveGameSession, savePlayers, saveSessions } from './services/playerProgressService';
import { ensureSignedIn } from './services/authService';
import { initializeOptionalAppCheck } from './services/appCheck';
import { loadRemoteConfig } from './services/remoteConfigService';
import { trackEvent } from './services/analyticsService';
import { enableOptionalFirestorePersistence } from './services/offlinePersistenceService';
import { preloadCriticalAssets, preloadImageAssets } from './services/assetPreloadService';
import type { ImageAssetId } from './assets/assetManifest';

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
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [isQuizLoading, setIsQuizLoading] = useState(false);
  const recordedPlaySessionKeyRef = useRef<number | null>(null);
  const [showLanding, setShowLanding] = useState(true);
  const [showParentDashboard, setShowParentDashboard] = useState(false);
  const [showPlayerProfile, setShowPlayerProfile] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [isParentAreaUnlocked, setIsParentAreaUnlocked] = useState(false);
  const { getSpeakProps } = useSpeech(settings.voiceEnabled);

  const selectedGame = useMemo(() => gameDefinitions.find((game) => game.id === selectedGameId) ?? null, [selectedGameId]);

  useEffect(() => {
    initializeOptionalAppCheck();
    enableOptionalFirestorePersistence();
    loadRemoteConfig();
    preloadCriticalAssets();
    trackEvent('app_opened');
  }, []);

  useEffect(() => {
    let isActive = true;

    async function syncProgress() {
      await ensureSignedIn().catch(() => null);
      trackEvent('auth_ready');
      const [syncedPlayers, syncedSessions] = await Promise.all([
        loadPlayersWithSync(),
        loadSessionsWithSync()
      ]);

      if (!isActive) return;
      setPlayers(syncedPlayers);
      setSessions(syncedSessions);

      const nextActivePlayer = syncedPlayers.find((player) => player.id === activePlayerId) ?? syncedPlayers[0];
      if (!nextActivePlayer) return;
      setActivePlayerId(nextActivePlayer.id);
      setSettings((previous) => ({
        ...previous,
        age: nextActivePlayer.age,
        difficulty: nextActivePlayer.difficulty
      }));
    }

    syncProgress();
    return () => {
      isActive = false;
    };
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
    if (nextSettings.age !== settings.age) trackEvent('age_changed', { age: nextSettings.age });
    if (nextSettings.difficulty !== settings.difficulty) trackEvent('difficulty_changed', { difficulty: nextSettings.difficulty });
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

  function handleProgressReplace(nextPlayers: PlayerProfile[], nextSessions: typeof sessions) {
    if (!nextPlayers.length) return;
    persistPlayers(nextPlayers);
    setSessions(nextSessions);
    saveSessions(nextSessions);

    const nextActivePlayer = nextPlayers.find((player) => player.id === activePlayerId) ?? nextPlayers[0];
    setActivePlayerId(nextActivePlayer.id);
    setSettings((previous) => ({
      ...previous,
      age: nextActivePlayer.age,
      difficulty: nextActivePlayer.difficulty
    }));
  }

  function handleSelectGame(gameId: GameId) {
    const nextGame = gameDefinitions.find((game) => game.id === gameId);
    const assetsToPreload = [nextGame?.backgroundAssetId, nextGame?.imageAssetId].filter((assetId): assetId is ImageAssetId => Boolean(assetId));
    preloadImageAssets(assetsToPreload);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSelectedGameId(gameId);
    setResult(null);
    recordedPlaySessionKeyRef.current = null;
    setPlaySessionKey((previous) => previous + 1);
    trackEvent('game_started', { gameId, age: settings.age, difficulty: settings.difficulty });
  }

  function handleFinish(score: number, total: number, stars: number) {
    if (recordedPlaySessionKeyRef.current === playSessionKey) return;
    recordedPlaySessionKeyRef.current = playSessionKey;
    setResult({ score, total, stars });
    if (!selectedGame || !selectedGameId || !activePlayer) return;
    trackEvent('game_completed', { gameId: selectedGameId, age: settings.age, difficulty: settings.difficulty, score, total, stars });

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
    setShowAdminDashboard(false);
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

    if (quizGameIds.includes(selectedGameId) && isQuizLoading) {
      return (
        <GameWorld gameId={selectedGameId} title={selectedGame.title} onBack={handleBackToGamesMenu} backSpeakProps={getSpeakProps<HTMLButtonElement>('חזרה לתפריט המשחקים')} status="מכינים את הסצנה">
          <GameWorldMessage title="טוענים שאלות..." />
        </GameWorld>
      );
    }

    if (quizGameIds.includes(selectedGameId) && !quizQuestions.length) {
      return (
        <GameWorld gameId={selectedGameId} title={selectedGame.title} onBack={handleBackToGamesMenu} backSpeakProps={getSpeakProps<HTMLButtonElement>('חזרה לתפריט המשחקים')}>
          <GameWorldMessage title="אין שאלות זמינות כרגע">
            <Button onClick={handleBackToGamesMenu}>חזרה לתפריט</Button>
          </GameWorldMessage>
        </GameWorld>
      );
    }

    if (quizGameIds.includes(selectedGameId)) {
      if (isQuizLoading) {
        return <section className="panel game-panel"><div className="question-card"><h2>טוענים שאלות...</h2></div></section>;
      }

      if (!quizQuestions.length) {
        return <section className="panel game-panel"><div className="question-card"><h2>אין שאלות זמינות כרגע</h2><Button onClick={handleBackToGamesMenu}>חזרה לתפריט</Button></div></section>;
      }

      return (
        <QuizGame
          key={playSessionKey}
          title={selectedGame.title}
          gameId={selectedGameId as 'letters' | 'numbers' | 'shapes' | 'colors'}
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
              <>
                <Button variant="secondary" className="app-shell__lobby-button" onClick={() => {
                  setShowParentDashboard(false);
                  setShowAdminDashboard(true);
                }}>
                  ניהול תוכן
                </Button>
                <Button variant="secondary" className="app-shell__lobby-button" onClick={() => setIsParentAreaUnlocked(false)}>
                  נעילת אזור הורים
                </Button>
              </>
            ) : null}
            <Button variant="ghost" className="app-shell__lobby-button" onClick={() => setShowParentDashboard(false)}>
              חזרה למשחקים
            </Button>
          </>
        )}
      >
        {isParentAreaUnlocked ? (
          <ParentDashboardPage players={players} sessions={sessions} onBack={() => setShowParentDashboard(false)} onProgressReplace={handleProgressReplace} />
        ) : (
          <ParentGatePage onBack={() => setShowParentDashboard(false)} onUnlocked={() => setIsParentAreaUnlocked(true)} />
        )}
      </AppShell>
    );
  }

  if (showAdminDashboard) {
    return (
      <AppShell
        title="ניהול תוכן"
        subtitle="בדיקת שאלות, אישור תוכן ותחזוקת מאגר הלמידה לפני פרסום לילדים."
        rightSlot={(
          <div className="app-shell__actions">
            <Button variant="ghost" className="app-shell__lobby-button" onClick={() => {
              setShowAdminDashboard(false);
              setShowParentDashboard(true);
              setIsParentAreaUnlocked(true);
            }}>
              חזרה לאזור ההורים
            </Button>
          </div>
        )}
      >
        <AdminPage onBack={() => {
          setShowAdminDashboard(false);
          setShowParentDashboard(true);
          setIsParentAreaUnlocked(true);
        }} />
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
      compact={Boolean(selectedGame && !result)}
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
