import React from "react";
import { useEffect, useState } from "react";
import { useTracker, useSubscribe } from "meteor/react-meteor-data";

import { GamesCollection, PlayersCollection } from "/imports/api/Game";
import { SymbolHelp } from "./SymbolHelp";
import { ACTIONS, SYMBOLS, SUITS } from "../api/consts";

export const Card = ({ card, isSmall }) => {
  return <div className={`${isSmall ? "small-card" : "card"} card-suit${card.suit}`}>{card.value >= 0 ? "" + (card.value + 1) : ""}</div>;
};

export const LastAction = ({ action }) => {
  return <div className={`last-action`}>{action == ACTIONS.DEFEND ? "🛡️" : action == ACTIONS.ATTACK ? "⚔️" : ""}</div>;
};

export const Symbol = ({ symbol, setHoveredSymbol }) => {
  let text = "?"
  if (symbol == SYMBOLS.ZERO) text = "0"
  else if (symbol == SYMBOLS.DAGGER) text = "🔪️️"
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
        <Symbol symbol={index} setHoveredSymbol={setHoveredSymbol} />
      </div>
    ))}
  </div>
}

export const BuyItem = ({ item, canBuy, setHoveredSymbol, isBought, buyItem }) => {
  return <button className={"item-button " + (isBought ? "item-bought": "")} onClick={() => buyItem(item.index)}>
    <div className="item-top-side">
      <div className="item-left-side">
        <div className="item-index">{item.index}</div>
        <div>
          <Symbol symbol={item.symbol} setHoveredSymbol={setHoveredSymbol} />
        </div>
      </div>
      <div className="item-right-side">
        <Card card={item.card} isSmall={true} />
      </div>
    </div>
    <div className={`item-price ` + (canBuy ? "item-can-buy" : "")}>${item.cost}</div>
  </button>;
};

export const Deck = ({ deck }) => {
  return <div>
    {deck.suits.map((suitProb, suitIndex) => (
      <div key={suitIndex} className="deck-row">
        {suitProb}%
        <Card card={{value: -1, suit: suitIndex}} isSmall={true} />
      </div>
    ))}
    <hr/>
    {deck.values.map((valueProb, valueIndex) => (
      <div key={valueIndex} className="deck-row">
        {valueProb}%
        <Card card={{value: valueIndex, suit: SUITS.GENERIC}} isSmall={true} />
      </div>
    ))}
  </div>
};

export const Game = ({ game }) => {
  const isLoadingPlayers = useSubscribe("players");
  // const myPlayer = useTracker(() => PlayersCollection.findOne({_id: Meteor.userId()}));
  // const theirPlayer = useTracker(() => PlayersCollection.findOne({_id: { $ne: Meteor.userId()}}));
  // const players = useTracker(() => PlayersCollection.find({}).fetch());
  const myPlayer = game.player1.id == Meteor.userId() ? game.player1 : game.player2;
  const theirPlayer = game.player1.id != Meteor.userId() ? game.player1 : game.player2;
  const [lastRound, setLastRound] = useState(game.round);
  const [gameTime, setGameTime] = useState(0);
  const [hoveredSymbol, setHoveredSymbol] = useState(-1);
  const [boughtItemFlags, setBoughtItemFlags] = useState(Array(game.c.MAX_ITEMS_FOR_SALE).fill(false));

  useEffect(() => {
    const timer = Meteor.setInterval(() => {
      // NOTE: we set it to slightly less than the server game tick to give the player some room for latency / error
      setGameTime(Math.max(game.c.GAME_TICK - 50 - (new Date() - game.lastTick), 0));
    }, 20);
    return () => Meteor.clearInterval(timer);
  }, [game.lastTick]);
  useEffect(() => {
    setLastRound(game.round)
    setBoughtItemFlags(Array(game.c.MAX_ITEMS_FOR_SALE).fill(false));
    return () => {};
  }, [game.round])

  if (isLoadingPlayers()) {
    return <div>Loading...</div>;
  }

  const attackClick = () => { Meteor.callAsync("setPlayerAction", ACTIONS.ATTACK) };
  const defendClick = () => { Meteor.callAsync("setPlayerAction", ACTIONS.DEFEND) };
  const buyItem = (itemIndex) => {
    boughtItemFlags[itemIndex] = true
    setBoughtItemFlags(boughtItemFlags)
    Meteor.callAsync("buyItem", itemIndex);
  };

  return <div className="full-width">
    <div className="column-holder">
      <div className="deck column">
        <Deck deck={myPlayer.deck} />
      </div>
      <div className="column central-column">
        <div className="stats-holder">
          <div className="player-stats">
            <div>{game.ultimateWinnerIndex === myPlayer.index ? "WINNER!!!" : ""}</div>
            <div className="stat">
              {myPlayer.victories}⭐
            </div>
            <div className="stat money-stat">
              ${myPlayer.gold}
              {myPlayer.goldDelta != 0 && <div key={"my-money-" + game.round} className="stat-floater">+${myPlayer.goldDelta}</div>}
            </div>
            <div className="stat health-stat">
              {Math.round(myPlayer.health)}HP
              {myPlayer.healthDelta != 0 && <div key={"my-health-" + game.round} className="stat-floater">{myPlayer.healthDelta}</div>}
            </div>
            <LastAction key={"my-action-" + game.round * 2 + game.turn + myPlayer.card3.suit} action={myPlayer.lastAction} />
          </div>
          <progress className="turn-timer" value={gameTime} max={game.c.GAME_TICK}></progress>
          <div className="player-stats">
            <LastAction key={"their-action-" + game.round * 2 + game.turn + myPlayer.card3.suit} action={myPlayer.theirLastAction} />
            <div className="stat money-stat">
              ${theirPlayer.gold}
              {theirPlayer.goldDelta != 0 && <div key={"their-money-" + game.round} className="stat-floater">+${theirPlayer.goldDelta}</div>}
            </div>
            <div className="stat health-stat">
              {Math.round(theirPlayer.health)}HP
              {theirPlayer.healthDelta != 0 && <div key={"their-health-" + game.round} className="stat-floater">{theirPlayer.healthDelta}</div>}
            </div>
            <div className="stat">
              {theirPlayer.victories}⭐
            </div>
            <div>{game.ultimateWinnerIndex === theirPlayer.index ? "WINNER!!!" : ""}</div>
          </div>
        </div>
        <div className="cards-holder">
          <div className="player-cards">
            <Card card={myPlayer.card1} isSmall={false} />
            <Card card={myPlayer.card2} isSmall={false} />
          </div>
          <div className="player-cards">
            <Card card={game.sharedCard} isSmall={false} />
          </div>
          <div className="player-cards">
            <Card card={myPlayer.card3} isSmall={false} />
            <Card card={myPlayer.card4} isSmall={false} />
          </div>
        </div>
        <div className="actions column">
          <button className={`action-button action-attack ${myPlayer.action == ACTIONS.ATTACK ? "action-selected" : ""}`} onClick={attackClick}>⚔️ ATTACK</button>
          <button className={`action-button action-defend ${myPlayer.action == ACTIONS.DEFEND ? "action-selected" : ""}`} onClick={defendClick}>🛡 DEFEND</button>
          <div className="final-match">
            {game.match > game.c.MATCHES_UNTIL_END ? "FINAL MATCH!" : "  MATCH: " + game.match + "/" + game.c.MATCHES_UNTIL_END}
          </div>
        </div>
        <div className="item-shop">
          {game.items.map((item, index) => (
            <BuyItem key={index} item={item} canBuy={item.cost <= myPlayer.gold} isBought={boughtItemFlags[index]} setHoveredSymbol={setHoveredSymbol} buyItem={buyItem} />
          ))}
        </div>
        <div className="symbol-help">
          <SymbolHelp symbol={hoveredSymbol} />
        </div>
      </div>
      <div className="deck column">
        <Deck deck={theirPlayer.deck} />
      </div>
    </div>
    <div className="symbol-holders">
      <SymbolHolder symbolCounts={myPlayer.symbolCounts} setHoveredSymbol={setHoveredSymbol} />
      <SymbolHolder symbolCounts={theirPlayer.symbolCounts} setHoveredSymbol={setHoveredSymbol} />
    </div>
  </div>
};

export const LobbyScreen = () => {
  const isLoadingGames = useSubscribe("games");
  const game = useTracker(() => GamesCollection.findOne());

  const setReady = () => {
    Meteor.callAsync("setReady")
  };

  if (isLoadingGames()) {
    return <div>Loading...</div>;
  }
  const isEveryoneReady = game.player1.isReady && game.player2.isReady
  if (!isEveryoneReady) {
    return <div>
      <div>{game.text}</div>
      <div><pre><code>{JSON.stringify(game.c).replaceAll(",", "\n")}</code></pre></div>
      <div>Player 1 is {game.player1.isReady ? "" : "not "} ready; Player 2 is {game.player2.isReady ? "" : "not "} ready</div>
      <button onClick={setReady}>Ready</button>
    </div>
  }

  return <div>
    <Game key={game._id} game={game}></Game>
  </div>
};
