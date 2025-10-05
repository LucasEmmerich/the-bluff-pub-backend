import Server from "../models/Server.js";
import Room from "../models/Room.js";
import Player from "../models/Player.js";
import Game, { Move } from "../models/Game.js";
import { Socket, Server as SocketIOServer } from "socket.io";

export const CARD_TYPES = ['King', 'Queen', 'Ace'] as const;

export default class GameController {
    private server: Server;
    private io: SocketIOServer;

    constructor(server: Server, io: SocketIOServer) {
        this.server = server;
        this.io = io;
    }

    public startGame(socket: Socket, room: Room) {
        try {
            room.game = new Game(room.players);
            this.io.to(room.id).emit('game-started', room.game);
        } catch (error) {
            console.error(error);
        }
    }

    public dropCards(socket: Socket, payload:  { room: Room, move: Move }) {
        try {
            const { room, move } = payload;
            room.game?.dropCards(move);
            this.io.to(room.id).emit('cards-dropped', room);
        } catch (error) {
            console.error(error);
        }
    }
}