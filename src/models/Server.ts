import Room from "./Room.js";

export default class Server {
    rooms: Array<Room> = [];
    
    getRoom(roomId: string): Room | undefined {
        return this.rooms.find(x => x.id === roomId);
    }

    addRoom(room: Room): void {
        this.rooms.push(room);
    }

    removeRoom(roomId: string): void {
        this.rooms = this.rooms.filter(x => x.id !== roomId);
    }

    playersOnline(): number {
        return this.rooms.reduce((acc, room) => acc + room.players.length, 0);
    }
}