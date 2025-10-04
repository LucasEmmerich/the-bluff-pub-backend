import Game from "./Game.js";
import Player from "./Player.js";

export default class Room {
    MAX_PLAYER_CAPACITY: number = 4;
    id: string = '';
    roomOwner?: Player = undefined;
    players: Array<Player> = [];
    game?: Game;

    constructor(id: string, roomOwner: Player) {
        this.id = id;
        this.roomOwner = roomOwner;
        this.players = [roomOwner];
    }

    getPlayer(playerId: string): Player {
        const player = this.players.find(x => x.id === playerId);
        if (!player) throw new Error('Jogador não encontrado na sala.');
        return player;
    }

    addPlayer(player: Player): void {
        if (this.cantJoin()) throw new Error('A sala está cheia.');
        if (this.isInside(player.id)) throw new Error('Jogador já está na sala.');
        this.players.push(player);
    }

    removePlayer(playerId: string): Player {
        const player = this.getPlayer(playerId);
        if (this.isOwner(playerId)) this.changeRoomOwner(this.players.find(x => x.id !== playerId)!);
        this.players = this.players.filter(x => x.id !== playerId);
        return player;
    }

    private isOwner(playerId: string): boolean {
        return this.roomOwner?.id === playerId;
    }

    private changeRoomOwner(roomOwner: Player): void {
        this.roomOwner = roomOwner;
    }

    private isInside(playerId: string): boolean {
        return this.players.some(x => x.id === playerId);
    }

    private cantJoin(): boolean {
        return this.players.length >= this.MAX_PLAYER_CAPACITY;
    }
    
}