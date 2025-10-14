// client/src/screens/ResultsScreen.js (Updated to display results)
import React from 'react';

const ResultsScreen = ({ results, nickname, goToNext }) => {
    if (!results) return <div>Loading results...</div>;
    
    const isWinner = results.winner === nickname;
    const isDraw = results.isDraw;
    
    const headerSymbol = isWinner ? 'X' : (isDraw ? '=' : 'O');
    const headerColor = isWinner ? 'text-[#1DB954]' : (isDraw ? 'text-yellow-500' : 'text-red-500');
    const headerText = isWinner ? 'Winner!' : (isDraw ? 'Draw!' : 'Loser');
    
    // Find player's stats from the sorted leaderboard
    const myStats = results.leaderboard.find(p => p.nickname === nickname);
    
    return (
        <div className="w-full max-w-sm mx-auto p-4 flex flex-col items-center">
            {/* Winner Header */}
            <div className="text-center mb-8">
                <div className={`text-8xl font-black leading-none ${headerColor}`}>
                    {headerSymbol}
                </div>
                <div className={`text-4xl font-bold tracking-widest text-white mt-[-10px] uppercase`}>
                    {headerText}
                </div>
                <p className={`${headerColor} text-xl font-medium mt-1`}>
                    {results.points > 0 ? `+${results.points}` : results.points} pts
                </p>
            </div>

            {/* Leaderboard Table */}
            <div className="w-full bg-[#1C2128] rounded-lg shadow-xl p-4 mb-8">
                <div className="flex items-center text-gray-400 text-sm mb-3">
                    <span className="mr-2 text-lg">🏆</span> Leaderboard
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-5 text-gray-500 text-xs font-medium border-b border-gray-700 pb-1 mb-2">
                    <span className="col-span-2">W/L/D</span>
                    <span className="text-right">Score</span>
                    <span className="text-right">Time</span>
                    <span className="text-right">Rank</span>
                </div>

                {/* Table Rows */}
                {results.leaderboard.slice(0, 10).map((player, index) => (
                    <div
                        key={player.nickname}
                        className={`grid grid-cols-5 py-2 text-sm font-medium ${player.nickname === nickname ? 'text-white' : 'text-gray-300'}`}
                    >
                        <span className="col-span-2 text-left">{player.nickname} {player.nickname === nickname ? '(you)' : ''}</span>
                        <span className="text-left">{player.wld}</span>
                        <span className="text-right">{player.score}</span>
                        <span className="text-right">
                           {/* Simplified time display for the mock */}
                           {index === 0 ? '8m' : '10m'}
                        </span>
                    </div>
                ))}
            </div>

            {/* Play Again Button */}
            <button
                onClick={goToNext}
                className="bg-[#1DB954] text-white py-3 px-12 rounded-lg font-medium text-lg transition duration-150 ease-in-out hover:bg-[#158f40] w-full"
            >
                Play Again
            </button>
        </div>
    );
};

export default ResultsScreen;