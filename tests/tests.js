import assert from "assert";
import { DQNAgent } from "@neurosity/reinforcejs";

import { getNewGame, runGame, mlEnvFromGame, computeHand, compareHands } from "/server/game";
import { HAND_TYPES, ACTIONS } from "/imports/api/consts";

describe("meteor-app", function () {
  it("package.json has correct name", async function () {
    const { name } = await import("../package.json");
    assert.strictEqual(name, "meteor-app");
  });

  if (Meteor.isClient) {
    it("client is not server", function () {
      assert.strictEqual(Meteor.isServer, false);
    });
  }

  if (Meteor.isServer) {
    it("server is not client", function () {
      assert.strictEqual(Meteor.isClient, false);
    });
  }
});

describe("simulation", function () {
  function doBattleWithAI(aiFn) {
    const game = getNewGame()
    // Optimal strategy:
    // turn 1: bet with >=7 OR pair
    // turn 2: bet with any pair
    for (let i = 0; i < 1000000; i++) {
      game.player2.action = aiFn(game)
      runGame(game, (_) => _, true);
    }
    console.log(game.player1.health)
    console.log(game.player2.health)
    console.log(game.player1.health / game.player2.health)
  }

  it("tf", async function () {
    return
    const game = getNewGame()

    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 1, inputShape: [200] }));
    model.compile({
      loss: 'meanSquaredError',
      optimizer: 'sgd',
      metrics: ['MAE']
    });

    const xs = a;
    const ys = a;

    for (let i = 0; i < (epoch == epochs - 1 ? 10 * steps : steps); i++) {
      const mlEnv = mlEnvFromGame(game)
      const roundNow = game.round
      const r = Math.random()
      const pickedDecision = r > 0.33333 ? (r > 0.66667 ? 0 : 1) : 2
      mlEnv.push(pickedDecision)
      const pickedAction = pickedDecision >= 1 ? ACTIONS.ATTACK : ACTIONS.DEFEND
      game.player2.action = pickedAction
      runGame(game, (_) => _, true)
      if (game.round == roundNow) {
        const mlEnv2 = mlEnvFromGame(game)
        const pickedAction2 = act(mlEnv2, minProb);
        game.player2.action = pickedAction2
        runGame(game, (_) => _, true)
        learn(mlEnv, pickedAction, game.player2.healthDelta - game.player1.healthDelta);
        learn(mlEnv2, pickedAction2, game.player2.healthDelta - game.player1.healthDelta);
      } else {
        xs.push(mlEnv)
        ys.push(game.player2.healthDelta - game.player1.healthDelta);
      }
    }
    const prediction = model.predict()

    doBattleWithAI((game) => {
      return act(mlEnvFromGame(game), 0)
    })
  })

  it("my_rl", async function () {
    return
    const game = getNewGame()

    const storedResults = new Map()
    function learn(mlEnv, pickedAction, result) {
      if (storedResults[mlEnv] === undefined) storedResults[mlEnv] = {}
      const curEnv = storedResults[mlEnv];
      if (curEnv[pickedAction] === undefined) curEnv[pickedAction] = {avgUtil: 0, count: 0}
      const curAction = curEnv[pickedAction]
      const totalUtil = curAction.avgUtil * curAction.count
      curAction.count += 1
      curAction.avgUtil = (totalUtil + result) / curAction.count
    }
    function attackWithProb(prob) {
      return Math.random() < prob ? ACTIONS.ATTACK : ACTIONS.DEFEND
    }
    function act(mlEnv, minProb) {
      const curEnv = storedResults[mlEnv];
      if (curEnv === undefined) return attackWithProb(0.5)
      let attackActionUtil = curEnv[ACTIONS.ATTACK] === undefined ? 0 : curEnv[ACTIONS.ATTACK].avgUtil
      let defendActionUtil = curEnv[ACTIONS.DEFEND] === undefined ? 0 : curEnv[ACTIONS.DEFEND].avgUtil
      if (attackActionUtil < 0) {
        defendActionUtil -= attackActionUtil
        attackActionUtil = 0
      }
      if (defendActionUtil < 0) {
        attackActionUtil -= defendActionUtil
        defendActionUtil = 0
      }
      if (attackActionUtil == 0 && defendActionUtil == 0) return attackWithProb(0.5)
      const attackProb = attackActionUtil / (attackActionUtil + defendActionUtil)
      assert(attackProb !== undefined && !isNaN(attackProb) && attackProb >= 0.0 && attackProb <= 1.0)
      if (minProb !== 0) {
        return attackWithProb(Math.min(Math.max(attackProb, minProb), 1.0 - minProb))
      }
      return attackProb > 0.5 ? ACTIONS.ATTACK : ACTIONS.DEFEND
    }

    const steps = 100000;
    const epochs = 5
    let minProbStart = 0.25
    let minProbEnd = 0
    for (let epoch = 0; epoch < epochs; epoch++) {
      const minProb = Math.max(0, minProbStart + (epoch / (epochs - 1)) * (minProbEnd - minProbStart))
      if (game.turn !== 1) {
        runGame(game, (_) => _, true)
      }
      for (let i = 0; i < (epoch == epochs - 1 ? 10 * steps : steps); i++) {
        const mlEnv = mlEnvFromGame(game)
        const roundNow = game.round
        const pickedAction = act(mlEnv, minProb);
        game.player2.action = pickedAction
        runGame(game, (_) => _, true)
        if (game.round == roundNow) {
          const mlEnv2 = mlEnvFromGame(game)
          const pickedAction2 = act(mlEnv2, minProb);
          game.player2.action = pickedAction2
          runGame(game, (_) => _, true)
          learn(mlEnv, pickedAction, game.player2.healthDelta - game.player1.healthDelta);
          learn(mlEnv2, pickedAction2, game.player2.healthDelta - game.player1.healthDelta);
        } else {
          learn(mlEnv, pickedAction, game.player2.healthDelta - game.player1.healthDelta);
        }
      }

      for (let mlEnv in storedResults.keys()) {
        const curEnv = storedResults[mlEnv]
        if (curEnv[0] == 2) continue
        for (let curAction in Object.keys(curEnv)) {
          curEnv[curAction].count /= 2
        }
      }
    }

    doBattleWithAI((game) => {
      return act(mlEnvFromGame(game), 0)
    })
  })

  // it.only("rl", async function () {
  it.skip("rl", async function () {
    const game = getNewGame()
    const numStates = mlEnvFromGame(game).length
    let env = { };
    env.getNumStates = function () { return numStates; }
    env.getMaxNumActions = function () { return 3; }

    const spec = { alpha: 0.1, num_hidden_units: 100, experience_size: 2, experience_add_every: 1} //, learning_steps_per_iteration: 40}
    const agent = new DQNAgent(env, spec);
    const decisionProbs = {};

    const steps = 10000;
    const stepStart = 0.2
    const stepEnd = 0.01
    for (let i = 0; i < steps; i++) {
      const roundNow = game.round;
      const mlEnv = mlEnvFromGame(game)
      const pickedAiAction = agent.act(mlEnv);
      const probStep = Math.max(0, stepStart + (i / (steps - 1)) * (stepEnd - stepStart))
      if (decisionProbs[mlEnv] === undefined) decisionProbs[mlEnv] = 0.5;
      decisionProbs[mlEnv] *= 1.0 + probStep * (pickedAiAction - 2)
      const pickedGameAction = Math.random() <= decisionProbs[mlEnv] ? ACTIONS.ATTACK : ACTIONS.DEFEND
      game.player2.action = pickedGameAction
      runGame(game, (_) => _, true)
      if (game.round == roundNow) {
        agent.experience_size = 1
        agent.learn(game.player2.healthDelta - game.player1.healthDelta);
        const mlEnv2 = mlEnvFromGame(game)
        const pickedAction2 = agent.act(mlEnv2);
        if (decisionProbs[mlEnv2] === undefined) decisionProbs[mlEnv2] = 0.5;
        decisionProbs[mlEnv2] *= 1.0 + probStep * (pickedAction2 - 2)
        const pickedGameAction2 = Math.random() <= decisionProbs[mlEnv2] ? ACTIONS.ATTACK : ACTIONS.DEFEND
        game.player2.action = pickedGameAction2
        runGame(game, (_) => _, true)
        agent.experience_size = 2
        agent.learn(game.player2.healthDelta - game.player1.healthDelta);
      } else {
        agent.experience_size = 1
        agent.learn(game.player2.healthDelta - game.player1.healthDelta);
      }
    }
    doBattleWithAI((game) => {
      const mlEnv = mlEnvFromGame(game)
      return Math.random() <= decisionProbs[mlEnv] ? ACTIONS.ATTACK : ACTIONS.DEFEND
    })
  })

  it("default", async function () {
    return
    doBattleWithAI((game) => {
      // Optimal strategy:
      // turn 1: bet with >=7 OR pair
      // turn 2: bet with any pair
      if (game.turn == 1) {
        return (
          (game.player2.card1.value >= 7 && game.player2.card1.suit == game.sharedCard.suit) ||
          (game.player2.card1.value >= 7 && game.player2.card1.suit != game.sharedCard.suit) ||
          game.player2.card1.value == game.sharedCard.value)
          ? ACTIONS.ATTACK : ACTIONS.DEFEND
      } else {
        // If we're doing high hand threhsold, probably let's just look at our cards?
        const hand2 = computeHand(game.sharedCard, game.player2.card1, game.player2.card2)
        const thresholdHand = { type: HAND_TYPES.PAIR, values: [2, 1, 1] }
        return compareHands(hand2, thresholdHand) >= 0 ? ACTIONS.ATTACK : ACTIONS.DEFEND
      }
    })
  });
})

it("optimal", async function () {
  return
  const unknown = 0;
  const all_decisions = [];
  const max_values = 10
  for (let c1 = 1; c1 <= max_values; c1++) {
    for (let c2 = unknown; c2 <= max_values; c2++) {
      for (let c3 = 1; c3 <= max_values; c3++) {
        all_decisions.push([c1, c2, c3, true])
        all_decisions.push([c1, c2, c3, false])
      }
    }
  }
  const best_decisions = {}
  for (let d in all_decisions) {
    best_decisions[d] = ACTIONS.DEFEND;
  }
  const new_decisions = structuredClone(best_decisions)
  new_decisions[all_decisions[0]] = ACTIONS.ATTACK;
  let new_p_attack_turn1 = 0.0;
  let new_p_attack_turn2 = 0.0;
  let p_best_hand_is_best = 0.0;
  // let decisions = {[]}
  let ev = 0.0;
  for (let c1 = 1; c1 <= max_values; c1++) {
    for (let c3 = 1; c3 <= max_values; c3++) {
      let partial_ev = 0.0
      for (let c2 = unknown; c2 <= max_values; c2++) {
        // TODO: compute EV
        partial_ev 
      }
      ev += partial_ev / (max_values * max_values);
    }
  }
  console.log(ev)
})

describe("computeHand", function () {
  it("set", async function () {
    const hand = computeHand({ value: 1, suit: 0 }, { value: 1, suit: 0 }, { value: 1, suit: 0 })
    assert.strictEqual(hand.type, HAND_TYPES.SET);
    assert.deepStrictEqual(hand.values, [1, 1, 1]);
  });

  it("pair", async function () {
    let hand = computeHand({ value: 1, suit: 1 }, { value: 1, suit: 0 }, { value: 2, suit: 0 })
    assert.strictEqual(hand.type, HAND_TYPES.PAIR);
    assert.deepStrictEqual(hand.values, [2, 1, 1]);
    hand = computeHand({ value: 1, suit: 1 }, { value: 2, suit: 0 }, { value: 2, suit: 0 })
    assert.strictEqual(hand.type, HAND_TYPES.PAIR);
    assert.deepStrictEqual(hand.values, [2, 2, 1]);
    // Check to make sure a "flush" is classified as a "pair"
    hand = computeHand({ value: 3, suit: 0 }, { value: 2, suit: 0 }, { value: 3, suit: 0 })
    assert.strictEqual(hand.type, HAND_TYPES.PAIR);
    assert.deepStrictEqual(hand.values, [3, 3, 2]);
  });

  it("flush", async function () {
    let hand = computeHand({ value: 1, suit: 0 }, { value: 2, suit: 0 }, { value: 3, suit: 0 })
    assert.strictEqual(hand.type, HAND_TYPES.FLUSH);
    assert.deepStrictEqual(hand.values, [3, 2, 1]);
    hand = computeHand({ value: 10, suit: 1 }, { value: 9, suit: 1 }, { value: 8, suit: 1 })
    assert.strictEqual(hand.type, HAND_TYPES.FLUSH);
    assert.deepStrictEqual(hand.values, [10, 9, 8]);
  });

  it("high", async function () {
    let hand = computeHand({ value: 1, suit: 0 }, { value: 2, suit: 1 }, { value: 3, suit: 0 })
    assert.strictEqual(hand.type, HAND_TYPES.HIGH);
    assert.deepStrictEqual(hand.values, [3, 2, 1]);
    hand = computeHand({ value: 10, suit: 1 }, { value: 9, suit: 1 }, { value: 8, suit: 0 })
    assert.strictEqual(hand.type, HAND_TYPES.HIGH);
    assert.deepStrictEqual(hand.values, [10, 9, 8]);
    hand = computeHand({ value: 1, suit: 0 }, { value: 8, suit: 1 }, { value: 5, suit: 1 })
    assert.strictEqual(hand.type, HAND_TYPES.HIGH);
    assert.deepStrictEqual(hand.values, [8, 5, 1]);
  });
})

describe("compareHands", function () {
  function compareHandsSym(hand1, hand2, result) {
    assert.strictEqual(compareHands(hand1, hand2), result);
    // NOTE: need "+ 0" so that "0" and "-0" as equal
    assert.strictEqual(compareHands(hand2, hand1), -1 * result + 0);
  }

  it("set", async function () {
    const hand1 = { type: HAND_TYPES.SET, values: [4, 4, 4] }
    let hand2 = { type: HAND_TYPES.SET, values: [4, 4, 4] }
    compareHandsSym(hand1, hand2, 0);
    hand2 = { type: HAND_TYPES.SET, values: [3, 3, 3] }
    compareHandsSym(hand1, hand2, 1);
    hand2 = { type: HAND_TYPES.SET, values: [5, 5, 5] }
    compareHandsSym(hand1, hand2, -1);
    hand2 = { type: HAND_TYPES.PAIR, values: [7, 7, 2] }
    compareHandsSym(hand1, hand2, 1);
    hand2 = { type: HAND_TYPES.FLUSH, values: [10, 9, 8] }
    compareHandsSym(hand1, hand2, 1);
    hand2 = { type: HAND_TYPES.HIGH, values: [10, 9, 8] }
    compareHandsSym(hand1, hand2, 1);
  });

  it("pair_top", async function () {
    const hand1 = { type: HAND_TYPES.PAIR, values: [7, 4, 4] }
    let hand2 = { type: HAND_TYPES.PAIR, values: [7, 4, 4] }
    compareHandsSym(hand1, hand2, 0);
    hand2 = { type: HAND_TYPES.PAIR, values: [6, 4, 4] }
    compareHandsSym(hand1, hand2, 1);
    hand2 = { type: HAND_TYPES.PAIR, values: [8, 3, 3] }
    compareHandsSym(hand1, hand2, 1);
    hand2 = { type: HAND_TYPES.PAIR, values: [3, 3, 2] }
    compareHandsSym(hand1, hand2, 1);
    hand2 = { type: HAND_TYPES.PAIR, values: [8, 4, 4] }
    compareHandsSym(hand1, hand2, -1);
    hand2 = { type: HAND_TYPES.PAIR, values: [6, 5, 5] }
    compareHandsSym(hand1, hand2, -1);
    hand2 = { type: HAND_TYPES.PAIR, values: [5, 5, 1] }
    compareHandsSym(hand1, hand2, -1);
    hand2 = { type: HAND_TYPES.FLUSH, values: [10, 9, 8] }
    compareHandsSym(hand1, hand2, 1);
    hand2 = { type: HAND_TYPES.HIGH, values: [10, 9, 8] }
    compareHandsSym(hand1, hand2, 1);
  });

  it("pair_bot", async function () {
    const hand1 = { type: HAND_TYPES.PAIR, values: [5, 5, 2] }
    let hand2 = { type: HAND_TYPES.PAIR, values: [5, 5, 2] }
    compareHandsSym(hand1, hand2, 0);
    hand2 = { type: HAND_TYPES.PAIR, values: [5, 5, 1] }
    compareHandsSym(hand1, hand2, 1);
    hand2 = { type: HAND_TYPES.PAIR, values: [4, 4, 3] }
    compareHandsSym(hand1, hand2, 1);
    hand2 = { type: HAND_TYPES.PAIR, values: [5, 4, 4] }
    compareHandsSym(hand1, hand2, 1);
    hand2 = { type: HAND_TYPES.PAIR, values: [5, 5, 3] }
    compareHandsSym(hand1, hand2, -1);
    hand2 = { type: HAND_TYPES.PAIR, values: [6, 6, 1] }
    compareHandsSym(hand1, hand2, -1);
    hand2 = { type: HAND_TYPES.PAIR, values: [7, 6, 6] }
    compareHandsSym(hand1, hand2, -1);
    hand2 = { type: HAND_TYPES.FLUSH, values: [10, 9, 8] }
    compareHandsSym(hand1, hand2, 1);
    hand2 = { type: HAND_TYPES.HIGH, values: [10, 9, 8] }
    compareHandsSym(hand1, hand2, 1);
  });

  it("flush", async function () {
    const hand1 = { type: HAND_TYPES.FLUSH, values: [7, 5, 2] }
    let hand2 = { type: HAND_TYPES.FLUSH, values: [7, 5, 2] }
    compareHandsSym(hand1, hand2, 0);
    hand2 = { type: HAND_TYPES.FLUSH, values: [7, 5, 1] }
    compareHandsSym(hand1, hand2, 1);
    hand2 = { type: HAND_TYPES.FLUSH, values: [7, 4, 3] }
    compareHandsSym(hand1, hand2, 1);
    hand2 = { type: HAND_TYPES.FLUSH, values: [6, 5, 3] }
    compareHandsSym(hand1, hand2, 1);
    hand2 = { type: HAND_TYPES.FLUSH, values: [8, 5, 4] }
    compareHandsSym(hand1, hand2, -1);
    hand2 = { type: HAND_TYPES.FLUSH, values: [7, 6, 3] }
    compareHandsSym(hand1, hand2, -1);
    hand2 = { type: HAND_TYPES.FLUSH, values: [8, 5, 3] }
    compareHandsSym(hand1, hand2, -1);
    hand2 = { type: HAND_TYPES.HIGH, values: [10, 9, 8] }
    compareHandsSym(hand1, hand2, 1);
  });

  it("high", async function () {
    const hand1 = { type: HAND_TYPES.HIGH, values: [7, 5, 3] }
    let hand2 = { type: HAND_TYPES.HIGH, values: [7, 5, 3] }
    compareHandsSym(hand1, hand2, 0);
    hand2 = { type: HAND_TYPES.HIGH, values: [7, 5, 2] }
    compareHandsSym(hand1, hand2, 1);
    hand2 = { type: HAND_TYPES.HIGH, values: [7, 4, 3] }
    compareHandsSym(hand1, hand2, 1);
    hand2 = { type: HAND_TYPES.HIGH, values: [6, 5, 3] }
    compareHandsSym(hand1, hand2, 1);
    hand2 = { type: HAND_TYPES.HIGH, values: [8, 5, 4] }
    compareHandsSym(hand1, hand2, -1);
    hand2 = { type: HAND_TYPES.HIGH, values: [7, 6, 3] }
    compareHandsSym(hand1, hand2, -1);
    hand2 = { type: HAND_TYPES.HIGH, values: [8, 5, 3] }
    compareHandsSym(hand1, hand2, -1);
  });
})