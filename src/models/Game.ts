import Player from "../models/Player.js";

const DECK: Array<Card> = [
    { id: 1, name: 'King', values: ['King'], img: '/cards/king.png' },
    { id: 2, name: 'King', values: ['King'], img: '/cards/king.png' },
    { id: 3, name: 'King', values: ['King'], img: '/cards/king.png' },
    { id: 4, name: 'King', values: ['King'], img: '/cards/king.png' },
    { id: 5, name: 'King', values: ['King'], img: '/cards/king.png' },
    { id: 6, name: 'King', values: ['King'], img: '/cards/king.png' },
    { id: 7, name: 'Queen', values: ['Queen'], img: '/cards/queen.png' },
    { id: 8, name: 'Queen', values: ['Queen'], img: '/cards/queen.png' },
    { id: 9, name: 'Queen', values: ['Queen'], img: '/cards/queen.png' },
    { id: 10, name: 'Queen', values: ['Queen'], img: '/cards/queen.png' },
    { id: 11, name: 'Queen', values: ['Queen'], img: '/cards/queen.png' },
    { id: 12, name: 'Queen', values: ['Queen'], img: '/cards/queen.png' },
    { id: 13, name: 'Ace', values: ['Ace'], img: '/cards/ace.png' },
    { id: 14, name: 'Ace', values: ['Ace'], img: '/cards/ace.png' },
    { id: 15, name: 'Ace', values: ['Ace'], img: '/cards/ace.png' },
    { id: 16, name: 'Ace', values: ['Ace'], img: '/cards/ace.png' },
    { id: 17, name: 'Ace', values: ['Ace'], img: '/cards/ace.png' },
    { id: 18, name: 'Ace', values: ['Ace'], img: '/cards/ace.png' },
    { id: 19, name: 'Joker', values: ['King', 'Queen', 'Ace'], img: '/cards/joker.png' },
    { id: 20, name: 'Joker', values: ['King', 'Queen', 'Ace'], img: '/cards/joker.png' },
];

const INITIAL_PLAYER_LIFE: number = 3;

type Card = {
    id: number;
    name: string;
    values: string[];
    img: string;
    selected?: boolean;
};

type Hand = {
    player: Player;
    hand: Card[];
    life: number;
};

export default class Game {
    round: number;
    cardTypes: Array<'King' | 'Queen' | 'Ace'> = ['King', 'Queen', 'Ace'];
    cardType: 'King' | 'Queen' | 'Ace';
    players: Player[];
    turnPlayer: Player;
    matchStarted: boolean;
    deck: Card[];
    hands: Hand[];

    constructor(players: Player[]) {
        this.players = players;

        this.matchStarted = true;
        this.round = 1;

        this.deck = this.getShuffledDeck();
        this.cardType = this.getRandomInitialTableCardType();
        this.hands = this.getRandomHands();
        this.turnPlayer = this.getRandomInitialPlayer();
    }

    private getShuffledDeck = (): Card[] => {
        this.deck = [...DECK];
        return this.deck.sort(() => Math.random() - 0.5);
    }
    private getRandomInitialTableCardType = (): 'King' | 'Queen' | 'Ace' => this.cardTypes[Math.floor(Math.random() * this.cardTypes.length)];
    private getRandomHands = (): Hand[] => {
        const hands: Hand[] = [];
        for (const p of this.players) {
            hands.push({
                player: p,
                hand: this.deck.splice(0, 5),
                life: INITIAL_PLAYER_LIFE
            });
        }
        return hands;
    }
    private getRandomInitialPlayer = (): Player => this.players[Math.floor(Math.random() * this.players.length)]
};