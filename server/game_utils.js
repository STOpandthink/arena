import { revCompareNumbers, getRandInt } from "/imports/api/utils";
import { HAND_TYPES, SUITS, ACTIONS, SYMBOLS, } from "/imports/api/consts";

function populateDefaultDeck(game, deck) {
    deck.values = []
    for (let value = 0; value < game.c.VALUE_COUNT; value++) {
        deck.values.push(100 / game.c.VALUE_COUNT)
    }
    deck.suits = []
    for (let suit = 0; suit < game.c.SUIT_COUNT; suit++) {
        deck.suits.push(100 / game.c.SUIT_COUNT)
    }
}

export function getBlankCard() {
    return { value: -1, suit: SUITS.BLANK }
}

export function getNewPlayer(game, playerId, index) {
    const player = {
        id: playerId,
        isReady: index === 1,
        index: index,
        action: ACTIONS.NONE,
        lastAction: ACTIONS.NONE,
        theirLastAction: ACTIONS.NONE,
        card1: getBlankCard(),
        card2: getBlankCard(),
        card3: getBlankCard(),
        card4: getBlankCard(),
        victories: 0,
        health: game.c.STARTING_HEALTH,
        healthDelta: 0,
        damage: 10,
        gold: 0,
        goldDelta: 0,
        items: [],
        deck: {},
        symbolCounts: [],
    };
    for (let i = 1; i < SYMBOLS.COUNT; i++) {
        player.symbolCounts.push(0)
    }
    populateDefaultDeck(game, player.deck)
    return player
}

export function getNewItem(game, index) {
    const item = {
        index: index,
        "type": "card",
        "cost": 25,
        "symbol": getRandInt(0, SYMBOLS.COUNT),
        "card": getBlankCard(),
    }
    if (Math.random() <= 0.5) {
        item.card.value = getRandInt(0, game.c.VALUE_COUNT)
        item.card.suit = SUITS.GENERIC
        item.card.cost += item.value
    } else {
        item.card.value = -1
        item.card.suit = getRandInt(0, game.c.SUIT_COUNT)
        item.card.cost += 5
    }
    return item;
}

export function getNewGame(player1UserId) {
    const game = {
        c: {
            GAME_TICK: 2500,
            STARTING_HEALTH: 150,
            MAX_ITEMS_FOR_SALE: 5,
            ALL_IN_MULTIPLIER: getRandInt(25, 36) / 10, // 3.0
            FULL_DAMAGE_MULT: getRandInt(7, 14) / 10, // 1.0
            HALF_DAMAGE_MULT: getRandInt(3, 7) / 10, // 0.45
            GOLD_FOR_WIN: getRandInt(3, 5) * 10, //
            VALUE_COUNT: 10,
            SUIT_COUNT: 4,
            MATCHES_UNTIL_END: 5,
            WIN_DISCREPANCY: 3,
            FINAL_MATCH_HP_MULT: getRandInt(20, 41) / 10,
        },
        name: "game",
        text: "Waiting for 1 more player...",
        sharedCard: getBlankCard(),
        match: 1, round: 0, turn: 1,
        createdAt: new Date(), lastTick: new Date(),
        items: [],
        sharedDeck: {},
    }
    game["player1"] = getNewPlayer(game, player1UserId, 1)
    game["player2"] = getNewPlayer(game, undefined, 2)
    for (let i = 0; i < game.c.MAX_ITEMS_FOR_SALE; i++) {
        const item = getNewItem(game, i)
        item.cost = Math.max(5, item.cost - (game.c.MAX_ITEMS_FOR_SALE - i - 1) * 5)
        game.items.push(item)
    }
    populateDefaultDeck(game, game.sharedDeck)
    return game;
}

export function mlEnvFromGame(game) {
    // Assuming player2 is the AI
    const hand = computeHand(game.sharedCard, game.player2.card1, game.player2.card2)
    let handType = hand.type
    if (game.turn == 1 && hand.type < HAND_TYPES.PAIR && game.player2.card1.suit == game.sharedCard.suit) {
        handType = HAND_TYPES.FLUSH
    }
    let myHandValue = game.player2.card1.value;
    if (game.turn == 2) {
        myHandValue = Math.max(game.player2.card1.value, game.player2.card2.value);
    }
    return [game.turn, handType, myHandValue, myHandValue >= game.sharedCard.value]
}

/* Returns {type: HAND_TYPES, values: [sorted from highest to lowest]} */
export function computeHand(gameCard, playerCard1, playerCard2) {
    const suits = [playerCard1.suit, playerCard2.suit, gameCard.suit];
    const values = [playerCard1.value, playerCard2.value, gameCard.value];
    values.sort(revCompareNumbers);
    let hand = { values }
    if (values[0] == values[1] && values[1] == values[2]) {
        hand["type"] = HAND_TYPES.SET
    } else if (values[0] == values[1] || values[1] == values[2]) {
        hand["type"] = HAND_TYPES.PAIR
    } else if (suits[0] == suits[1] && suits[1] == suits[2]) {
        hand["type"] = HAND_TYPES.FLUSH
    } else {
        hand["type"] = HAND_TYPES.HIGH
    }
    return hand
}

function getTheHandValue(hand) {
    if (hand["type"] = HAND_TYPES.SET) return hand.values[0];
    else if (hand["type"] = HAND_TYPES.PAIR) return hand.values[1];
    else if (hand["type"] = HAND_TYPES.FLUSH) return hand.values[0];
    return hand.values[0]
}

/* Returns 1 if hand1 is stronger than hand2. */
export function compareHands(hand1, hand2) {
    if (hand1.type > hand2.type) {
        return 1;
    } else if (hand1.type < hand2.type) {
        return -1;
    } else if (hand1.type === hand2.type && hand2.type === HAND_TYPES.PAIR) {
        // We take advantage that values are sorted so the middle card is always part of the pair
        const diff = hand1.values[1] - hand2.values[1]
        if (diff != 0) return Math.sign(diff);
        // We take advantage that values are sorted so one of the below diffs will be 0 and one will be for the card that's not part of the pair
        return (hand1.values[0] - hand2.values[0]) + (hand1.values[2] - hand2.values[2])
    }
    for (let i = 0; i < hand1.values.length; i++) {
        const diff = hand1.values[i] - hand2.values[i]
        if (diff != 0) {
            return Math.sign(diff)
        }
    }
    return 0
}

function getRandomCard(game) {
    return { value: getRandInt(1, game.c.VALUE_COUNT), suit: getRandInt(1, game.c.SUIT_COUNT) };
}

export function getRandomCardFromDeck(deck) {
    let r = Math.random() * 100
    let value = 0, suit = 0;
    for (let i = 0; r >= deck.values[i]; i++) {
        r -= deck.values[i]
        value = i + 1
    }
    r = Math.random() * 100
    for (let i = 0; r >= deck.suits[i]; i++) {
        r -= deck.suits[i]
        suit = i + 1
    }
    return {value, suit}
}

export function getPlayerCards(game, player) {
    if (game.turn == 1) return [player.card1]
    else return [player.card1, player.card2]
}

export function getMadeHand(game, player) {
    if (game.turn == 1) return [player.card1, game.sharedCard]
    else return [player.card1, player.card2, game.sharedCard]
}