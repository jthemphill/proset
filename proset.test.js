import { test, expect } from "bun:test";
import { ProSetGame, NCARDS } from "./proset.js";

test('spoiler algorithm finds a valid ProSet', () => {
  // Mock the DOM so we can instantiate the game
  globalThis.document = {
    getElementById: () => ({
      innerHTML: '',
      appendChild: () => {},
    }),
    createElement: () => ({
      className: '',
      innerHTML: '',
      textContent: '',
      appendChild: () => {},
      addEventListener: () => {},
    }),
    createElementNS: () => ({
      setAttribute: () => {},
      appendChild: () => {},
      addEventListener: () => {},
      style: {},
    }),
  };

  // Create a game instance
  const game = new ProSetGame();

  // Find a ProSet using the spoiler algorithm
  const proSet = game.findProSet(0, 0, 0);

  // Verify that we found a ProSet
  expect(proSet).toBeGreaterThan(0);

  // Collect the cards in the found ProSet
  let selectedCards = new Set();
  for (let i = 0; i < NCARDS; i++) {
    if (proSet & (1 << i)) {
      selectedCards.add(game.visibleCards[i]);
    }
  }

  // Verify that we have at least 2 cards in the ProSet
  expect(selectedCards.size).toBeGreaterThanOrEqual(2);

  // Verify that the found ProSet is actually valid
  // (has an even number of each pip)
  expect(game.proSetEh(selectedCards)).toBe(true);

  // Extra verification: XOR all the cards should equal 0
  let pipTotal = 0;
  for (let card of selectedCards) {
    pipTotal ^= card;
  }
  expect(pipTotal).toBe(0);
});
