import { config } from "dotenv";
import express from "express";
import { createServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import Server from "./models/Server.js";
import RoomController from "./controllers/RoomController.js";
import GameController from "./controllers/GameController.js";
import path from "path";

config();
const app = express();

app.use(express.static(path.join(process.cwd(), "public")));
app.get("/login", (req, res) => {
  
});

const socketServer = createServer(app);
socketServer.listen(process.env.PORT);
const io = new SocketServer(socketServer, {
  cors: {
    origin: "http://localhost:3000"
  }
});

const server = new Server(io);

const roomController = new RoomController(server, io);
const gameController = new GameController(server, io);

io.on('connection', (socket: Socket) => {

  // Room
  socket.on('create-room', payload => roomController.createRoom(socket, payload));
  socket.on('join-room',   payload => roomController.joinRoom(socket, payload));
  socket.on('left-room',   payload => roomController.leaveRoom(socket, payload));

  // Game
  socket.on('game-start',  payload => gameController.startGame(socket, payload));
  socket.on('drop-cards',  payload => gameController.dropCards(socket, payload));

  // socket.on('avatar-change', ({ id, changeForUser, players, avatar }: any) => {
  //   players.find((x: Player) => x.username === changeForUser).avatar = avatar;
  //   io.to(id).emit('avatar-changed', players);
  // });
});