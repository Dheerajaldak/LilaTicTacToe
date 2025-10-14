// client/src/hooks/useSocket.js
import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';

const SOCKET_SERVER_URL = import.meta.env.VITE_BACKEND_URL;
export const Screen = {
    NICKNAME: 'NICKNAME',
    FINDING_PLAYER: 'FINDING_PLAYER',
    GAME: 'GAME',
    RESULTS: 'RESULTS',
};

export const useSocket = () => {
    const [currentScreen, setCurrentScreen] = useState(Screen.NICKNAME);
    const [nickname, setNickname] = useState('');
    const [game, setGame] = useState(null); // Full game state: board, turn, players
    const [results, setResults] = useState(null); // Final game results & leaderboard
    const socketRef = useRef(null);

    useEffect(() => {
        socketRef.current = io(SOCKET_SERVER_URL);

        // --- Socket Event Handlers ---
        
        // 1. Matchmaking Status
        socketRef.current.on('matchmaking_status', (data) => {
            if (data.status === 'WAITING') {
                setCurrentScreen(Screen.FINDING_PLAYER);
            }
            // NEW: Handle server-confirmed cancellation
            if (data.status === 'CANCELED') {
                setCurrentScreen(Screen.NICKNAME);
                setNickname('');
            }
        });

        // 2. Game Start
        socketRef.current.on('game_start', (initialGameState) => {
            setGame(initialGameState);
            setCurrentScreen(Screen.GAME);
        });
        
        // 3. Game Update (Opponent's Move)
        socketRef.current.on('game_update', (newGameState) => {
            setGame(newGameState);
        });

        // 4. Game Over (Win/Loss/Draw)
        socketRef.current.on('game_over', (finalResults) => {
            setResults(finalResults);
            setCurrentScreen(Screen.RESULTS);
            setGame(null); // Clear active game
        });
        
        // 5. Opponent Disconnect
        socketRef.current.on('opponent_disconnected', (data) => {
            alert(data.message); // Simple alert for forfeit
            setResults({ ...data, isDraw: false, points: 100, winner: nickname, myNickname: nickname }); 
            setCurrentScreen(Screen.RESULTS);
            setGame(null);
        });

        // 6. Move Rejected (for debugging/UX)
        socketRef.current.on('move_rejected', (data) => {
             console.warn("Move rejected:", data.reason);
        });


        // Cleanup on unmount
        return () => {
            socketRef.current.disconnect();
        };
    }, []);

    // --- Action Emitters ---

    const joinMatchmaking = (nick) => {
        setNickname(nick);
        socketRef.current.emit('join_matchmaking', { nickname: nick });
    };
    
    // NEW: Function to send cancellation signal to the server
    const cancelMatchmaking = () => {
        socketRef.current.emit('cancel_matchmaking');
    }

    const makeMove = (row, col) => {
        if (game && game.status === 'IN_PROGRESS' && game.turn === game.players.find(p => p.id === socketRef.current.id)?.symbol) {
            socketRef.current.emit('make_move', { row, col });
        } else {
             console.warn("Cannot make move: Not your turn or game not in progress.");
        }
    };
    
    // Function to transition back to Nickname screen (e.g., from Play Again button)
    const resetAndPlayAgain = () => {
        setCurrentScreen(Screen.NICKNAME);
        setNickname('');
        setResults(null);
        // Note: The socket connection remains open.
    }

    return { 
        currentScreen, 
        nickname, 
        game, 
        results, 
        joinMatchmaking, 
        makeMove,
        cancelMatchmaking, // Export new function
        resetAndPlayAgain
    };
};