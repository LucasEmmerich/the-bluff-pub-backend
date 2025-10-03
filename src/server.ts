import { config } from "dotenv";
import express from "express";
import { createServer } from "http";
import { Server as SocketServer, Socket } from "socket.io";
import Server from "./models/Server.js";
import Room from "./models/Room.js";
import Player from "./models/Player.js";
import RoomController from "./controllers/RoomController.js";

config();
const app = express();
const socketServer = createServer(app);
const io = new SocketServer(socketServer, {
  cors: {
    origin: "http://localhost:3000"
  }
});

const port = process.env.PORT;
socketServer.listen(port, () => {
  console.log(`Listening on ${port}`);
});

const server = new Server();
const roomController = new RoomController(server, io);

io.on('connection', (socket: Socket) => {
  socket.on("create-room", (payload) => roomController.handleCreateRoom(socket, payload));
  socket.on('join-room', (payload) => {
    const room: Room | undefined = server.getRoom(payload.id || payload.enterRoomId);
    if (room && room.players.length < 4) {
      if (room.isInside(payload.mainPlayer.username)) {
        socket.emit('send-notification', {
          type: 'error',
          message: 'Já existe um jogador com esse nome na sala informada.'
        });
        return;
      }
      const newPlayer = new Player(socket.id, payload.mainPlayer.username, payload.mainPlayer.avatar);
      room.addPlayer(newPlayer);

      socket.join(room.id);
      console.log(room)
      io.to(room.id).emit('player-joined', room);
    } else {
      socket.emit('room-error', 'A sala está cheia ou não existe.');
    }
  });

  // socket.on('left-room', (room: any) => {
  //   if (room.id) {
  //     removePlayer(room.id, room.mainPlayer);
  //     const players = getRoom(room.id)?.players;
  //     if (players && room.mainPlayer.roomOwner && players.length > 0) {
  //       players[0].roomOwner = true;
  //     }
  //     io.to(room.id).emit('player-left', players, room.mainPlayer);
  //   }
  // });

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