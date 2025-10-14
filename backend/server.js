// server/server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*", // Allow all origins for the React client
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 4000;

// --- Server-Side Game State Management ---
const waitingPlayers = [];  // Queue: [{ id: socketId, nickname: string }]
const activeGames = {};     // { gameId: GameState }
const playersToGame = {};   // { playerId: gameId }
const leaderboard = {};     // { nickname: { wins, losses, draws, score } }

// --- Game Constants and Points ---
const BOARD_SIZE = 3;
const POINTS_WIN = 200;
const POINTS_LOSS = -50;
const POINTS_DRAW = 50;

// --- Helper: Check for Win/Draw ---
function checkWin(board) {
    const flatBoard = board.flat();
    const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6],           // Diagonals
    ];
    for (const [a, b, c] of lines) {
        if (flatBoard[a] && flatBoard[a] === flatBoard[b] && flatBoard[a] === flatBoard[c]) {
            return { winner: flatBoard[a], line: [a, b, c] }; // Returns winner symbol and winning line indices
        }
    }
    return null;
}

function checkDraw(board, winnerInfo) {
    return !winnerInfo && board.flat().every(cell => cell !== null);
}

// --- Helper: Update Leaderboard ---
function updateLeaderboard(player1, player2, result) {
    // result: 'WIN', 'LOSS', 'DRAW' for p1
    const update = (player, res) => {
        leaderboard[player.nickname] = leaderboard[player.nickname] || { wins: 0, losses: 0, draws: 0, score: 0, time: new Date().toLocaleTimeString() };
        if (res === 'WIN') {
            leaderboard[player.nickname].wins += 1;
            leaderboard[player.nickname].score += POINTS_WIN;
        } else if (res === 'LOSS') {
            leaderboard[player.nickname].losses += 1;
            leaderboard[player.nickname].score += POINTS_LOSS;
        } else if (res === 'DRAW') {
            leaderboard[player.nickname].draws += 1;
            leaderboard[player.nickname].score += POINTS_DRAW;
        }
    };
    
    if (result === 'DRAW') {
        update(player1, 'DRAW');
        update(player2, 'DRAW');
    } else if (result === 'WIN') {
        update(player1, 'WIN');
        update(player2, 'LOSS');
    } else { // LOSS (p1 lost, p2 won)
        update(player1, 'LOSS');
        update(player2, 'WIN');
    }
}

function getLeaderboard() {
    return Object.entries(leaderboard)
        .map(([nickname, stats]) => ({
            nickname,
            ...stats,
            wld: `${stats.wins}/${stats.losses}/${stats.draws}`,
        }))
        .sort((a, b) => b.score - a.score);
}

// --- Helper: Create and Notify Game Start ---
function createNewGame(player1, player2) {
    const gameId = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    
    // Assign 'X' and 'O' randomly
    const isP1X = Math.random() < 0.5;
    const p1Symbol = isP1X ? 'X' : 'O';
    const p2Symbol = isP1X ? 'O' : 'X';

    const game = {
        id: gameId,
        players: [
            { id: player1.id, nickname: player1.nickname, symbol: p1Symbol },
            { id: player2.id, nickname: player2.nickname, symbol: p2Symbol }
        ],
        board: Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null)),
        turn: 'X', // X always starts
        status: 'IN_PROGRESS',
        startTime: Date.now(),
    };

    activeGames[gameId] = game;
    playersToGame[player1.id] = gameId;
    playersToGame[player2.id] = gameId;

    // Notify players of game start
    io.to(player1.id).emit('game_start', { ...game, mySymbol: p1Symbol });
    io.to(player2.id).emit('game_start', { ...game, mySymbol: p2Symbol });
    
    return game;
}

// --- Matchmaking Logic ---
function attemptMatchmaking() {
    while (waitingPlayers.length >= 2) {
        const player1 = waitingPlayers.shift();
        const player2 = waitingPlayers.shift();
        
        // Ensure both sockets are still connected before creating the game
        if (io.sockets.sockets.has(player1.id) && io.sockets.sockets.has(player2.id)) {
            createNewGame(player1, player2);
        } else {
            // Re-queue the still-connected player
            if (io.sockets.sockets.has(player1.id)) waitingPlayers.push(player1);
            if (io.sockets.sockets.has(player2.id)) waitingPlayers.push(player2);
        }
    }
}

// --- Socket.IO Connection Handler ---
io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // [1] Matchmaking Request (Nickname Screen to Finding Player Screen)
    socket.on('join_matchmaking', (data) => {
        const { nickname } = data;
        if (!nickname) return;
        
        // Ensure player isn't already waiting or in a game
        if (!playersToGame[socket.id] && !waitingPlayers.some(p => p.id === socket.id)) {
            const player = { id: socket.id, nickname };
            waitingPlayers.push(player);
            io.to(socket.id).emit('matchmaking_status', { status: 'WAITING' });
            attemptMatchmaking();
        }
    });

    // [2] Game Move Logic
    socket.on('make_move', (data) => {
        const { row, col } = data;
        const gameId = playersToGame[socket.id];
        const game = activeGames[gameId];
        
        if (!game || game.status !== 'IN_PROGRESS') return;
        
        const player = game.players.find(p => p.id === socket.id);
        if (!player || player.symbol !== game.turn) {
            io.to(socket.id).emit('move_rejected', { reason: "Not your turn or invalid player." });
            return;
        }
        
        // Validation
        if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE || game.board[row][col] !== null) {
            io.to(socket.id).emit('move_rejected', { reason: "Invalid cell." });
            return;
        }

        // Execute Move
        game.board[row][col] = player.symbol;
        const winnerInfo = checkWin(game.board);
        const isDraw = checkDraw(game.board, winnerInfo);
        
        if (winnerInfo || isDraw) {
            // Game Over
            game.status = 'FINISHED';
            
            let p1Result;
            const [p1, p2] = game.players;
            let winnerName = null;

            if (winnerInfo) {
                const winner = game.players.find(p => p.symbol === winnerInfo.winner);
                winnerName = winner.nickname;
                
                // Determine results for updateLeaderboard
                p1Result = (p1.id === winner.id) ? 'WIN' : 'LOSS';
                
            } else {
                // Draw
                p1Result = 'DRAW';
            }

            // Update Leaderboard
            updateLeaderboard(p1, p2, p1Result);

            // Send Final Results
            game.players.forEach(p => {
                const isWinner = p.symbol === winnerInfo?.winner;
                const isLoser = !isWinner && !isDraw;
                
                const finalResult = {
                    board: game.board,
                    winner: winnerName,
                    points: isWinner ? POINTS_WIN : (isDraw ? POINTS_DRAW : POINTS_LOSS),
                    isDraw: isDraw,
                    leaderboard: getLeaderboard(),
                    myNickname: p.nickname
                };
                io.to(p.id).emit('game_over', finalResult);
                
                // Cleanup
                delete playersToGame[p.id];
            });

            delete activeGames[gameId];
            
        } else {
            // Game Continues
            game.turn = game.turn === 'X' ? 'O' : 'X';
            io.to(game.players[0].id).emit('game_update', game);
            io.to(game.players[1].id).emit('game_update', game);
        }
    });
    
   socket.on('cancel_matchmaking', () => {
        const waitingIndex = waitingPlayers.findIndex(p => p.id === socket.id);
        
        if (waitingIndex !== -1) {
            waitingPlayers.splice(waitingIndex, 1);
            
            // CRITICAL: Send the 'CANCELED' status back to the client
            // This is what tells the client (useSocket.jsx) to navigate 
            // back to the NICKNAME screen.
            io.to(socket.id).emit('matchmaking_status', { status: 'CANCELED', message: 'Matchmaking canceled by user.' });
            
            console.log(`Client ${socket.id} canceled matchmaking. Removed from queue.`);
        } else {
            console.log(`Client ${socket.id} tried to cancel but wasn't in queue or game.`);
            // If they weren't in the queue, still send a CANCELED status 
            // to reset the client screen state, just in case of a mismatch.
            io.to(socket.id).emit('matchmaking_status', { status: 'CANCELED', message: 'Resetting screen state.' });
        }
    });


    // [4] Disconnect Handling
    socket.on('disconnect', () => {
        // Remove from waiting queue
        const waitingIndex = waitingPlayers.findIndex(p => p.id === socket.id);
        if (waitingIndex !== -1) waitingPlayers.splice(waitingIndex, 1);
        
        // Handle in-progress game
        const gameId = playersToGame[socket.id];
        if (gameId && activeGames[gameId]) {
            const game = activeGames[gameId];
            const opponent = game.players.find(p => p.id !== socket.id);
            
            if (opponent) {
                 // Opponent wins by forfeit
                 const winner = opponent;
                 const loser = game.players.find(p => p.id === socket.id);
                 
                 // Update leaderboard for a win/loss (Forfeit)
                 updateLeaderboard(winner, loser, 'WIN'); // The winner (p1 in the function call) is the opponent
                 
                 io.to(winner.id).emit('opponent_disconnected', { 
                     message: "Opponent disconnected. You win by forfeit (+100pts).",
                     leaderboard: getLeaderboard()
                 });
            }

            // Cleanup
            delete activeGames[gameId];
            game.players.forEach(p => delete playersToGame[p.id]);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});