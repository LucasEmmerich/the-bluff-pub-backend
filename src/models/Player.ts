export default class Player {
    id: string = '';
    username: string = '';
    avatar: string = '';
    constructor(id: string, username: string, avatar: string) {
        this.id = id;
        this.username = username;
        this.avatar = avatar;
    }
}