import { HAND_TYPES, SUITS, ACTIONS, SYMBOLS, } from "/imports/api/consts";
import { getPlayerCards } from "./game_utils"

export function daggerLogic(game) {
    const players = [game.player1, game.player2]
    for (let player of players) {
        for (let card of getPlayerCards(game, player)) {
            // if (SYMBOLS.DAGGER in card.symbols) {

            // }
        }
    }
}