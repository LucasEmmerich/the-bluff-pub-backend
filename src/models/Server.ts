import Room from "./Room.js";

export default class Server {
    rooms: Array<Room> = [];
    
    getRoom(roomId: string): Room {
        const room = this.rooms.find(x => x.id === roomId);
        if (!room) throw new Error('Sala não encontrada.');
        return room;
    }

    addRoom(room: Room): void {
        this.rooms.push(room);
    }

    cleanEmptyRooms(): void {
        this.rooms = this.rooms.filter(x => x.players.length > 0);
    }

    playersOnline(): number {
        return this.rooms.reduce((acc, room) => acc + room.players.length, 0);
    }
}