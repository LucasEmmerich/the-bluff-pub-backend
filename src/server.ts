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

const socketServer = createServer(app);
socketServer.listen(process.env.PORT);
const io = new SocketServer(socketServer, {
  cors: {
    origin: "http://localhost:3000"
  }
});

const server = new Server();
const roomController = new RoomController(server, io);
const gameController = new GameController(server, io);

io.on('connection', (socket: Socket) => {
  socket.on('create-room', payload => roomController.createRoom(socket, payload));
  socket.on('join-room', payload => roomController.joinRoom(socket, payload));
  socket.on('left-room', payload => roomController.leaveRoom(socket, payload));

  socket.on('game-start', payload => gameController.startGame(socket, payload));


  // socket.on('game-start', (room: any, game: Game) => {
  //   const players = getRoom(room.id)?.players;
  //   if (!players || players.length < 2) {
  //     socket.emit('send-notification', {
  //       type: 'error',
  //       message: 'Pelo menos 2 jogadores são necessários para o início da partida.'
  //     });
  //     return;
  //   }
  //   game.hands = [];
  //   for (const p of players) {
  //     game.hands.push({
  //       username: p.username,
  //       hand: game.deck.splice(0, 5),
  //       life: 3
  //     });
  //   }
  //   const playerTurn = players[Math.floor(Math.random() * players.length)].username;
  //   game.turn = playerTurn;
  //   game.matchStarted = true;
  //   game.cardType = game.cardTypes[Math.floor(Math.random() * game.cardTypes.length)];
  //   io.to(room.id).emit('game-started', game);
  // });

  // socket.on('drop-cards', (room: any, game: Game, move: any) => {
  //   const players = getRoom(room.id)?.players;
  //   if (!players) return;
    
  //   const playersNames = players.map(p => p.username);
  //   const nextPlayer = players[playersNames.indexOf(room.mainPlayer.username) + 1] || players[0];
  //   let newTurn: string;

  //   if (move.callLiar) {
  //     if (game.table.cards.every(x => x.values.includes(game.cardType))) {
  //       game.hands.find(x => x.username !== game.table.playedBy)!.life--;
  //     } else {
  //       game.hands.find(x => x.username !== room.mainPlayer.username)!.life--;
  //     }

  //     newTurn = players[Math.floor(Math.random() * players.length)].username;
  //     game.table.playedBy = undefined;
  //     game.table.cards = [];

  //     game.hands.forEach(p => {
  //       p.hand = game.deck.splice(0, 5);
  //     });

  //     game.cardType = game.cardTypes[Math.floor(Math.random() * game.cardTypes.length)];
  //   } else {
  //     const newHand = move.cardsLeft;
  //     game.hands.find(x => x.username === room.mainPlayer.username)!.hand = newHand;
  //     game.table.playedBy = room.mainPlayer.username;
  //     game.table.cards = move.cardsDropped;
  //     newTurn = nextPlayer.username;
  //   }
  //   game.turn = newTurn;
  //   io.to(room.id).emit('cards-dropped', game);
  // });

  // socket.on('avatar-change', ({ id, changeForUser, players, avatar }: any) => {
  //   players.find((x: Player) => x.username === changeForUser).avatar = avatar;
  //   io.to(id).emit('avatar-changed', players);
  // });
});