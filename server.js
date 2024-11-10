require('dotenv').config()
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000"
  }
});

const rooms = [];
const addRoom = (room) => rooms.push(room);
const addPlayer = (roomId, user) => getRoom(roomId).players.push(user);
const removePlayer = (roomId, user) => getRoom(roomId).players = getRoom(roomId).players.filter(x => x.username !== user.username);
const getRoom = (roomId) => rooms.find(x => x.roomId == roomId);

io.on('connection', (socket) => {
  socket.on('create-room', room => {
    room.id = Math.random().toString(36).substring(2, 12).toUpperCase();
    room.mainPlayer.id = socket.id;
    room.mainPlayer.roomOwner = true;
    room.players = [room.mainPlayer];
    addRoom({
      roomId: room.id,
      players: room.players
    });
    socket.join(room.id);
    socket.emit('room-created', room);
    io.to(room.id).emit('player-joined', room);
  });
  socket.on('join-room', room => {
    if (room && room.players.length < 4) {
      room.id = room.id || room.enterRoomId;
      const players = getRoom(room.id).players;
      if (players.find(p => p.username === room.mainPlayer.username)) {
        socket.emit('send-notification', {
          type: 'error',
          message: 'Já exite um jogador com esse nome na sala informada.'
        });
        return;
      }
      room.mainPlayer.id = socket.id;
      room.mainPlayer.roomOwner = false;
      addPlayer(room.id, room.mainPlayer);
      room.players = getRoom(room.id).players;
      socket.join(room.id);
      io.to(room.id).emit('player-joined', room);
    } else {
      socket.emit('room-error', 'A sala está cheia ou não existe.');
    }
  });
  socket.on('left-room', room => {
    if (room.id) {
      removePlayer(room.id, room.mainPlayer);
      const players = getRoom(room.id).players;
      if (room.mainPlayer.roomOwner && players.length > 0) {
        players[0].roomOwner = true;
      }
      io.to(room.id).emit('player-left', players, room.mainPlayer);
    }
  });
  socket.on('game-start', (room, game) => {
    const players = getRoom(room.id).players;
    if (players.length < 2) {
      socket.emit('send-notification', {
        type: 'error',
        message: 'Pelo menos 2 jogadores são necessários para o início da partida.'
      });
      return;
    }
    game.hands = [];
    for (const p of players) {
      game.hands.push({
        username: p.username,
        hand: game.deck.splice(0, 5),
        life: 3
      });
    }
    const playerTurn = players[Math.floor(Math.random() * players.length)].username;
    game.turn = playerTurn;
    game.matchStarted = true;
    game.cardType = game.cardTypes[Math.floor(Math.random() * game.cardTypes.length)];
    io.to(room.id).emit('game-started', game);
  });
  socket.on('drop-cards', (room, game, move) => {
    const players = getRoom(room.id).players;
    const playersNames = players.map(p => p.username);
    const nextPlayer = players[playersNames.indexOf(room.mainPlayer.username) + 1] || players[0];
    let newTurn = undefined;
    if (move.callLiar) {
      if (game.table.cards.every(x => x.values.includes(game.cardType))) {
        game.hands.find(x => x.username !== game.table.playedBy).life--;
      } else {
        game.hands.find(x => x.username !== room.mainPlayer.username).life--;
      }

      // turno aleatório
      newTurn = players[Math.floor(Math.random() * players.length)].username;

      // zerar mesa
      game.table.playedBy = undefined;
      game.table.cards = [];

      // distribuir novas cartas
      game.hands.forEach(p => {
        p.hand = game.deck.splice(0, 5);
      });

      // novo naipe na mesa
      game.cardType = game.cardTypes[Math.floor(Math.random() * game.cardTypes.length)];
    } else {
      // nova mão (caras subtraídas)
      const newHand = move.cardsLeft;
      game.hands.find(x => x.username === room.mainPlayer.username).hand = newHand;

      // setar jogada (cartas na mesa e quem as jogou)
      game.table.playedBy = room.mainPlayer.username;
      game.table.cards = move.cardsDropped;

      // novo turno (próximo jogador)
      newTurn = nextPlayer.username;
    }
    game.turn = newTurn;
    io.to(room.id).emit('cards-dropped', game);
  });
  socket.on('avatar-change', ({ id, changeForUser, players, avatar }) => {
    players.find(x => x.username === changeForUser).avatar = avatar;
    io.to(id).emit('avatar-changed', players);
  })
});

const port = process.env.PORT || 3001
server.listen(port, () => {
  console.log(`Listening on ${port}`);
});