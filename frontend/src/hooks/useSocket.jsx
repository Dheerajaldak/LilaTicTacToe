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
    const [game, setGame] = useState(null); 
    const [results, setResults] = useState(null); 
    const socketRef = useRef(null);
    const forfeitGame = () => {
        socketRef.current.emit('forfeit_game');
    }

    useEffect(() => {
        socketRef.current = io(SOCKET_SERVER_URL);
        socketRef.current.on('matchmaking_status', (data) => {
            if (data.status === 'WAITING') {
                setCurrentScreen(Screen.FINDING_PLAYER);
            }
            if (data.status === 'CANCELED') {
                setCurrentScreen(Screen.NICKNAME);
                setNickname('');
            }
        });
        socketRef.current.on('game_start', (initialGameState) => {
            setGame(initialGameState);
            setCurrentScreen(Screen.GAME);
        });
        socketRef.current.on('game_update', (newGameState) => {
            setGame(newGameState);
        });
        socketRef.current.on('game_over', (finalResults) => {
            setResults(finalResults);
            setCurrentScreen(Screen.RESULTS);
            setGame(null); 
        });
        socketRef.current.on('opponent_disconnected', (data) => {
            alert(data.message); 
            setResults({ ...data, isDraw: false, points: 100, winner: nickname, myNickname: nickname }); 
            setCurrentScreen(Screen.RESULTS);
            setGame(null);
        });
        socketRef.current.on('move_rejected', (data) => {
             console.warn("Move rejected:", data.reason);
        });
        return () => {
            socketRef.current.disconnect();
        };
    }, []);

    const joinMatchmaking = (nick) => {
        setNickname(nick);
        socketRef.current.emit('join_matchmaking', { nickname: nick });
    };
    
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
    const resetAndPlayAgain = () => {
        setCurrentScreen(Screen.NICKNAME);
        setNickname('');
        setResults(null);
    }

    return { 
        currentScreen, 
        nickname, 
        game, 
        results, 
        joinMatchmaking, 
        makeMove,
        cancelMatchmaking, 
        resetAndPlayAgain,
        forfeitGame
    };
};