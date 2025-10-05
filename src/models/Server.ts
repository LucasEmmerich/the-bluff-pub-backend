import Room from "./Room.js";
import { Server as SocketIOServer } from "socket.io";
export default class Server {
    private io: SocketIOServer;
    rooms: Array<Room> = [];

    constructor(io: SocketIOServer) {
        this.io = io;
        this.registerEvents();
    }

    registerEvents(): void {
        setInterval(this.cleanEmptyRooms, 60000);
        setInterval(this.updateServerInfo, 10000);
        console.log('Server events registered.');
    }
    
    public getRoom = (roomId: string) => this.rooms.find(x => x.id === roomId)!;

    public addRoom = (room: Room) => this.rooms.push(room);

    private cleanEmptyRooms = () => {
        this.rooms = this.rooms.filter(x => x.players.length > 0);
    }

    private updateServerInfo = () => {
        const serverInfo =  { 
            players: this.rooms.reduce((acc, room) => acc + room.players.length, 0), 
            rooms: this.rooms.length 
        };
        this.io.emit('server-info', serverInfo);
    }
}