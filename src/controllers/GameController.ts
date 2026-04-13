import Server from "../models/Server.js";
import Game, { Move } from "../models/Game.js";
import { Socket, Server as SocketIOServer } from "socket.io";

const TURN_TIMEOUT_MS = 20000;
const ANIMATION_DELAY_MS = 4000;

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
        if (!room.game) return false;
        const hand = room.game.hands.find(h => h.player.id === room.game!.turn.id);
        return (hand?.cards.length ?? 1) === 0;
    }

    private resolveSkips(roomId: string) {
        const room = this.server.getRoom(roomId);
        if (!room.game || !room.game.matchStarted) return;
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
                if (!room.game || !room.game.matchStarted) return;
                if (this.currentPlayerHasNoCards(roomId)) {
                    room.game.skipTurn();
                    this.io.to(roomId).emit('turn-skipped', room.game);
                    this.resolveSkips(roomId);
                    return;
                }
                const result = room.game.forfeitTurn();
                this.io.to(roomId).emit('turn-timeout', { game: room.game, result });
                if (!result.gameOver) setTimeout(() => this.resolveSkips(roomId), ANIMATION_DELAY_MS);
            } catch (e) { console.error(e); }
        }, TURN_TIMEOUT_MS);
        this.turnTimers.set(roomId, timer);
    }

    private clearTurnTimer(roomId: string) {
        const existing = this.turnTimers.get(roomId);
        if (existing) { clearTimeout(existing); this.turnTimers.delete(roomId); }
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
            this.io.to(room.id).emit('game-started', room.game);
            const totalCards = 5 * room.players.length;
            const dealAnimationMs = 200 + (totalCards - 1) * 180 + 750 + 400;
            setTimeout(() => this.startTurnTimer(room.id), dealAnimationMs);
        } catch (error) {
            console.error(error);
        }
    }

    public dropCards(socket: Socket, payload: { room: { id: string }, move: Move }) {
        try {
            const { move } = payload;
            const room = this.server.getRoom(payload.room.id);
            this.clearTurnTimer(room.id);

            if (move.liarCall) {
                const result = room.game!.callBluff(move.player);
                this.io.to(room.id).emit('bluff-called', { game: room.game, result });
            } else {
                room.game!.dropCards(move);
                this.io.to(room.id).emit('cards-dropped', room.game);
            }

            if (!room.game!.matchStarted) return;
            const delay = move.liarCall ? ANIMATION_DELAY_MS : 0;
            setTimeout(() => this.resolveSkips(room.id), delay);
        } catch (error) {
            console.error(error);
        }
    }
}
