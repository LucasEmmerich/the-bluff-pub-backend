import Server from "../models/Server.js";
import Game, { Move } from "../models/Game.js";
import Room from "../models/Room.js";
import Player from "../models/Player.js";
import { Socket, Server as SocketIOServer } from "socket.io";

const TURN_TIMEOUT_MS = 20000;
const INTER_TURN_DELAY_MS = 2000;
const LIFE_LOSS_REVEAL_MS = 5000;
const BLUFF_CALL_ANIM_MS = 2000;

export default class GameController {
    private server: Server;
    private io: SocketIOServer;
    private turnTimers: Map<string, NodeJS.Timeout> = new Map();

    constructor(server: Server, io: SocketIOServer) {
        this.server = server;
        this.io = io;
    }

    private currentPlayerHasNoCards(roomId: string): boolean {
        const room = this.server.getRoom(roomId);
        if (!room || !room.game) return false;
        const hand = room.game.hands.find(h => h.player.id === room.game!.turn.id);
        return (hand?.cards.length ?? 1) === 0;
    }

    private resolveSkips(roomId: string) {
        const room = this.server.getRoom(roomId);
        if (!room || !room.game || !room.game.matchStarted) return;
        if (this.currentPlayerHasNoCards(roomId)) {
            room.game.skipTurn();
            this.io.to(roomId).emit('turn-skipped', room.game);
            this.resolveSkips(roomId);
        } else {
            this.startTurnTimer(roomId);
        }
    }

    private startTurnTimer(roomId: string) {
        this.clearTurnTimer(roomId);
        const timer = setTimeout(() => {
            try {
                const room = this.server.getRoom(roomId);
                if (!room || !room.game || !room.game.matchStarted) return;
                if (this.currentPlayerHasNoCards(roomId)) {
                    room.game.skipTurn();
                    this.io.to(roomId).emit('turn-skipped', room.game);
                    this.resolveSkips(roomId);
                    return;
                }
                const result = room.game.forfeitTurn();
                this.io.to(roomId).emit('turn-timeout', { game: room.game, result });
                if (result.gameOver && result.winner) {
                    room.recordWin((result.winner as any).id);
                    this.io.to(roomId).emit('leaderboard-updated', room.leaderboard);
                }
                if (!result.gameOver) setTimeout(() => this.resolveSkips(roomId), LIFE_LOSS_REVEAL_MS + INTER_TURN_DELAY_MS);
            } catch (e) { console.error(e); }
        }, TURN_TIMEOUT_MS);
        this.turnTimers.set(roomId, timer);
    }

    private clearTurnTimer(roomId: string) {
        const existing = this.turnTimers.get(roomId);
        if (existing) { clearTimeout(existing); this.turnTimers.delete(roomId); }
    }

    public bluffIntent(_socket: Socket, payload: { room: { id: string }, callerId: string }) {
        try {
            this.clearTurnTimer(payload.room.id);
            this.io.to(payload.room.id).emit('bluff-intent', { callerId: payload.callerId });
        } catch (e) { console.error(e); }
    }

    public startGame(socket: Socket, payload: { room: { id: string }, player: { id: string } }) {
        try {
            const room = this.server.getRoom(payload.room.id);
            if (room.roomOwner?.id !== payload.player.id) {
                socket.emit('send-notification', { type: 'error', message: 'Only the table owner can start the game.' });
                return;
            }
            if (room.players.length < 2) {
                socket.emit('send-notification', { type: 'error', message: 'At least 2 players are required.' });
                return;
            }
            room.game = new Game(room.players);
            room.ensurePlayersInLeaderboard();
            const totalCards = 5 * room.players.length;
            const dealAnimationMs = 200 + (totalCards - 1) * 180 + 750 + 400;
            this.io.to(room.id).emit('game-started', {
                ...room.game,
                leaderboard: room.leaderboard,
                timing: {
                    turnMs: TURN_TIMEOUT_MS,
                    interTurnDelayMs: INTER_TURN_DELAY_MS,
                    lifeLossRevealMs: LIFE_LOSS_REVEAL_MS,
                    bluffCallAnimMs: BLUFF_CALL_ANIM_MS,
                    dealAnimationMs,
                }
            });
            setTimeout(() => this.startTurnTimer(room.id), dealAnimationMs);
        } catch (error) {
            console.error(error);
        }
    }

    public devSandbox(socket: Socket, payload: { mainPlayer: Player; playerCount: number }) {
        const BOT_NAMES = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Grace'];
        const { username, avatar } = payload.mainPlayer;
        const owner = new Player(socket.id, username, avatar);
        const room = new Room(new Date().getTime().toString(36).toUpperCase(), owner);

        const count = Math.min(Math.max(payload.playerCount, 2), 4);
        for (let i = 0; i < count - 1; i++) {
            room.players.push(new Player(`bot-${i}-${Date.now()}`, BOT_NAMES[i], String(i + 1)));
        }
        room.ensurePlayersInLeaderboard();

        this.server.addRoom(room);
        socket.join(room.id);
        socket.emit('room-created', room);
        socket.emit('player-joined', room);

        setTimeout(() => {
            room.game = new Game(room.players);
            const totalCards = 5 * room.players.length;
            const dealAnimationMs = 200 + (totalCards - 1) * 180 + 750 + 400;
            socket.emit('game-started', {
                ...room.game,
                leaderboard: room.leaderboard,
                timing: {
                    turnMs: TURN_TIMEOUT_MS,
                    interTurnDelayMs: INTER_TURN_DELAY_MS,
                    lifeLossRevealMs: LIFE_LOSS_REVEAL_MS,
                    bluffCallAnimMs: BLUFF_CALL_ANIM_MS,
                    dealAnimationMs,
                }
            });
            setTimeout(() => this.startTurnTimer(room.id), dealAnimationMs);
        }, 150);
    }

    public giveUp(socket: Socket, payload: { room: { id: string }, playerId: string }) {
        try {
            const room = this.server.getRoom(payload.room.id);
            if (!room || !room.game || !room.game.matchStarted) return;
            const wasCurrentTurn = room.game.turn.id === payload.playerId;
            if (wasCurrentTurn) this.clearTurnTimer(room.id);
            const result = room.game.giveUp(payload.playerId);
            this.io.to(room.id).emit('player-gave-up', { game: room.game, result });
            if (result.gameOver && result.winner) {
                room.recordWin((result.winner as any).id);
                this.io.to(room.id).emit('leaderboard-updated', room.leaderboard);
            }
            if (!result.gameOver && wasCurrentTurn) setTimeout(() => this.resolveSkips(room.id), INTER_TURN_DELAY_MS);
        } catch (e) { console.error(e); }
    }

    public dropCards(socket: Socket, payload: { room: { id: string }, move: Move }) {
        try {
            const { move } = payload;
            const room = this.server.getRoom(payload.room.id);
            this.clearTurnTimer(room.id);

            if (move.liarCall) {
                const result = room.game!.callBluff(move.player);
                this.io.to(room.id).emit('bluff-called', { game: room.game, result, callerId: move.player.id });
                if (result.gameOver && result.winner) {
                    room.recordWin((result.winner as any).id);
                    this.io.to(room.id).emit('leaderboard-updated', room.leaderboard);
                }
            } else {
                room.game!.dropCards(move);
                this.io.to(room.id).emit('cards-dropped', room.game);
            }

            if (!room.game!.matchStarted) return;
            const delay = move.liarCall ? LIFE_LOSS_REVEAL_MS + INTER_TURN_DELAY_MS : INTER_TURN_DELAY_MS;
            setTimeout(() => this.resolveSkips(room.id), delay);
        } catch (error) {
            console.error(error);
        }
    }
}
