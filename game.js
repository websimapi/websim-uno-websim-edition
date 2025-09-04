import { Deck, Card, COLORS } from './cards.js';
import { AIPlayer } from './ai.js';

class UnoGame {
    constructor() {
        this.deck = new Deck();
        this.discardPile = [];
        this.players = [
            { name: 'You', hand: [], isHuman: true },
            { name: 'AI Player 1', hand: [], isHuman: false },
            { name: 'AI Player 2', hand: [], isHuman: false }
        ];
        this.currentPlayer = 0;
        this.direction = 1; // 1 for clockwise, -1 for counter-clockwise
        this.currentColor = null;
        this.gameStarted = false;
        this.pendingDraws = 0; // For draw 2 and draw 4 cards
        
        this.ai = new AIPlayer();
        this.initializeGame();
        this.setupEventListeners();
        this.render();
    }

    initializeGame() {
        // Deal 7 cards to each player
        this.players.forEach(player => {
            for (let i = 0; i < 7; i++) {
                player.hand.push(this.deck.draw());
            }
        });

        // Find first valid starting card (not wild or special)
        let startCard;
        do {
            startCard = this.deck.draw();
        } while (startCard.type !== 'number');

        this.discardPile.push(startCard);
        this.currentColor = startCard.color;
        this.gameStarted = true;
    }

    setupEventListeners() {
        document.getElementById('drawButton').addEventListener('click', () => {
            if (this.currentPlayer === 0) {
                this.drawCard(0);
            }
        });

        document.getElementById('unoButton').addEventListener('click', () => {
            this.callUno();
        });

        // Color picker events
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectWildColor(e.target.dataset.color);
            });
        });
    }

    playCard(playerIndex, cardIndex) {
        // Ensure it's the correct player's turn
        if (playerIndex !== this.currentPlayer) {
            return false;
        }
        
        const player = this.players[playerIndex];
        const card = player.hand[cardIndex];
        const topCard = this.getTopCard();

        if (!card.canPlayOn(topCard, this.currentColor)) {
            return false;
        }

        // Remove card from player's hand
        player.hand.splice(cardIndex, 1);
        
        // Add to discard pile
        this.discardPile.push(card);

        // Handle special cards
        this.handleSpecialCard(card);

        // Check for win
        if (player.hand.length === 0) {
            this.endGame(playerIndex);
            return true;
        }

        // Check if player should call UNO
        if (player.hand.length === 1 && playerIndex === 0) {
            this.enableUnoButton();
        }

        this.render();
        return true;
    }

    handleSpecialCard(card) {
        switch (card.value) {
            case 'skip':
                this.currentColor = card.color;
                this.nextTurn();
                this.nextTurn(); // Skip next player
                break;
            case 'reverse':
                this.currentColor = card.color;
                this.direction *= -1;
                if (this.players.length === 2) {
                    this.nextTurn(); // In 2-player game, reverse acts like skip
                }
                this.nextTurn();
                break;
            case 'draw2':
                this.currentColor = card.color;
                this.pendingDraws += 2;
                this.nextTurn();
                this.forceDraw();
                break;
            case 'wild':
                this.showColorPicker();
                return; // Don't advance turn yet
            case 'wildDraw4':
                this.pendingDraws += 4;
                this.showColorPicker();
                return; // Don't advance turn yet
            default:
                this.currentColor = card.color;
                this.nextTurn();
        }
        
        // Schedule next AI turn if needed
        if (!this.players[this.currentPlayer].isHuman && this.gameStarted) {
            setTimeout(() => {
                this.playAITurn();
            }, 1000);
        }
    }

    showColorPicker() {
        if (this.currentPlayer === 0) {
            // Only show color picker if it's actually the human player's turn
            document.getElementById('colorPicker').style.display = 'block';
            document.getElementById('overlay').style.display = 'block';
        } else {
            // AI picks color
            const color = this.ai.pickWildColor(this.players[this.currentPlayer].hand);
            this.selectWildColor(color);
        }
    }

    selectWildColor(color) {
        this.currentColor = color;
        
        // Only hide color picker if it was shown to human player
        if (this.currentPlayer === 0) {
            document.getElementById('colorPicker').style.display = 'none';
            document.getElementById('overlay').style.display = 'none';
        }
        
        if (this.pendingDraws > 0) {
            this.nextTurn();
            this.forceDraw();
        } else {
            this.nextTurn();
        }
        
        // Schedule AI turn if needed
        if (!this.players[this.currentPlayer].isHuman && this.gameStarted) {
            setTimeout(() => {
                this.playAITurn();
            }, 1000);
        }
        
        this.render();
    }

    forceDraw() {
        const player = this.players[this.currentPlayer];
        for (let i = 0; i < this.pendingDraws; i++) {
            const card = this.deck.draw();
            if (card) player.hand.push(card);
        }
        this.pendingDraws = 0;
        this.nextTurn();
    }

    drawCard(playerIndex) {
        // Ensure it's the correct player's turn
        if (playerIndex !== this.currentPlayer) {
            return;
        }
        
        const card = this.deck.draw();
        if (card) {
            this.players[playerIndex].hand.push(card);
            this.render();
            
            // If it's the human player and they can't play the card, end turn
            if (playerIndex === 0) {
                const topCard = this.getTopCard();
                if (!card.canPlayOn(topCard, this.currentColor)) {
                    this.nextTurn();
                    
                    // Schedule AI turn if needed
                    if (!this.players[this.currentPlayer].isHuman) {
                        setTimeout(() => {
                            this.playAITurn();
                        }, 1000);
                    }
                }
            }
        }
    }

    nextTurn() {
        do {
            this.currentPlayer = (this.currentPlayer + this.direction + this.players.length) % this.players.length;
        } while (this.players.length === 0);
        
        this.disableUnoButton();
        this.render();
        
        // Handle AI turn
        if (!this.players[this.currentPlayer].isHuman) {
            setTimeout(() => {
                this.playAITurn();
            }, 1000);
        }
    }

    playAITurn() {
        const player = this.players[this.currentPlayer];
        const topCard = this.getTopCard();
        
        if (!topCard || !player) {
            console.error('Invalid game state in AI turn');
            this.nextTurn();
            return;
        }
        
        const playableCards = player.hand.map((card, index) => ({ card, index }))
            .filter(item => item.card && item.card.canPlayOn(topCard, this.currentColor));

        if (playableCards.length > 0) {
            const chosenCard = this.ai.chooseCard(playableCards.map(item => item.card), topCard, this.currentColor);
            const matchingCard = playableCards.find(item => item.card === chosenCard);
            
            if (matchingCard) {
                this.playCard(this.currentPlayer, matchingCard.index);
            } else {
                // Fallback: play first available card
                this.playCard(this.currentPlayer, playableCards[0].index);
            }
        } else {
            this.drawCard(this.currentPlayer);
        }
    }

    callUno() {
        // Player called UNO
        this.disableUnoButton();
    }

    enableUnoButton() {
        document.getElementById('unoButton').disabled = false;
    }

    disableUnoButton() {
        document.getElementById('unoButton').disabled = true;
    }

    getTopCard() {
        return this.discardPile[this.discardPile.length - 1];
    }

    endGame(winnerIndex) {
        alert(`${this.players[winnerIndex].name} wins!`);
        // Reset game
        location.reload();
    }

    render() {
        this.renderDeckCount();
        this.renderCurrentPlayer();
        this.renderTopCard();
        this.renderPlayerHand();
        this.renderOpponents();
    }

    renderDeckCount() {
        document.getElementById('deckCount').textContent = this.deck.size();
    }

    renderCurrentPlayer() {
        document.getElementById('currentPlayer').textContent = this.players[this.currentPlayer].name;
    }

    renderTopCard() {
        const topCard = this.getTopCard();
        const topCardElement = document.getElementById('topCard');
        
        topCardElement.className = `card ${this.currentColor}`;
        topCardElement.innerHTML = `
            <div class="card-symbol">${topCard.getDisplaySymbol()}</div>
        `;
    }

    renderPlayerHand() {
        const handElement = document.getElementById('playerHand');
        handElement.innerHTML = '';
        
        const player = this.players[0];
        const topCard = this.getTopCard();
        
        player.hand.forEach((card, index) => {
            const cardElement = document.createElement('div');
            cardElement.className = `card ${card.color === 'wild' ? 'wild' : card.color}`;
            
            const canPlay = card.canPlayOn(topCard, this.currentColor) && this.currentPlayer === 0;
            if (canPlay) {
                cardElement.classList.add('playable');
            }
            
            if (this.currentPlayer !== 0) {
                cardElement.classList.add('disabled');
            }
            
            cardElement.innerHTML = `
                <div class="card-symbol">${card.getDisplaySymbol()}</div>
            `;
            
            if (canPlay) {
                cardElement.addEventListener('click', () => {
                    this.playCard(0, index);
                });
            }
            
            handElement.appendChild(cardElement);
        });
    }

    renderOpponents() {
        this.players.slice(1).forEach((player, index) => {
            const opponentElement = document.getElementById(`opponent${index + 1}`);
            const cardCountElement = opponentElement.querySelector('.card-count');
            cardCountElement.textContent = `${player.hand.length} cards`;
            
            // Highlight current player
            opponentElement.classList.toggle('current-turn', this.currentPlayer === index + 1);
        });
    }
}

// Start the game
document.addEventListener('DOMContentLoaded', () => {
    new UnoGame();
});