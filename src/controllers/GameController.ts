import Server from "../models/Server.js";
import Room from "../models/Room.js";
import Player from "../models/Player.js";
import Game from "../models/Game.js";
import { Socket, Server as SocketIOServer } from "socket.io";

export const CARD_TYPES = ['King', 'Queen', 'Ace'] as const;

export default class GameController {
    private server: Server;
    private io: SocketIOServer;

    constructor(server: Server, io: SocketIOServer) {
        this.server = server;
        this.io = io;
    }

    public startGame(socket: Socket, payload: { room: Room }) {
        try {
            const { id: roomId } = payload.room;
            const room = this.server.getRoom(roomId);
            room.game = new Game();
            for (const p of players) {
                game.hands.push({
                    player: p,
                    hand: game.deck.splice(0, 5),
                    life: 3
                });
            }
            const playerTurn = players[Math.floor(Math.random() * players.length)].username;
            game.turn = playerTurn;
            game.matchStarted = true;
            game.cardType = game.cardTypes[Math.floor(Math.random() * game.cardTypes.length)];
            this.io.to(room.id).emit('game-started', game);
        } catch (error) {
            console.error(error);
        }
    }
}