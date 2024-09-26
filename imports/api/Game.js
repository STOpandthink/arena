import { Mongo } from "meteor/mongo";

export const GamesCollection = new Mongo.Collection("games");
export const PlayersCollection = new Mongo.Collection("players");
export const GAME_TICK = 1000;