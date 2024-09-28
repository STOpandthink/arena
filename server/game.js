import { HAND_TYPES, SUITS, ACTIONS, SYMBOLS, } from "/imports/api/consts";

function populateDefaultDeck(game, deck) {
    for (let value = 1; value <= game.c.VALUE_COUNT; value++) {
        for (let suit = 1; suit <= game.c.SUIT_COUNT; suit++) {
            deck.push({value: value, suit: suit})
        }
    }
}

export function getNewPlayer(game, playerId, index) {
    const player = {
        id: playerId,
        isReady: false,
        index: index,
        action: ACTIONS.DEFEND,
        lastAction: ACTIONS.DEFEND,
        theirLastAction: ACTIONS.DEFEND,
        card1: { value: 0, suit: SUITS.BLANK },
        card2: { value: 0, suit: SUITS.BLANK },
        card3: { value: 0, suit: SUITS.BLANK },
        card4: { value: 0, suit: SUITS.BLANK },
        goldCard: { value: 0 },
        victories: 0,
        health: game.c.STARTING_HEALTH,
        healthDelta: 0,
        damage: 10,
        gold: 0,
        goldDelta: 0,
        items: [],
        deck: [],
        symbolCounts: [],
    };
    for (let i = 1; i < SYMBOLS.MAX; i++) {
        player.symbolCounts.push(0)
    }
    populateDefaultDeck(game, player.deck)
    return player
}

function getNewItem(game, index) {
    const item = {
        index: index,
        "type": "card",
        "cost": 15,
        "symbols": [],
        ...getRandomCard(game),
    }
    for (let i = 0; i < getRandInt(0, 2); i++) {
        item.symbols.push(getRandInt(1, SYMBOLS.MAX - 1))
    }
    item.cost += item.value + 5 * item.symbols.length
    return item;
}

export function getNewGame(player1UserId) {
    const game = {
        c: {
            GAME_TICK: 2500,
            STARTING_HEALTH: getRandInt(150, 250), // 200,
            MAX_ITEMS_FOR_SALE: 5,
            ALL_IN_MULTIPLIER: getRandInt(25, 35) / 10, // 3.0
            FULL_DAMAGE_MULT: getRandInt(7, 13) / 10, // 1.0
            HALF_DAMAGE_MULT: getRandInt(3, 6) / 10, // 0.45
            GOLD_FOR_WIN: getRandInt(4, 10) * 10, //
            VALUE_COUNT: getRandInt(10, 20), // 10
            SUIT_COUNT: getRandInt(2, 4), // 2
            MATCHES_UNTIL_END: getRandInt(4, 8),
            WIN_DISCREPANCY: getRandInt(3, 6),
            FINAL_MATCH_HP_MULT: getRandInt(20, 40) / 10,
        },
        name: "game",
        text: "Waiting for 1 more player...",
        sharedCard: { value: 0, suit: SUITS.BLANK }, sharedGoldCard: { value: 0 },
        match: 1, round: 0, turn: 1,
        createdAt: new Date(), lastTick: new Date(),
        items: [],
        sharedDeck: [],
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

function revCompareNumbers(a, b) {
    return b - a;
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

function getRand(min, max) {
    return Math.random() * (max - min + 1) + min;
}

function getRandInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomCard(game) {
    return { value: getRandInt(1, game.c.VALUE_COUNT), suit: getRandInt(1, game.c.SUIT_COUNT) };
}

function getRandomCardFromDeck(deck) {
    return structuredClone(deck[getRandInt(0, deck.length - 1)])
}

function gameLogic(game) {
    const hand1 = computeHand(game.sharedCard, game.player1.card1, game.player1.card2)
    const hand2 = computeHand(game.sharedCard, game.player2.card1, game.player2.card2)
    const comp = compareHands(hand1, hand2)
    const isTie = comp === 0
    if (game.player1.action !== game.player2.action) {
        // One player attacked and one defended
        const [attacker, defender] = game.player1.action === ACTIONS.ATTACK ? [game.player1, game.player2] : [game.player2, game.player1]
        game.player1.goldDelta += game.player1.goldCard.value
        game.player2.goldDelta += game.player2.goldCard.value
        if (game.turn == 1) {
            game[`player${defender.index}`].healthDelta -= Math.floor(game.c.HALF_DAMAGE_MULT * attacker.damage)
        } else {
            game[`player${attacker.index}`].goldDelta += game.sharedGoldCard.value
            game[`player${defender.index}`].healthDelta -= Math.floor(game.c.FULL_DAMAGE_MULT * attacker.damage)
        }
    } else if (isTie || (game.player1.action !== ACTIONS.ATTACK && game.player2.action !== ACTIONS.ATTACK)) {
        // Tie OR Both players defended
        game.player1.goldDelta += game.player1.goldCard.value
        game.player2.goldDelta += game.player2.goldCard.value
    } else if (game.player1.action === ACTIONS.ATTACK && game.player2.action === ACTIONS.ATTACK) {
        // Both players went all in
        const [winner, loser] = comp > 0 ? [game.player1, game.player2] : [game.player2, game.player1]
        const allGold = game.player1.goldCard.value + game.player2.goldCard.value + game.sharedGoldCard.value
        game[`player${winner.index}`].goldDelta += allGold
        game[`player${loser.index}`].healthDelta -= Math.floor(game.c.ALL_IN_MULTIPLIER * winner.damage)
    } else {
        throw new Error(`Unhandled case ${game}`)
    }
}

export async function runGame(game, updateFn, isSimulation, useAi=true) {
    if (game.ultimateWinnerIndex !== undefined) return;

    const players = [game.player1, game.player2]
    let isRoundOver = game.turn == 2;
    isRoundOver ||= game.player1.action !== ACTIONS.ATTACK || game.player2.action !== ACTIONS.ATTACK;

    // Update this here, because if there is an all in, we want to see the actions during the pause
    game.player1.lastAction = game.player1.action
    game.player1.theirLastAction = game.player2.action
    game.player2.lastAction = game.player2.action
    game.player2.theirLastAction = game.player1.action

    if (!isSimulation && game.turn == 2 && game.player1.action === ACTIONS.ATTACK && game.player2.action === ACTIONS.ATTACK) {
        // NOTE: so, to make it easier for us, we never subscribe to opponents' cards. Instead we just have additional info per player that
        // is sometimes (here) explicitly set to mirror the opponents' cards
        // Reveal all cards
        game.player1.card3 = structuredClone(game.player2.card2);
        game.player1.card4 = structuredClone(game.player2.card1);
        game.player2.card3 = structuredClone(game.player1.card2);
        game.player2.card4 = structuredClone(game.player1.card1);

        updateFn()
        await new Promise(r => setTimeout(r, 3000))

        game.player1.card3.suit = SUITS.BLANK;
        game.player1.card4.suit = SUITS.BLANK;
        game.player2.card3.suit = SUITS.BLANK;
        game.player2.card4.suit = SUITS.BLANK;
        game.player1.lastAction = -1
        game.player1.theirLastAction = -1
        game.player2.lastAction = -1
        game.player2.theirLastAction = -1
    }

    // Update HP and gold
    game.player1.goldDelta = 0
    game.player2.goldDelta = 0
    game.player1.healthDelta = 0
    game.player2.healthDelta = 0
    if (isRoundOver) {
        gameLogic(game)
    }

    // Update basic gameplay
    game.round = isRoundOver ? game.round + 1 : game.round
    game.turn = isRoundOver ? 1 : 2

    // Update players' cards
    if (isRoundOver) {
        game.player1.card1 = getRandomCardFromDeck(game.player1.deck)
        game.player2.card1 = getRandomCardFromDeck(game.player2.deck)
        game.player1.card2.value = 0;
        game.player2.card2.value = 0;
        game.player1.card2.suit = SUITS.BLANK;
        game.player2.card2.suit = SUITS.BLANK;
    } else {
        game.player1.card2 = getRandomCardFromDeck(game.player1.deck)
        game.player2.card2 = getRandomCardFromDeck(game.player2.deck)
    }

    // Update gold and shared cards
    if (isRoundOver) {
        if (game.round % 2 == 0) {
            // We swap gold cards for both players and keep the shared cards the same
            [game.player1.goldCard.value, game.player2.goldCard.value] = [game.player2.goldCard.value, game.player1.goldCard.value];
        } else {
            // We regenerate all gold cards and the shared cards
            game.player1.goldCard.value = getRandInt(1, 3);
            game.player2.goldCard.value = getRandInt(1, 3);
            game.sharedGoldCard.value = getRandInt(1, 5);
            game.sharedCard = getRandomCardFromDeck(game.sharedDeck);
        }
    }

    // Update items
    if (isRoundOver) {
        for (const [i, item] of game.items.entries()) {
            item.cost -= 1;
            if (item.cost < 0 || item.boughtByP1 || item.boughtByP2) {
                game.items[i] = getNewItem(game, i)
            }
        }
    }

    // Player 1 AI
    game.player1.action = ACTIONS.DEFEND
    game.player2.action = ACTIONS.DEFEND
    if (useAi) {
        if (isRoundOver) {
            game.player1.action = (
                (game.player1.card1.value >= 7 && game.player1.card1.suit == game.sharedCard.suit) ||
                (game.player1.card1.value >= 7 && game.player1.card1.suit != game.sharedCard.suit) ||
                game.player1.card1.value == game.sharedCard.value)
                ? ACTIONS.ATTACK : ACTIONS.DEFEND
        } else {
            const hand1 = computeHand(game.sharedCard, game.player1.card1, game.player1.card2)
            const thresholdHand = { type: HAND_TYPES.PAIR, values: [2, 1, 1] }
            game.player1.action = compareHands(hand1, thresholdHand) >= 0 ? ACTIONS.ATTACK : ACTIONS.DEFEND
            // console.log(`Has ${JSON.stringify(hand1)} from ${JSON.stringify([game.sharedCard, game.player1.card1, game.player2.card2])} -> ${game.player1.action }`)
        }
    }

    const isMatchOver = (game.player1.health <= 0 || game.player2.health <= 0) && game.player1.health !== game.player2.health
    if (isMatchOver) {
        const winner = game.player1.health > game.player2.health ? game.player1 : game.player2
        winner.goldDelta += game.c.GOLD_FOR_WIN
        winner.victories++
        if (game.match > game.c.MATCHES_UNTIL_END) {
            // This was the final match
            game.ultimateWinnerIndex = winner.index
        } else if (Math.abs(game.player1.victories - game.player2.victories) > game.c.WIN_DISCREPANCY) {
            // Win through more
            game.ultimateWinnerIndex = game.player1.victories > game.player2.victories ? game.player1.index : game.player2.index
        } else {
            game.match++
        }
    }
    for (let pi = 1; pi <= 2; pi++) {
        players[pi - 1].gold += players[pi - 1].goldDelta
        players[pi - 1].health += players[pi - 1].healthDelta
    }

    // NOTE: always update `lastTick` last to give players maximum time
    if (!isSimulation && isMatchOver && game.ultimateWinnerIndex === undefined) {
        updateFn()
        await new Promise(r => setTimeout(r, 5000))
        game.player1.health = game.c.STARTING_HEALTH
        game.player2.health = game.c.STARTING_HEALTH
        if (game.match > game.c.MATCHES_UNTIL_END) {
            // Final match
            game.player1.health *= game.c.FINAL_MATCH_HP_MULT
            game.player2.health *= game.c.FINAL_MATCH_HP_MULT
        }
    }
    game.lastTick = new Date()
    updateFn()
    return game.c.GAME_TICK
}