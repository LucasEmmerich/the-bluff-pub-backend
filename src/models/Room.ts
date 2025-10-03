import Player from "./Player.js";

export default class Room {
    id: string = '';
    roomOwner?: Player = undefined;
    players: Array<Player> = [];
    constructor(id: string, roomOwner: Player) {
        this.id = id;
        this.roomOwner = roomOwner;
        this.players = [roomOwner];
    }

    addPlayer(player: Player): void {
        this.players.push(player);
    }

    removePlayer(playerId: string): void {
        this.players = this.players.filter(x => x.id !== playerId);
    }

    isInside(playerId: string): boolean {
        return this.players.some(x => x.id === playerId);
    }

    changeRoomOwnerId(roomOwner: Player): void {
        this.roomOwner = roomOwner;
    }
}