import Game from './Game.js';
import Player from './Player.js';

export type LeaderboardEntry = { player: Player; wins: number };

export default class Room {
    MAX_PLAYER_CAPACITY: number = 4;
    id: string = '';
    roomOwner?: Player = undefined;
    players: Array<Player> = [];
    game?: Game;
    leaderboard: Array<LeaderboardEntry> = [];

    constructor(id: string, roomOwner: Player) {
        this.id = id;
        this.roomOwner = roomOwner;
        this.players = [roomOwner];
        this.leaderboard = [{ player: roomOwner, wins: 0 }];
    }

    ensurePlayersInLeaderboard(): void {
        for (const player of this.players) {
            if (!this.leaderboard.some((e) => e.player.id === player.id)) {
                this.leaderboard.push({ player, wins: 0 });
            }
        }
    }

    recordWin(winnerId: string): void {
        const entry = this.leaderboard.find((e) => e.player.id === winnerId);
        if (entry) entry.wins++;
    }

    getPlayer(playerId: string): Player {
        const player = this.players.find((x) => x.id === playerId);
        if (!player) throw new Error('Jogador não encontrado na sala.');
        return player;
    }

    addPlayer(player: Player): void {
        if (this.cantJoin()) throw new Error('A sala está cheia.');
        if (this.isInside(player.id)) throw new Error('Jogador já está na sala.');
        if (this.isUsernameTaken(player.username))
            throw new Error(`The name "${player.username}" is already taken in this room.`);
        this.players.push(player);
    }

    removePlayer(playerId: string): Player {
        const player = this.getPlayer(playerId);
        this.players = this.players.filter((x) => x.id !== playerId);
        if (this.isOwner(playerId) && this.players.length > 0) {
            this.roomOwner = this.players[Math.floor(Math.random() * this.players.length)];
        }
        return player;
    }

    private isOwner(playerId: string): boolean {
        return this.roomOwner?.id === playerId;
    }

    private isInside(playerId: string): boolean {
        return this.players.some((x) => x.id === playerId);
    }

    private isUsernameTaken(username: string): boolean {
        return this.players.some((x) => x.username?.toLowerCase() === username?.toLowerCase());
    }

    private cantJoin(): boolean {
        return this.players.length >= this.MAX_PLAYER_CAPACITY;
    }
}
