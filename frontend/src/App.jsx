// client/src/App.js
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
    // FIX 1: Destructure the cancelMatchmaking function from useSocket
    cancelMatchmaking, 
    resetAndPlayAgain
  } = useSocket();

  let content;
  
  switch (currentScreen) {
    case Screen.NICKNAME:
      content = <NicknameScreen goToNext={joinMatchmaking} />;
      break;
    case Screen.FINDING_PLAYER:
      // FIX 2: Pass the now-defined cancelMatchmaking function as onCancel
      content = <FindingPlayerScreen onCancel={cancelMatchmaking} />; 
      break;
    case Screen.GAME:
      // Pass game data and the move function
      content = <GameScreen game={game} makeMove={makeMove} nickname={nickname} />;
      break;
    case Screen.RESULTS:
      // Pass the final results for the leaderboard/summary
      content = <ResultsScreen results={results} nickname={nickname} goToNext={resetAndPlayAgain} />;
      break;
    default:
      content = <NicknameScreen goToNext={joinMatchmaking} />;
  }

  // Determine background color based on screen
  const isGameScreen = currentScreen === Screen.GAME;
  const bgColor = isGameScreen ? 'bg-[#4CAF50]' : 'bg-[#101418]';

  return (
    // Set the main dark background for all screens except the game screen
    <div className={`min-h-screen ${bgColor} flex items-center justify-center p-4 text-white transition-colors duration-500`}>
      {content}
    </div>
  );
}

export default App;