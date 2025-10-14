// client/src/screens/GameScreen.js (Updated to use socket data)
import React from 'react';

const TEAL_BG_DARK = 'bg-[#101418]';

const Cell = ({ value, onClick }) => {
    let content;
    let colorClass = 'text-white';

    if (value === 'X') {
        content = 'X';
        colorClass = 'text-[#101418]';
    } else if (value === 'O') {
        content = 'O';
        colorClass = 'text-white';
    } else {
        content = '';
    }

    return (
        <div 
            className={`flex items-center justify-center text-5xl font-bold transition duration-300 ${colorClass}`}
            onClick={onClick}
        >
            {content}
        </div>
    );
};


const GameScreen = ({ game, makeMove, nickname }) => {
    if (!game) return <div>Waiting for game data...</div>;
    
    const myPlayer = game.players.find(p => p.nickname === nickname);
    const oppPlayer = game.players.find(p => p.nickname !== nickname);
    
    const isMyTurn = game.turn === myPlayer?.symbol;

    const handleCellClick = (row, col) => {
        if (game.status === 'IN_PROGRESS' && isMyTurn && game.board[row][col] === null) {
            makeMove(row, col);
        }
    };
    
    const boardFlat = game.board.flat();

    return (
        <div className={`w-full max-w-sm mx-auto h-full min-h-screen flex flex-col items-center justify-between py-12`}>
            {/* Header */}
            <div className="text-center text-[#101418] mb-12">
                <p className="text-xl font-semibold">
                    {myPlayer?.nickname} <span className="text-gray-700 text-sm">(you)</span> 
                    &nbsp;&nbsp;&nbsp;
                    {oppPlayer?.nickname} <span className="text-gray-700 text-sm">(opp)</span>
                </p>
                <p className="text-3xl font-light mt-4">
                    {isMyTurn ? `${myPlayer?.symbol} Turn` : `${oppPlayer?.symbol} Turn`}
                </p>
            </div>

            {/* Tic-Tac-Toe Board */}
            <div className="grid grid-cols-3 grid-rows-3 w-[90%] max-w-[300px] aspect-square border-2 border-[#101418]">
                {game.board.map((rowArr, rowIndex) => 
                    rowArr.map((value, colIndex) => (
                        <div
                            key={`${rowIndex}-${colIndex}`}
                            className={`flex items-center justify-center border border-[#101418] relative cursor-pointer ${value === null && isMyTurn ? 'hover:bg-gray-200/20' : ''}`}
                            onClick={() => handleCellClick(rowIndex, colIndex)}
                        >
                            <Cell value={value} />
                        </div>
                    ))
                )}
            </div>

            {/* Footer / Leave Room */}
            <div className="text-center mt-12">
                {/* For a real game, 'Leave room' would send a forfeit event */}
                <button className="text-gray-200 text-sm hover:text-white" onClick={() => alert('Leaving the room results in a forfeit!')}>
                    Leave room (?)
                </button>
            </div>
        </div>
    );
};

export default GameScreen;