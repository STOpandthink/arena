import React from "react";
import { createRoot } from "react-dom/client";
import { Meteor } from "meteor/meteor";
import { LobbyScreen } from "/imports/ui/App";
import { GamesCollection, PlayersCollection } from "/imports/api/Game";
import { ACTIONS } from "/imports/api/consts";

Meteor.startup(() => {
  const container = document.getElementById("react-target");
  const root = createRoot(container);

  Meteor.callAsync("createPlayer").then((userId) => {
      Meteor.connection.setUserId(userId);
      root.render(<LobbyScreen />);
  });

  const pressKeyHandle = e => {
    if (e.key === "A" || e.key === "a") {
      Meteor.callAsync("setPlayerAction", 1)
    } else if (e.key === "D" || e.key === "d") {
      Meteor.callAsync("setPlayerAction", 0)
    } else if (["1", "2", "3", "4", "5"].includes(e.key)) {
      Meteor.callAsync("buyItem", parseInt(e.key) - 1)
    }
  }
  window.addEventListener("keydown", pressKeyHandle)
});

// TODO: refactor together with the one in `backend.js`
Meteor.methods({
  async setPlayerAction(action) {
    const player = await PlayersCollection.findOneAsync({ _id: this.userId });
    const game = await GamesCollection.findOneAsync({ _id: player.gameId });
    const playerIndex = game.player1.id == player._id ? 1 : 2;
    let update = {}
    update[`player${playerIndex}.action`] = action >= ACTIONS.ATTACK ? ACTIONS.ATTACK : ACTIONS.DEFEND;
    await GamesCollection.updateAsync({ _id: game._id }, { $set: update });
  },
})