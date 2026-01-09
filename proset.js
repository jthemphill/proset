// Number of visible cards
const NCARDS = 7;

// Colour of each pip on the card
const PIP_COLOURS = [
  "#ef4444",
  "#f97316",
  "#f7f020",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
];

/**
 * Randomise the given list of cards.
 */
function shuffle(deck) {
  for (let i = deck.length; i > 0; i--) {
    const j = Math.floor(Math.random() * i);
    const tmp = deck[i - 1];
    deck[i - 1] = deck[j];
    deck[j] = tmp;
  }
}

/**
 * Create an SVG card element.
 */
function createCard(index, pips, selected, spoiler, onClick) {
  const width = 200;
  const height = 300;
  const r = Math.min(width / 2, height / 3) / 3;

  const cardDiv = document.createElement("div");
  cardDiv.className = "Card";

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("version", "1.1");
  svg.setAttribute("viewBox", "0 0 220 320");
  svg.setAttribute("baseProfile", "full");

  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

  // Create the card background rectangle
  const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");

  // Set test ID
  let testId = "unselected-card";
  if (selected) {
    testId = spoiler ? "spoiled-card" : "selected-card";
  }
  rect.setAttribute("data-testid", testId);

  // Set CSS classes for styling
  rect.setAttribute("class", "card-rect");
  if (pips === 0) {
    rect.classList.add("empty");
  } else if (selected) {
    rect.classList.add(spoiler ? "spoiled" : "selected");
  }

  rect.setAttribute("x", 5);
  rect.setAttribute("y", 5);
  rect.setAttribute("width", width);
  rect.setAttribute("height", height);
  rect.setAttribute("rx", r);
  rect.addEventListener("click", onClick);

  g.appendChild(rect);

  // Create the pips
  for (let i = 0; i < PIP_COLOURS.length; i++) {
    if (pips & (1 << i)) {
      const circle = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );
      circle.setAttribute("class", "card-pip");
      circle.setAttribute("cx", 1.8 * r + (i % 2 ? 2.5 * r : 0));
      circle.setAttribute("cy", 1.75 * r + 2.75 * r * Math.floor(i / 2));
      circle.setAttribute("r", r);
      circle.setAttribute("fill", PIP_COLOURS[i]);
      circle.addEventListener("click", onClick);
      g.appendChild(circle);
    }
  }

  svg.appendChild(g);
  cardDiv.appendChild(svg);

  return cardDiv;
}

/**
 * Represents the overall game.
 */
class ProSetGame {
  constructor() {
    // Create a deck of (2^numpips) - 1 cards. Each card is
    // represented by an integer between 1 and (2^numpips) - 1. Each
    // pip is present in a card iff that bit is set in the integer's
    // binary representation.
    this.deck = [];
    for (let i = 1; i < 1 << PIP_COLOURS.length; i++) {
      this.deck.push(i);
    }
    shuffle(this.deck);

    // Draw and display some cards from the deck
    this.visibleCards = {};
    for (let i = 0; i < NCARDS; i++) {
      this.visibleCards[i] = 0;
    }
    this.drawCards();

    this.selected = 0;
    this.spoiler = false;

    // Set up spoiler button event listener
    const spoilerButton = document.getElementById("spoiler-button");
    if (spoilerButton) {
      spoilerButton.addEventListener("click", () => {
        this.spoil();
      });
    }

    this.render();
  }

  /**
   * Replace empty slots in the visible cards with new cards from the
   * deck.
   */
  drawCards() {
    for (let i = 0; i < NCARDS; i++) {
      if (this.visibleCards[i] === 0) {
        if (this.deck.length === 0) {
          return;
        }
        this.visibleCards[i] = this.deck.pop();
      }
    }
  }

  /**
   * Select the card in the ith slot among the visible cards.
   */
  selectCard(i) {
    const selected = this.selected ^ (1 << i);
    let selectedCards = new Set();
    for (let i = 0; i < NCARDS; i++) {
      if (selected & (1 << i)) {
        selectedCards.add(this.visibleCards[i]);
      }
    }
    if (selected !== 0 && !this.spoiler && this.isProSet(selectedCards)) {
      this.replaceSelected(selectedCards);
    } else {
      this.selected = selected;
      this.render();
    }
  }

  /**
   * Return true iff the given list of cards has an even number of
   * each dot.
   */
  isProSet(selectedCards) {
    let pipTotal = 0;
    for (let selectedCard of selectedCards) {
      pipTotal ^= selectedCard;
    }
    return pipTotal === 0;
  }

  /**
   * Remove each of the given cards from the visible cards and draw
   * new cards to replace them.
   */
  replaceSelected(selectedCards) {
    for (let i = 0; i < NCARDS; i++) {
      if (selectedCards.has(this.visibleCards[i])) {
        this.visibleCards[i] = 0;
      }
    }
    this.drawCards();
    this.selected = 0;
    this.render();
  }

  /**
   * Find and return a selection of cards making a ProSet. Used to
   * make the spoiler button work.
   */
  findProSet(choices, minI, pipTotal) {
    if (choices > 0 && pipTotal === 0) {
      return choices;
    }

    for (let i = minI; i < NCARDS; i++) {
      const useIt = this.findProSet(
        choices ^ (1 << i),
        i + 1,
        pipTotal ^ this.visibleCards[i]
      );
      if (useIt !== 0) {
        return useIt;
      }
      const loseIt = this.findProSet(
        choices,
        i + 1,
        pipTotal ^ this.visibleCards[i]
      );
      if (loseIt !== 0) {
        return loseIt;
      }
    }

    return 0;
  }

  /**
   * Find a selection of cards making a ProSet and highlight them.
   */
  spoil() {
    const proSet = this.findProSet(0, 0, 0);
    let selected = 0;
    for (let i = 0; i < NCARDS; i++) {
      if (proSet & (1 << i)) {
        selected ^= 1 << i;
      }
    }
    this.selected = selected;
    this.spoiler = true;
    this.render();
  }

  /**
   * Render the game to the DOM.
   */
  render() {
    // Update cards remaining count
    const cardsRemainingElement = document.getElementById("cards-remaining");
    if (cardsRemainingElement) {
      cardsRemainingElement.textContent = this.deck.length;
    }

    // Update cards
    const cardsContainer = document.getElementById("cards-container");
    if (!cardsContainer) return;

    cardsContainer.innerHTML = "";

    for (let i = 0; i < NCARDS; i++) {
      const card = createCard(
        i,
        this.visibleCards[i],
        (this.selected & (1 << i)) !== 0,
        this.spoiler,
        () => {
          if (this.spoiler) {
            this.selected = 0;
            this.spoiler = false;
            this.render();
          } else {
            this.selectCard(i);
          }
        }
      );
      cardsContainer.appendChild(card);
    }
  }
}

// Initialize the game when the page loads
if (typeof window !== "undefined" && typeof document !== "undefined") {
  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", () => {
      window.game = new ProSetGame();
    });
  } else {
    // DOM is already loaded
    window.game = new ProSetGame();
  }
}

// Export for testing (ESM)
export { ProSetGame, NCARDS };
