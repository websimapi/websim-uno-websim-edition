import { COLORS } from './cards.js';

export class AIPlayer {
    chooseCard(playableCards, topCard, currentColor) {
        if (playableCards.length === 0) return null;

        // Priority system for AI card selection
        let bestCard = null;
        let bestScore = -1;

        playableCards.forEach(card => {
            let score = 0;

            // Prefer number cards over special cards generally
            if (card.type === 'number') score += 1;

            // Prefer playing same color over same number
            if (card.color === currentColor) score += 2;

            // Special card priorities
            if (card.value === 'skip') score += 3;
            if (card.value === 'reverse') score += 2;
            if (card.value === 'draw2') score += 4;

            // Wild cards are powerful but save for when needed
            if (card.type === 'wild') {
                if (playableCards.length === 1) {
                    score += 10; // Must play if only option
                } else {
                    score -= 2; // Prefer not to play if other options
                }
            }

            // Wild draw 4 is most powerful
            if (card.value === 'wildDraw4') {
                if (playableCards.length === 1) {
                    score += 15;
                } else {
                    score -= 1; // Save for crucial moments
                }
            }

            if (score > bestScore) {
                bestScore = score;
                bestCard = card;
            }
        });

        return bestCard;
    }

    pickWildColor(hand) {
        // Count colors in hand
        const colorCounts = {};
        COLORS.forEach(color => colorCounts[color] = 0);

        hand.forEach(card => {
            if (COLORS.includes(card.color)) {
                colorCounts[card.color]++;
            }
        });

        // Pick color with most cards
        let bestColor = COLORS[0];
        let bestCount = colorCounts[bestColor];

        COLORS.forEach(color => {
            if (colorCounts[color] > bestCount) {
                bestCount = colorCounts[color];
                bestColor = color;
            }
        });

        return bestColor;
    }
}

