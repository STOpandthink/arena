import React from "react";

import { SYMBOLS } from "../api/consts";

export const SymbolHelp = ({ symbol }) => {
  if (symbol < 0) return <div />
  else if (symbol == SYMBOLS.DAGGER) {
    return <div>
      Level 3: Deal 1 damage to opponent any time you attack <br/>
      Level 6: ...also, deal 3 damage to opponent when defending second turn <br/>
      Level 9: ...also, after an all-in, pernamently add a 2 of a random color to your deck
    </div>
  } else if (symbol == SYMBOLS.SWORD) {
    return <div>
      Level 3: +2 damage when attacking on the first turn (any additional damage is added before the turn 1 multiplier is applied) <br/>
      Level 6: ...also, +4 damage when attacking on the first turn. Keep any card greater than 8. <br/>
      Level 9: ...also, +6 damage when attacking on the first turn. If successful, your next card is the highest valued card in your deck.
    </div>
  } else if (symbol == SYMBOLS.AXE) {
    return <div>
      Level 3: +2 damage when attacking a defending opponent on the second turn <br/>
      Level 6: ...also, +3 damage when attacking a defending opponent on the second turn <br/>
      Level 9: ...also, add damage equal to the value of the highest card in your hand when attacking a defending opponent on the second turn
    </div>
  } else if (symbol == SYMBOLS.SPEAR) {
    return <div>
      Level 3: +2 damage to all-in attacks (any additional damage is added before the all-in multiplier is applied) <br/>
      Level 6: ...also, +3 damage to all-in attacks <br/>
      Level 9: ...also, if your all-in attack is successful, remove the lowest card in your hand from your deck pernamently and add that much damage
    </div>
  } else if (symbol == SYMBOLS.BOMB) {
    return <div>
      INSTEAD of getting this card, the equivalent card will be removed from your deck <br/>
      Level 3: Remove 1 lowest valued cards from your deck <br/>
      Level 6: ...also, remove 2 lowest valued cards from your deck and the shared deck <br/>
      Level 9: ...also, remove 4 highest valued cards from your opponent's deck
    </div>
  } else if (symbol == SYMBOLS.HELMET) {
    return <div>
      Level 3: The first time you lose an all-in each battle, prevent all damage <br/>
      Level 6: ??? <br/>
      Level 9: the first time you win an all-in each battle, gain the TRUE VISION ability. The next time you lose an all-in battle, lose that ability. <br/>
      TRUE VISION: you can see the opponent's first hand card.
    </div>
  } else if (symbol == SYMBOLS.SHIELD) {
    return <div>
      Level 3: ??? <br/>
      Level 6: ??? <br/>
      Level 9: When both you and the opponent defend, automatically change your action to attack.
    </div>
  } else if (symbol == SYMBOLS.ARMOR) {
    return <div>
      Level 3: ??? <br/>
      Level 6: When you defend with two cards, keep the highest one for the next bout. When you defend with one card, keep it if it's higher than the card you'd get in your next bout. <br/>
      Level 9: (???weird synergy with Sword3) Your second card is guaranteed to be at least as high as your other card and as the shared card.
    </div>
  } else if (symbol == SYMBOLS.CLOAK) {
    return <div>
      Level 3: if both players defend during the first turn, gain +1 gold <br/>
      Level 6: ...also, if the opponent defends on second turn and your made hand is worse than theirs, show it and gain +5 HP <br/>
      Level 9: ...also, each time you defend, add a counter to CLOAK. When you win an all-in attack add damage equal to the counter count and reset it.
    </div>
  } else if (symbol == SYMBOLS.COIN) {
    return <div>
      Level 3: +1 gold value to your gold card <br/>
      Level 6: ...also, +1 gold value to each gold card you win <br/>
      Level 9: ...also, just for you, all cards in the shop cost 5 gold less
    </div>
  } else if (symbol == SYMBOLS.BANNER) {
    return <div>
      DOMINANCE of a suit is determined by the player who has the most cards of that suit.
      Level 3: If you have dominance of the shared suit, gain +2 damage that round <br/>
      Level 6: ...also, if you have dominance of the shared suit, gain +2 damage and +2 HP that round <br/>
      Level 9: ...also, when showing your all-in hand (including the shared card), gain +3 damage and +3 HP for each card which suit you dominate <br/>
    </div>
  } else if (symbol == SYMBOLS.RING) {
    return <div>
      Level 3: If you defend against an all-in and your hand was actually better, gain 10G <br/>
      Level 6: ...also, if you lose an all-in and you have a pair or better in your hand, you gain all the gold cards instead of the opponent <br/>
      Level 9: ???
    </div>
  } else if (symbol == SYMBOLS.CANDLE) {
    return <div>
      Level 3: See if your next card is less than, greater than or equal to 5 <br/>
      Level 6: ...also, see the suit of your next card <br/>
      Level 9: Instead, see your next card
    </div>
  } else if (symbol == SYMBOLS.RUNE) {
    return <div>
      Level 3: When you buy a card, gain a random symbol <br/>
      Level 6: ...also, gain +1 to all your symbols <br/>
      Level 9: ...also, you can buy a card and get the symbol bonuses without adding the card to your deck
    </div>
  } else if (symbol == SYMBOLS.PRAYER) {
    return <div>
      Each time you buy a prayer card, cast a random prayer for 5 rounds <br/>
      Level 3: Instead, each prayer lasts 10 rounds <br/>
      Level 6: Instead, each prayer is twice as effective and lasts 15 rounds <br/>
      Level 9: Instead, each prayer is three times as effective and lasts 20 rounds <br/>
      Prayers: <br/>
        * Heal 2 HP at the end of round <br/>
        * +2 damage <br/>
        * +1 to your gold cards <br/>
        * At the beginning of the round, draw two cards and keep the highest <br/>
    </div>
  } else if (symbol == SYMBOLS.JOKER) {
    return <div>
      When buying a card with the JOKER symbol, it goes into the shared deck instead of your deck. <br/>
      When evaluating a hand, the JOKER is the best card it could be. <br/>
      Level 3: gain a joker <br/>
      Level 6: gain a joker <br/>
      Level 9: if you win an all-in with a joker, the other card in your hand becomes a joker
    </div>
  } else if (symbol == SYMBOLS.ROYALTY) {
    return <div>
      After 10, the values become J(ack), Q(ueen) and then K(ing). The values can't go higher than that. <br/>
      Level 3: Increase the value of all your cards by 1 <br/>
      Level 6: ...also, increase the value of all your cards and the shared cards by 1 <br/>
      Level 9: ...also, each round, the value of the first card you draw is pernamently increased by 1
    </div>
  } else if (symbol == SYMBOLS.MAGIC) {
    return <div>
      Level 3: At the end of a round, if you have a flush, gain +1 HP and +1 gold <br/>
      Level 6: ...also, if you have a flush, +2 damage <br/>
      Level 9: ...also, after an all-in, pernamently change the suit of all the cards in your hand and the shared card to the suit of the majority of the three cards
    </div>
  } else if (symbol == SYMBOLS.BERSERK) {
    return <div>
      Level 3: If your opponent defends on turn 1, increase your damage +1 for the next round. This bonus is cumulative until your opponent attacks on turn 1. If your bonus damage is +X, then you have to attack on turn 1 if the value of your card is less than of equal to X. <br/>
      Level 6: Instead increase your damage +2. <br/>
      Level 9: Instead of the damage resetting to zero, it's cut in half.
    </div>
  } else if (symbol == SYMBOLS.NINJA) {
    return <div>
      Level 3: At the beginning of each battle, pick a random card value. Those cards are removed from the opponent's deck for the duration of the battle. Only you know this value. <br/>
      Level 6:  <br/>
      Level 9: ...also, at the beginning of each turn, if you card is lower than your opponent's pernamently switch your cards.
    </div>
  }
  return <div>UNKNOWN ITEM TYPE: {symbol}</div>
};