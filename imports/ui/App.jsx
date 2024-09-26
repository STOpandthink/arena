import React from "react";
import { useEffect, useState } from "react";
import { useTracker, useSubscribe } from "meteor/react-meteor-data";
import { GamesCollection, PlayersCollection } from "/imports/api/Game";
import { SymbolHelp } from "./SymbolHelp";
import { GAME_TICK, ACTIONS, SYMBOLS, SUITS, VALUE_COUNT } from "../api/consts";

export const Card = ({ card }) => {
  return <div className={`${card.small ? "small-card" : "card"} card_suit${card.suit}`}>{card.value}</div>;
};

export const GoldCard = ({ card }) => {
  return <div className={`card gold_card`}>{card.value}</div>;
};

export const LastAction = ({ action }) => {
  return <div className={`last-action`}>{action == ACTIONS.DEFEND ? "🛡️" : action == ACTIONS.ATTACK ? "⚔️" : ""}</div>;
};

export const Symbol = ({ symbol, setHoveredSymbol }) => {
  let text = "?"
  if (symbol == SYMBOLS.DAGGER) text = "🔪️️"
  else if (symbol == SYMBOLS.SWORD) text = "🗡️️"
  else if (symbol == SYMBOLS.AXE) text = "🪓️️"
  else if (symbol == SYMBOLS.SPEAR) text = "🔱️️"
  else if (symbol == SYMBOLS.BOMB) text = "💣"
  else if (symbol == SYMBOLS.HELMET) text = "🪖"
  else if (symbol == SYMBOLS.SHIELD) text = "🛡️️"
  else if (symbol == SYMBOLS.ARMOR) text = "🧥️️"
  else if (symbol == SYMBOLS.CLOAK) text = "🧣️️"
  else if (symbol == SYMBOLS.COIN) text = "💰️"
  else if (symbol == SYMBOLS.BANNER) text = "🚩️"
  else if (symbol == SYMBOLS.RING) text = "💍️"
  else if (symbol == SYMBOLS.CANDLE) text = "🕯️️"
  else if (symbol == SYMBOLS.RUNE) text = "🀄️️"
  else if (symbol == SYMBOLS.PRAYER) text = "🙏️️"
  else if (symbol == SYMBOLS.JOKER) text = "🃏️️"
  else if (symbol == SYMBOLS.ROYALTY) text = "👑️"
  else if (symbol == SYMBOLS.MAGIC) text = "✨️"
  else if (symbol == SYMBOLS.BERSERK) text = "😡️"
  else if (symbol == SYMBOLS.NINJA) text = "🥷️"
  else throw new Error(`Don't know this symbol: ${symbol}`)
  return <div className="symbol" onMouseEnter={() => setHoveredSymbol(symbol)} onMouseLeave={() => setHoveredSymbol(-1)}>{text}</div>
};

export const SymbolHolder = ({ symbolCounts, setHoveredSymbol }) => {
  return <div className="symbol-holder">
    {symbolCounts.map((count, index) => (
      <div key={index}>
        <span>{count}</span>
        <Symbol symbol={index + 1} setHoveredSymbol={setHoveredSymbol} />
      </div>
    ))}
  </div>
}

export const BuyItem = ({ item, canBuy, setHoveredSymbol }) => {
  const buyItem = () => Meteor.callAsync("buyItem", item.index);
  return <button className="item-button" onClick={buyItem}>
    <div className="item-top-side">
      <div className="item-left-side">
        <div className="item-index">{item.index + 1}</div>
        <div>
          {item.symbols.map((symbol, symbolIndex) => (
            <Symbol key={symbolIndex} symbol={symbol} setHoveredSymbol={setHoveredSymbol} />
          ))}
        </div>
      </div>
      <div className="item-right-side">
        <Card card={item} />
      </div>
    </div>
    <div className={`item-price ` + (canBuy ? "item-can-buy" : "")}>${item.cost}</div>
  </button>;
};

export const Item = ({ item }) => {
  return <li>{item.name}</li>;
};

export const Deck = ({ deck }) => {
  return deck.map((cards, deckRowIndex) => (
    <div key={deckRowIndex} className="deck-row">
      {cards.map((card, cardIndex) => (
        <div key={cardIndex} className="deck-row-entry">
          <span>{card.count}</span>
          <Card card={card} />
        </div>
      ))}
    </div>
  ))
};

function getSortedDeck(player) {
  const sortedDeck = [];
  const suitCounts = [0, 0]
  for (let value = 1; value <= VALUE_COUNT; value++) {
    sortedDeck.push([{ value, suit: SUITS.WHITE, count: 0, small: true }, { value, suit: SUITS.BLACK, count: 0, small: true }])
  }
  for (const card of player.deck) {
    sortedDeck[card.value - 1][card.suit - 1].count += 1
    suitCounts[card.suit - 1]++;
  }
  return [sortedDeck, suitCounts];
}

export const Game = ({ game }) => {
  const isLoadingPlayers = useSubscribe("players");
  // const myPlayer = useTracker(() => PlayersCollection.findOne({_id: Meteor.userId()}));
  // const theirPlayer = useTracker(() => PlayersCollection.findOne({_id: { $ne: Meteor.userId()}}));
  // const players = useTracker(() => PlayersCollection.find({}).fetch());
  const myPlayer = game.player1.id == Meteor.userId() ? game.player1 : game.player2;
  const theirPlayer = game.player1.id != Meteor.userId() ? game.player1 : game.player2;
  const [gameTime, setGameTime] = useState(0);
  const [hoveredSymbol, setHoveredSymbol] = useState(-1);

  const [mySortedDeck, mySuitCounts] = getSortedDeck(myPlayer);
  const [theirSortedDeck, theirSuitCounts] = getSortedDeck(theirPlayer);

  useEffect(() => {
    const timer = Meteor.setInterval(() => {
      // NOTE: we set it to slightly less than the server game tick to give the player some room for latency / error
      setGameTime(Math.max(GAME_TICK - 50 - (new Date() - game.lastTick), 0));
    }, 20);
    return () => Meteor.clearInterval(timer);
  }, [game]);

  if (isLoadingPlayers()) {
    return <div>Loading...</div>;
  }

  const attackClick = () => {
    Meteor.callAsync("setPlayerAction", ACTIONS.ATTACK)
  };
  const defendClick = () => {
    Meteor.callAsync("setPlayerAction", ACTIONS.DEFEND)
  };

  return <div className="full-width">

    <div className="column-holder">
      <div className="deck column">
        <div className="deck-row">
          <div className="deck-row-entry">{mySuitCounts[SUITS.WHITE - 1]}W</div>
          <div className="deck-row-entry">{mySuitCounts[SUITS.BLACK - 1]}B</div>
        </div>
        <Deck deck={mySortedDeck} />
      </div>
      <div className="column central-column">
        <div className="stats-holder">
          <div className="player-stats">
            <div className="stat money-stat">
              ${myPlayer.gold}
              {myPlayer.goldDelta != 0 && <div key={"my-money-" + game.round} className="stat-floater">+${myPlayer.goldDelta}</div>}
            </div>
            <div className="stat health-stat">
              {myPlayer.health}HP
              {myPlayer.healthDelta != 0 && <div key={"my-health-" + game.round} className="stat-floater">{myPlayer.healthDelta}</div>}
            </div>
            <LastAction key={"my-action-" + game.round * 2 + game.turn + myPlayer.card3.suit} action={myPlayer.lastAction} />
          </div>
          <progress className="turn-timer" value={gameTime} max="1000"></progress>
          <div className="player-stats">
            <LastAction key={"their-action-" + game.round * 2 + game.turn + myPlayer.card3.suit} action={myPlayer.theirLastAction} />
            <div className="stat money-stat">
              ${theirPlayer.gold}
              {theirPlayer.goldDelta != 0 && <div key={"their-money-" + game.round} className="stat-floater">+${theirPlayer.goldDelta}</div>}
            </div>
            <div className="stat health-stat">
              {theirPlayer.health}HP
              {theirPlayer.healthDelta != 0 && <div key={"their-health-" + game.round} className="stat-floater">{theirPlayer.healthDelta}</div>}
            </div>
          </div>
        </div>
        <div className="cards-holder">
          <div className="player-cards">
            <GoldCard card={myPlayer.goldCard} />
            <Card card={myPlayer.card1} />
            <Card card={myPlayer.card2} />
          </div>
          <div className="player-cards">
            <GoldCard card={game.sharedGoldCard} />
            <Card card={game.sharedCard} />
          </div>
          <div className="player-cards">
            <Card card={myPlayer.card3} />
            <Card card={myPlayer.card4} />
            <GoldCard card={theirPlayer.goldCard} />
          </div>
        </div>
        <div className="actions column">
          <button className={`action-button action-defend ${myPlayer.action == ACTIONS.DEFEND ? "action-selected" : ""}`} onClick={defendClick}>Defend</button>
          <button className={`action-button action-attack ${myPlayer.action == ACTIONS.ATTACK ? "action-selected" : ""}`} onClick={attackClick}>Attack</button>
        </div>
        <div className="item-shop">
          {game.items.map((item, index) => (
            <BuyItem key={index} item={item} canBuy={item.cost <= myPlayer.gold} setHoveredSymbol={setHoveredSymbol} />
          ))}
        </div>
        <div className="symbol-help">
          <SymbolHelp symbol={hoveredSymbol} />
        </div>
        <ul>
          {myPlayer.items.map((item, index) => (
            <Item key={index} item={item} />
          ))}
        </ul>
      </div>
      <div className="deck column">
        <div className="deck-row">
          <div className="deck-row-entry">{theirSuitCounts[SUITS.WHITE - 1]}W</div>
          <div className="deck-row-entry">{theirSuitCounts[SUITS.BLACK - 1]}B</div>
        </div>
        <Deck deck={theirSortedDeck} />
      </div>
    </div>
    <div className="symbol-holders">
      <SymbolHolder symbolCounts={myPlayer.symbolCounts} setHoveredSymbol={setHoveredSymbol} />
      <SymbolHolder symbolCounts={theirPlayer.symbolCounts} setHoveredSymbol={setHoveredSymbol} />
    </div>
  </div>
};

export const App = () => {
  const isLoadingGames = useSubscribe("games");
  const game = useTracker(() => GamesCollection.findOne());

  if (isLoadingGames()) {
    return <div>Loading...</div>;
  }
  if (game.player2.id === undefined) {
    return <div>{game.text}</div>
  }

  return <div>
    <Game key={game._id} game={game}></Game>
  </div>
};
