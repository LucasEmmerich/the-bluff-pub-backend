import Server from "../models/Server.js";
import Room from "../models/Room.js";
import Player from "../models/Player.js";
import { Socket, Server as SocketIOServer } from "socket.io";

export default class RoomController {
  private server: Server;
  private io: SocketIOServer;

  constructor(server: Server, io: SocketIOServer) {
    this.server = server;
    this.io = io;
  }

  public createRoom(socket: Socket, payload: { mainPlayer: Player }) {
    try {
      const { username, avatar } = payload.mainPlayer;
      const roomOwner = new Player(socket.id, username, avatar);
      const newRoom = new Room(new Date().getTime().toString(36).toUpperCase(), roomOwner);
      this.server.addRoom(newRoom);

      socket.join(newRoom.id);
      socket.emit("room-created", newRoom);
      this.io.to(newRoom.id).emit("player-joined", newRoom);
    } catch (error) {
      console.error(error);
    }
  }

  public joinRoom(socket: Socket, payload: { id?: string, enterRoomId: string, mainPlayer: Player }) {
    try {
      const room: Room = this.server.getRoom(payload.id || payload.enterRoomId);
      const newPlayer = new Player(socket.id, payload.mainPlayer.username, payload.mainPlayer.avatar);
      room.addPlayer(newPlayer);

      socket.join(room.id);
      this.io.to(room.id).emit("player-joined", room);
    } catch (error) {
      console.error(error);
    }
  }

  public leaveRoom(socket: Socket, payload: { id: string, mainPlayer: Player }) {
    try {
      // condition to handle tab closing without payload
      if(!payload.id) return;

      const room = this.server.getRoom(payload.id);
      const playerThatLeft = room.removePlayer(socket.id);

      this.io.to(room.id).emit("player-left", room, playerThatLeft);
      socket.leave(room.id);
    } catch (error) {
      console.error(error);
    }
  }
}