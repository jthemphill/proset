import { test, expect } from "bun:test";
import { ProSetGame, NCARDS } from "./proset.js";

test("spoiler algorithm finds a valid ProSet", () => {
  // Mock the DOM so we can instantiate the game
  globalThis.document = {
    addEventListener: () => {},
    getElementById: (id) => {
      if (id === "cards-remaining") {
        return { textContent: "" };
      }
      if (id === "spoiler-button") {
        return { addEventListener: () => {} };
      }
      if (id === "cards-container") {
        return {
          innerHTML: "",
          appendChild: () => {},
        };
      }
      return null;
    },
    createElement: () => ({
      className: "",
      innerHTML: "",
      textContent: "",
      appendChild: () => {},
      addEventListener: () => {},
    }),
    createElementNS: () => ({
      setAttribute: () => {},
      appendChild: () => {},
      addEventListener: () => {},
      classList: {
        add: () => {},
      },
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
  expect(game.isProSet(selectedCards)).toBe(true);

  // Extra verification: XOR all the cards should equal 0
  let pipTotal = 0;
  for (let card of selectedCards) {
    pipTotal ^= card;
  }
  expect(pipTotal).toBe(0);
});

test("win animation plays when game is finished", () => {
  // Track animation frames and timeouts
  let rafCallbacks = [];
  let timeoutCallbacks = [];
  let animationFrameId = 0;

  // Mock window object for animation
  globalThis.window = {
    innerWidth: 1200,
    innerHeight: 800,
    requestAnimationFrame: (callback) => {
      rafCallbacks.push(callback);
      return ++animationFrameId;
    },
  };

  // Track created overlay element and cards
  let overlayElement = null;
  const cardElements = [];

  // Mock the DOM with more complete animation support
  globalThis.document = {
    body: {
      appendChild: (element) => {
        if (element.id === "win-animation-overlay") {
          overlayElement = element;
        }
      },
    },
    addEventListener: () => {},
    getElementById: (id) => {
      if (id === "cards-remaining") {
        return { textContent: "" };
      }
      if (id === "spoiler-button") {
        return { addEventListener: () => {} };
      }
      if (id === "cards-container") {
        return {
          innerHTML: "",
          appendChild: () => {},
        };
      }
      return null;
    },
    createElement: () => {
      const element = {
        id: "",
        className: "",
        innerHTML: "",
        textContent: "",
        style: { transform: "" },
        appendChild: (child) => {
          if (element.id === "win-animation-overlay") {
            cardElements.push(child);
          }
        },
        addEventListener: () => {},
        classList: {
          add: () => {},
        },
      };
      return element;
    },
    createElementNS: () => ({
      setAttribute: () => {},
      appendChild: () => {},
      addEventListener: () => {},
      classList: {
        add: () => {},
      },
      style: {},
    }),
  };

  // Mock setTimeout
  globalThis.setTimeout = (callback, delay) => {
    timeoutCallbacks.push({ callback, delay });
  };

  // Create a game instance
  const game = new ProSetGame();

  // Simulate finishing the game by clearing all cards
  game.deck = []; // Empty the deck
  for (let i = 0; i < NCARDS; i++) {
    game.visibleCards[i] = 0; // Clear all visible cards
  }

  // Trigger the win condition by calling replaceSelected with empty set
  game.replaceSelected(new Set());

  // Verify that the overlay was created
  expect(overlayElement).not.toBeNull();
  expect(overlayElement.id).toBe("win-animation-overlay");

  // Verify that cards were created
  expect(cardElements.length).toBe(20);

  // Activate all cards by running the timeout callbacks
  timeoutCallbacks.forEach(({ callback }) => callback());

  // Run animation frames to settle the cards
  // Need enough frames for cards to fall and settle (simulate ~10 seconds at 60fps)
  const framesToRun = 600;

  for (let frame = 0; frame < framesToRun; frame++) {
    // Execute all pending animation frames
    const currentCallbacks = [...rafCallbacks];
    rafCallbacks = [];
    currentCallbacks.forEach((callback) => callback());
  }
  expect(rafCallbacks.length).toBe(0);

  // After many frames, verify that all cards have settled near the bottom
  // Cards should have transforms with Y positions near the ground level (650)
  const groundLevel = 650; // window.innerHeight (800) - 150

  cardElements.forEach((card) => {
    const transform = card.style.transform;
    if (transform) {
      // Parse the Y position from transform: translate(Xpx, Ypx) rotate(Rdeg)
      const match = transform.match(/translate\([^,]+,\s*([0-9.]+)px\)/);
      if (match) {
        const yPosition = parseFloat(match[1]);
        // Card should be at or near ground level (allow 10px tolerance for bouncing)
        expect(yPosition).toBeGreaterThanOrEqual(groundLevel - 10);
        expect(yPosition).toBeLessThanOrEqual(groundLevel + 1);
      }
    }
  });
});

test("deselect all button clears selected cards", () => {
  // Mock the DOM
  globalThis.document = {
    addEventListener: () => {},
    getElementById: (id) => {
      if (id === "cards-remaining") {
        return { textContent: "" };
      }
      if (id === "spoiler-button") {
        return { addEventListener: () => {} };
      }
      if (id === "deselect-button") {
        return { addEventListener: () => {} };
      }
      if (id === "cards-container") {
        return {
          innerHTML: "",
          appendChild: () => {},
        };
      }
      return null;
    },
    createElement: () => ({
      className: "",
      innerHTML: "",
      textContent: "",
      appendChild: () => {},
      addEventListener: () => {},
    }),
    createElementNS: () => ({
      setAttribute: () => {},
      appendChild: () => {},
      addEventListener: () => {},
      classList: {
        add: () => {},
      },
      style: {},
    }),
  };

  // Create a game instance
  const game = new ProSetGame();

  // Select some cards
  game.selectCard(0);
  game.selectCard(1);
  game.selectCard(2);

  // Verify cards are selected
  expect(game.selected).toBeGreaterThan(0);

  // Call deselectAll
  game.deselectAll();

  // Verify all cards are deselected
  expect(game.selected).toBe(0);
  expect(game.spoiler).toBe(false);
});

test("deselect all clears spoiler mode", () => {
  // Mock the DOM
  globalThis.document = {
    addEventListener: () => {},
    getElementById: (id) => {
      if (id === "cards-remaining") {
        return { textContent: "" };
      }
      if (id === "spoiler-button") {
        return { addEventListener: () => {} };
      }
      if (id === "deselect-button") {
        return { addEventListener: () => {} };
      }
      if (id === "cards-container") {
        return {
          innerHTML: "",
          appendChild: () => {},
        };
      }
      return null;
    },
    createElement: () => ({
      className: "",
      innerHTML: "",
      textContent: "",
      appendChild: () => {},
      addEventListener: () => {},
    }),
    createElementNS: () => ({
      setAttribute: () => {},
      appendChild: () => {},
      addEventListener: () => {},
      classList: {
        add: () => {},
      },
      style: {},
    }),
  };

  // Create a game instance
  const game = new ProSetGame();

  // Trigger spoiler mode
  game.spoil();

  // Verify spoiler mode is active
  expect(game.spoiler).toBe(true);
  expect(game.selected).toBeGreaterThan(0);

  // Call deselectAll
  game.deselectAll();

  // Verify spoiler mode is cleared
  expect(game.spoiler).toBe(false);
  expect(game.selected).toBe(0);
});
