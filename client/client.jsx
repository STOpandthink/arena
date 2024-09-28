import React from "react";
import { createRoot } from "react-dom/client";
import { Meteor } from "meteor/meteor";
import { LobbyScreen } from "/imports/ui/App";

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
    } else if (e.key === "T" || e.key === "t") {
      Meteor.callAsync("setGameTick")
    } else if (["1", "2", "3", "4", "5"].includes(e.key)) {
      Meteor.callAsync("buyItem", parseInt(e.key) - 1)
    }
  }
  window.addEventListener("keydown", pressKeyHandle)
});
