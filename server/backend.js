import { Meteor } from 'meteor/meteor';
import { GamesCollection, PlayersCollection } from "/imports/api/Game";
import { runGame } from "/server/game";
import { ACTIONS } from "/imports/api/consts";
import { getNewPlayer, getNewGame } from "./game_utils"

async function processGameTick(game) {
  function updateFn() {
    GamesCollection.updateAsync({ _id: game._id }, { $set: game });
  }
  return await runGame(game, updateFn, false, !Meteor.isProduction)
}

Meteor.startup(async () => {
  await GamesCollection.removeAsync({})
  await PlayersCollection.removeAsync({})
});

Meteor.methods({
  async createPlayer() {
    const playerId = await PlayersCollection.insertAsync({ name: this.connection.id });
    this.setUserId(playerId);
    console.log("NEW USER: ", this.userId);
    const game = await GamesCollection.findOneAsync({}, { sort: { createdAt: -1 } });
    console.log(game)
    let gameId = undefined
    if (game === undefined || game.player2.id !== undefined) {
      gameId = await GamesCollection.insertAsync(getNewGame(this.userId));
      console.log(`...joined as first player in NEW GAME ${gameId}.`)
    } else if (game.player2.id === undefined) {
      gameId = game._id
      console.log(`...joined to existing game ${game._id}.`)
      await GamesCollection.updateAsync({ _id: game._id }, { $set: { player2: getNewPlayer(game, this.userId, 2), text: "Ready!" } });
      async function gameLoop() {
        // TODO: if the only thing that modifies our game object is this function call, then, in theory, we don't need to get the game
        // object from DB each time
        const pause_ms = await GamesCollection.findOneAsync({ _id: game._id }).then(processGameTick)
        Meteor.setTimeout(gameLoop, pause_ms)
      }
      await gameLoop()
    }
    await PlayersCollection.updateAsync({ _id: this.userId }, { $set: { gameId } });
    return this.userId;
  },

  async setReady() {
    const player = await PlayersCollection.findOneAsync({ _id: this.userId });
    const game = await GamesCollection.findOneAsync({ _id: player.gameId });
    const playerIndex = game.player1.id == player._id ? 1 : 2;
    let update = {}
    update[`player${playerIndex}.isReady`] = true
    await GamesCollection.updateAsync({ _id: game._id }, { $set: update });
  },

  async setPlayerAction(action) {
    const player = await PlayersCollection.findOneAsync({ _id: this.userId });
    const game = await GamesCollection.findOneAsync({ _id: player.gameId });
    const playerIndex = game.player1.id == player._id ? 1 : 2;
    let update = {}
    update[`player${playerIndex}.action`] = action >= ACTIONS.ATTACK ? ACTIONS.ATTACK : ACTIONS.DEFEND;
    await GamesCollection.updateAsync({ _id: game._id }, { $set: update });
  },

  async buyItem(itemIndex) {
    const player = await PlayersCollection.findOneAsync({ _id: this.userId });
    const game = await GamesCollection.findOneAsync({ _id: player.gameId });
    const playerIndex = game.player1.id == player._id ? 1 : 2;
    const gamePlayer = game.player1.id == player._id ? game.player1 : game.player2;
    const item = game.items[itemIndex]
    if (gamePlayer.gold < item.cost || item[`boughtByP${playerIndex}`]) {
      return
    }
    gamePlayer.symbolCounts[item.symbol]++;
    console.log(item.card)
    if (item.card.value >= 0) {
      let valueDelta = 0
      for (let i = 0; i < game.c.VALUE_COUNT; i++) {
        if (i != item.card.value && gamePlayer.deck.values[i] >= 1) {
          gamePlayer.deck.values[i] -= 1
          valueDelta += 1
        }
      }
      if (i == item.card.value) gamePlayer.deck.values[i] += valueDelta
    } else {
      let suitDelta = 0
      for (let i = 0; i < game.c.SUIT_COUNT; i++) {
        if (i != item.card.suit && gamePlayer.deck.suits[i] >= 1) {
          gamePlayer.deck.suits[i] -= 1
          suitDelta += 1
        }
      }
      if (i == item.card.suit) gamePlayer.deck.suits[i] += suitDelta
    }
    const goldField = `player${playerIndex}.gold`
    const deckField = `player${playerIndex}.deck`
    const symbolsField = `player${playerIndex}.symbolCounts`
    const boughtField = `items.$.boughtByP${playerIndex}`
    await GamesCollection.updateAsync({ _id: game._id }, {
      $inc: { [goldField]: -item.cost },
      $set: { [symbolsField]: gamePlayer.symbolCounts, [deckField]: gamePlayer.deck },
    });
    await GamesCollection.updateAsync({ _id: game._id, "items.index": item.index }, { $set: { [boughtField]: true } })
  },
});

Meteor.publish("games", async function () {
  const player = await PlayersCollection.findOneAsync({ _id: this.userId });
  if (player === undefined) {
    return undefined;
  }
  const game = await GamesCollection.findOneAsync({ _id: player.gameId });
  const otherPlayerIndex = game.player1.id != player._id ? 1 : 2;
  let fields = {}
  fields[`player${otherPlayerIndex}.action`] = 0;
  fields[`player${otherPlayerIndex}.card1`] = 0;
  fields[`player${otherPlayerIndex}.card2`] = 0;
  return GamesCollection.find({ _id: player.gameId }, { fields });
});

Meteor.publish("players", async function () {
  const player = await PlayersCollection.findOneAsync({ _id: this.userId });
  if (player === undefined) {
    return undefined;
  }
  const game = await GamesCollection.findOneAsync({ _id: player.gameId });
  return PlayersCollection.find({ _id: { $in: [game.player1.id, game.player2.id] } });
});