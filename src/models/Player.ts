export default class Player {
    id: string = '';
    username: string = '';
    avatar: number = 0;

    constructor(id: string, username: string, avatar: number) {
        this.id = id;
        this.username = username;
        this.avatar = avatar;
    }
}
