export const COLORS = ['red', 'yellow', 'green', 'blue'];
export const SPECIAL_CARDS = ['skip', 'reverse', 'draw2'];
export const WILD_CARDS = ['wild', 'wildDraw4'];

export class Card {
    constructor(color, value, type = 'number') {
        this.color = color;
        this.value = value;
        this.type = type; // 'number', 'special', 'wild'
    }

    canPlayOn(topCard, currentColor) {
        if (this.type === 'wild') return true;
        if (this.color === currentColor) return true;
        if (this.color === topCard.color) return true;
        if (this.value === topCard.value && this.type === topCard.type) return true;
        return false;
    }

    getDisplaySymbol() {
        if (this.type === 'number') return this.value.toString();
        if (this.value === 'skip') return '⊘';
        if (this.value === 'reverse') return '↔';
        if (this.value === 'draw2') return '+2';
        if (this.value === 'wild') return '🌈';
        if (this.value === 'wildDraw4') return '+4';
        return this.value;
    }
}

export class Deck {
    constructor() {
        this.cards = [];
        this.initializeDeck();
        this.shuffle();
    }

    initializeDeck() {
        // Number cards (0-9)
        COLORS.forEach(color => {
            // One 0 per color
            this.cards.push(new Card(color, 0, 'number'));
            
            // Two of each number 1-9 per color
            for (let i = 1; i <= 9; i++) {
                this.cards.push(new Card(color, i, 'number'));
                this.cards.push(new Card(color, i, 'number'));
            }

            // Two of each special card per color
            SPECIAL_CARDS.forEach(special => {
                this.cards.push(new Card(color, special, 'special'));
                this.cards.push(new Card(color, special, 'special'));
            });
        });

        // Wild cards (4 of each)
        for (let i = 0; i < 4; i++) {
            this.cards.push(new Card('wild', 'wild', 'wild'));
            this.cards.push(new Card('wild', 'wildDraw4', 'wild'));
        }
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    draw() {
        if (this.cards.length === 0) {
            // Reshuffle discard pile if deck is empty
            return null;
        }
        return this.cards.pop();
    }

    addCards(cards) {
        this.cards.push(...cards);
        this.shuffle();
    }

    size() {
        return this.cards.length;
    }
}

