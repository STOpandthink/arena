import { HAND_TYPES, SUITS, ACTIONS, SYMBOLS, } from "/imports/api/consts";
import { getBlankCard, getNewItem, computeHand, compareHands, getRandomCardFromDeck } from "./game_utils"
import { daggerLogic } from "./items"

function gameLogic(game) {
    const hand1 = computeHand(game.sharedCard, game.player1.card1, game.player1.card2)
    const hand2 = computeHand(game.sharedCard, game.player2.card1, game.player2.card2)
    const comp = compareHands(hand1, hand2)
    const isTie = comp === 0
    if (game.player1.action !== game.player2.action) {
        // One player attacked and one defended
        const [attacker, defender] = game.player1.action === ACTIONS.ATTACK ? [game.player1, game.player2] : [game.player2, game.player1]
        if (game.turn == 1) {
            const damage = Math.floor(game.c.HALF_DAMAGE_MULT * attacker.damage)
            game[`player${attacker.index}`].goldDelta += damage
            game[`player${defender.index}`].healthDelta -= damage
        } else {
            const damage = Math.floor(game.c.FULL_DAMAGE_MULT * attacker.damage)
            game[`player${attacker.index}`].goldDelta += damage
            game[`player${defender.index}`].healthDelta -= damage
        }
    } else if (isTie || (game.player1.action !== ACTIONS.ATTACK && game.player2.action !== ACTIONS.ATTACK)) {
        // Tie OR Both players defended
    } else if (game.player1.action === ACTIONS.ATTACK && game.player2.action === ACTIONS.ATTACK) {
        // Both players went all in
        const [winner, loser] = comp > 0 ? [game.player1, game.player2] : [game.player2, game.player1]
        const damage = Math.floor(game.c.ALL_IN_MULTIPLIER * winner.damage)
        game[`player${winner.index}`].goldDelta += damage
        game[`player${loser.index}`].healthDelta -= damage
    } else {
        throw new Error(`Unhandled case ${game}`)
    }
}

export async function runGame(game, updateFn, isSimulation, useAi=true) {
    if (game.ultimateWinnerIndex !== undefined) return;

    const players = [game.player1, game.player2]
    if (game.player1.action <= ACTIONS.NONE) game.player1.action = ACTIONS.DEFEND;
    if (game.player2.action <= ACTIONS.NONE) game.player2.action = ACTIONS.DEFEND;
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

        for (let player of players) {
            player.card3 = getBlankCard();
            player.card4 = getBlankCard();
            player.lastAction = ACTIONS.NONE
            player.theirLastAction = ACTIONS.NONE
        }
    }

    // Update HP and gold
    game.player1.goldDelta = 0
    game.player2.goldDelta = 0
    game.player1.healthDelta = 0
    game.player2.healthDelta = 0
    if (isRoundOver) {
        gameLogic(game)
        daggerLogic(game)
    }

    // Update basic gameplay
    game.round = isRoundOver ? game.round + 1 : game.round
    game.turn = isRoundOver ? 1 : 2

    // Update players' cards
    if (isRoundOver) {
        game.player1.card1 = getRandomCardFromDeck(game.player1.deck)
        game.player2.card1 = getRandomCardFromDeck(game.player2.deck)
        game.player1.card2 = getBlankCard()
        game.player2.card2 = getBlankCard()
        game.sharedCard = getRandomCardFromDeck(game.sharedDeck);
    } else {
        game.player1.card2 = getRandomCardFromDeck(game.player1.deck)
        game.player2.card2 = getRandomCardFromDeck(game.player2.deck)
    }

    // Update items
    if (isRoundOver) {
        for (const [i, item] of game.items.entries()) {
            if (item.cost <= 10) item.cost -= 1;
            else if (item.cost <= 20) item.cost -= 2;
            else item.cost -= 4;
            if (item.cost < 0 || item.boughtByP1 || item.boughtByP2) {
                game.items[i] = getNewItem(game, i)
            }
        }
    }

    // Player 1 AI
    game.player1.action = ACTIONS.NONE
    game.player2.action = ACTIONS.NONE
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

    for (let pi = 1; pi <= 2; pi++) {
        players[pi - 1].health += players[pi - 1].healthDelta
    }
    const isMatchOver = (game.player1.health <= 0 || game.player2.health <= 0) && game.player1.health !== game.player2.health
    if (isMatchOver) {
        const winner = game.player1.health > game.player2.health ? game.player1 : game.player2
        winner.goldDelta += Math.max(0, winner.health) + game.c.GOLD_FOR_WIN
        winner.victories++
        if (game.match > game.c.MATCHES_UNTIL_END) {
            // This was the final match
            game.ultimateWinnerIndex = winner.index
        } else if (Math.abs(game.player1.victories - game.player2.victories) >= game.c.WIN_DISCREPANCY) {
            // Win through more
            game.ultimateWinnerIndex = game.player1.victories > game.player2.victories ? game.player1.index : game.player2.index
        } else {
            game.match++
        }
    }
    for (let pi = 1; pi <= 2; pi++) {
        players[pi - 1].gold += players[pi - 1].goldDelta
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