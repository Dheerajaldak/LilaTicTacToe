import React from 'react';
import { useSocket, Screen } from './hooks/useSocket';
import NicknameScreen from './component/NicknameScreen';
import FindingPlayerScreen from './component/FindingPlayerScreen';
import GameScreen from './component/GameScreen';
import ResultsScreen from './component/ResultsScreen';

function App() {
  const { 
    currentScreen, 
    nickname, 
    game, 
    results, 
    joinMatchmaking, 
    makeMove,
    cancelMatchmaking, 
    resetAndPlayAgain,
    forfeitGame
  } = useSocket();

  let content;
  
  switch (currentScreen) {
    case Screen.NICKNAME:
      content = <NicknameScreen goToNext={joinMatchmaking} />;
      break;
    case Screen.FINDING_PLAYER:
      content = <FindingPlayerScreen onCancel={cancelMatchmaking} />; 
      break;
    case Screen.GAME:
      content = <GameScreen game={game} makeMove={makeMove} nickname={nickname} forfeitGame={forfeitGame}  />;
      break;
    case Screen.RESULTS:
      content = <ResultsScreen results={results} nickname={nickname} goToNext={resetAndPlayAgain}  />;
      break;
    default:
      content = <NicknameScreen goToNext={joinMatchmaking} />;
  }
  const isGameScreen = currentScreen === Screen.GAME;
  const bgColor = isGameScreen ? 'bg-[#4CAF50]' : 'bg-[#101418]';

  return (
    <div className={`min-h-screen ${bgColor} flex items-center justify-center p-4 text-white transition-colors duration-500`}>
      {content}
    </div>
  );
}

export default App;