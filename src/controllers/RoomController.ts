import Server from "../models/Server.js";
import Room from "../models/Room.js";
import Player from "../models/Player.js";
import { Socket, Server as SocketIOServer } from "socket.io";
import { json } from "stream/consumers";

export default class RoomController {
  private server: Server;
  private io: SocketIOServer;

  constructor(server: Server, io: SocketIOServer) {
    this.server = server;
    this.io = io;
  }

  public handleCreateRoom(socket: Socket, payload: { id: string; mainPlayer: { username: string; avatar: string } }) {
    const { id, mainPlayer } = payload;

    const roomOwner = new Player(socket.id, mainPlayer.username, mainPlayer.avatar);
    const newRoom = new Room(new Date().getTime().toString(36), roomOwner);

    this.server.addRoom(newRoom);

    socket.join(id);
    socket.emit("room-created", newRoom);
    this.io.to(id).emit("player-joined", newRoom);
  }
}