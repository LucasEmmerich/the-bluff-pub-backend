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
    cards: Card[];
    life: number;
};

type Table = {
    cards: Card[];
    moves: Move[];
}

export type Move = {
    player: Player;
    cardsDropped: Card[];
    liarCall: boolean;
}

export default class Game {
    round: number;
    cardTypes: Array<'King' | 'Queen' | 'Ace'> = ['King', 'Queen', 'Ace'];
    cardType: 'King' | 'Queen' | 'Ace';
    players: Player[];
    turn: Player;
    matchStarted: boolean;
    deck: Card[];
    hands: Hand[];
    table: Table = { cards: [], moves: [] };

    constructor(players: Player[]) {
        this.players = players;
        this.matchStarted = true;
        this.round = 1;
        this.deck = this.getShuffledDeck();
        this.cardType = this.getRandomInitialTableCardType();
        this.turn = this.getRandomInitialPlayer();
        this.hands = this.getRandomHands();
    }

    private getShuffledDeck = (): Card[] => [...DECK].sort(() => Math.random() - 0.5);
    private getRandomInitialTableCardType = (): 'King' | 'Queen' | 'Ace' => this.cardTypes[Math.floor(Math.random() * this.cardTypes.length)];
    private getRandomInitialPlayer = (): Player => this.players[Math.floor(Math.random() * this.players.length)];
    private getRandomHands = (): Hand[] => {
        const hands: Hand[] = [];
        for (const p of this.players) {
            hands.push({
                player: p,
                cards: this.deck.splice(0, 5),
                life: INITIAL_PLAYER_LIFE
            });
        }
        return hands;
    }

    private removeCardsFromPlayerHand = (move: Move) => {
        const hand = this.hands.find(h => h.player.id === move.player.id);
        hand!.cards = hand!.cards.filter(c => !move.cardsDropped.some(dropped => dropped.id === c.id));
    }

    private dropcards = (move: Move) => {
        this.table.cards = move.cardsDropped;
        this.table.moves.push(move)
    }

    private setNextPlayer = () => {
        const currentIndex = this.players.findIndex(p => p.id === this.turn.id);
        this.turn = this.players[(currentIndex + 1) % this.players.length];
    }

    private nextRound = () => this.round++;
    private getLastMove = (): Move => this.table.moves[this.table.moves.length - 1];
    private getPreviousHand = (): Hand => this.hands.find(h => h.player.id === this.getLastMove().player.id)!;
    private getCurrentHand = (): Hand => this.hands.find(h => h.player.id === this.turn.id)!
    private lastPlayerBluffed = (): boolean => !this.table.cards.every(card => card.values.includes(this.cardType));
    private damagePlayer = (hand: Hand) => hand!.life--;

    public dropCards(move: Move) {
        this.removeCardsFromPlayerHand(move);
        this.dropcards(move);
        this.setNextPlayer();
        this.nextRound();
    }

    // public callBluff(move: Player) {
    //     const [lastHand, currentHand] = [this.getPreviousHand(), this.getCurrentHand()];
    //     const loserHand = this.lastPlayerBluffed() ? lastHand : currentHand;
    //     this.damagePlayer(loserHand);
    // }
};