import Room from './Room.js';
import { Server as SocketIOServer } from 'socket.io';

export default class Server {
    private io: SocketIOServer;
    private activeSessions: Map<string, string>;
    rooms: Array<Room> = [];

    constructor(io: SocketIOServer, activeSessions: Map<string, string>) {
        this.io = io;
        this.activeSessions = activeSessions;
        this.registerEvents();
    }

    registerEvents(): void {
        setInterval(this.cleanEmptyRooms, 60000);
        setInterval(this.updateServerInfo, 10000);
        console.log('Server events registered.');
    }

    public getRoom = (roomId: string) => this.rooms.find((x) => x.id === roomId)!;

    public findRoomBySocketId = (socketId: string) => this.rooms.find((r) => r.players.some((p) => p.id === socketId));

    public addRoom = (room: Room) => this.rooms.push(room);

    public removeRoom = (roomId: string) => {
        this.rooms = this.rooms.filter((r) => r.id !== roomId);
    };

    private cleanEmptyRooms = () => {
        this.rooms = this.rooms.filter((x) => x.players.length > 0);
    };

    public getServerInfo = () => ({
        online: this.activeSessions.size,
        playing: this.rooms.reduce((acc, room) => acc + room.players.length, 0),
        rooms: this.rooms.length,
    });

    private updateServerInfo = () => {
        this.io.emit('server-info', this.getServerInfo());
    };
}
