import React from 'react';
import './App.css';

// Number of visible cards
const NCARDS = 7;

// Colour of each pip on the card
const PIP_COLOURS = [
  "red",
  "orange",
  "#f7f020",
  "green",
  "blue",
  "purple",
];

// Border of a selected card
const HIGHLIGHT = "#00aa00";

// Background colour of each card
const CARD_BG = "#dddddd";

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

class Card extends React.PureComponent {

  /**
   * React method to display this card as HTML.
   */
  render() {
    const r = Math.min(this.props.width / 2, this.props.height / 3) / 3;

    let circles = [];
    for (let i = 0; i < PIP_COLOURS.length; i++) {
      if (this.props.pips & (1 << i)) {
        circles.push(
          <circle
            key={i}
            cx={1.80 * r + (i % 2 ? 2.5 * r : 0)}
            cy={1.75 * r + 2.75 * r * Math.floor(i / 2)}
            r={r}
            fill={PIP_COLOURS[i]}
            onClick={this.props.onClick}
          />
        );
      }
    }

    const testId = this.getTestId();

    return (
      <div className="Card">
        <svg
          version="1.1"
          viewBox="0 0 220 320"
          baseProfile="full"
          xmlns="http://www.w3.org/2000/svg">
          <g>
            <rect
              data-testid={testId}
              stroke={this.getHighlight()}
              strokeWidth={this.props.pips > 0 ? "5px" : "0px"}
              fill={CARD_BG}
              x={5}
              y={5}
              width={this.props.width}
              height={this.props.height}
              rx={r}
              onClick={this.props.onClick}
            />
            {circles}
          </g>
        </svg>
      </div>
    );
  }

  /**
   * Return an identifier that tests can use to determine if a card is
   * selected or spoiled.
   */
  getTestId() {
    if (!this.props.selected) {
      return 'unselected-card';
    }

    if (this.props.spoiler) {
      return 'spoiled-card';
    }

    return 'selected-card';
  }

  /**
   * What colour should the border around this card be?
   */
  getHighlight() {
    if (!this.props.selected) {
      return "black";
    }

    if (this.props.spoiler) {
      return "red";
    }

    return HIGHLIGHT;
  }
}

/**
 * Represents the overall game.
 */
class App extends React.PureComponent {

  constructor() {
    super();

    // Create a deck of (2^numpips) - 1 cards. Each card is
    // represented by an integer between 1 and (2^numpips) - 1. Each
    // pip is present in a card iff that bit is set in the integer's
    // binary representation.
    let deck = [];
    for (let i = 1; i < (1 << PIP_COLOURS.length); i++) {
      deck.push(i);
    }
    shuffle(deck);

    // Draw and display some cards from the deck
    let visibleCards = {};
    for (let i = 0; i < NCARDS; i++) {
      visibleCards[i] = 0;
    }
    this.drawCards(visibleCards, deck);

    // Allow people to select the cards by clicking on them
    this.clickHandlers = [];
    for (let i = 0; i < NCARDS; i++) {
      this.clickHandlers.push(() => {
        if (this.state.spoiler) {
          this.setState({selected: 0, spoiler: false});
        } else {
          this.selectCard(i);
        }
      });
    }

    // Allow people to click the spoiler button to see a solution
    this.spoilHandler = () => this.spoil();

    // Set the React state
    this.state = {
      deck,
      visibleCards,
      selected: 0,
      spoiler: false,
    };
  }

  /**
   * React method to display the app as HTML.
   */
  render() {
    let cards = [];
    for (let i = 0; i < NCARDS; i++) {
      cards.push(
        <Card
          key={i}
          x={10 + 210 * Math.floor(i / 2)}
          y={10 + (i % 2 ? 310 : 0)}
          width={200}
          height={300}
          pips={this.state.visibleCards[i]}
          selected={(this.state.selected & (1 << i)) !== 0}
          spoiler={this.state.spoiler}
          onClick={this.clickHandlers[i]}
        />
      );
    }

    return (
      <div className="App">
        <div className="Description">
          <p>
            <a
              className="App-link"
              href="https://en.wikipedia.org/wiki/Projective_Set_(game)"
            >
              ProSet
            </a> is a variant of <a
              className="App-link"
              href="https://en.wikipedia.org/wiki/Set_(card_game)"
            >
              Set
            </a> created at <a
              className="App-link"
              href="https://en.wikipedia.org/wiki/Canada/USA_Mathcamp"
            >
              Canada/USA MathCamp
            </a>. Find a set of cards which have an even number of each colour
            of dot!
          </p>
          <p>
            Cards remaining: <strong>{this.state.deck.length}</strong>. <button
              className="App-link"
              onClick={this.spoilHandler}
            >
              I give up. Show me a sample ProSet!
            </button>
          </p>
        </div>
        <div className="All-Cards">
          {cards}
        </div>
      </div>
    );
  }

  /**
   * Replace empty slots in the visible cards with new cards from the
   * deck.
   */
  drawCards(visibleCards, deck) {
    for (let i = 0; i < NCARDS; i++) {
      if (visibleCards[i] === 0) {
        if (deck.length === 0) {
          return;
        }
        visibleCards[i] = deck.pop();
      }
    }
  }

  /**
   * Select the card in the ith slot among the visible cards.
   */
  selectCard(i) {
    const selected = this.state.selected ^ (1 << i);
    let selectedCards = new Set();
    for (let i = 0; i < NCARDS; i++) {
      if (selected & (1 << i)) {
        selectedCards.add(this.state.visibleCards[i]);
      }
    }
    if (selected !== 0 && !this.spoiler && this.proSetEh(selectedCards)) {
      this.replaceSelected(selectedCards);
    } else {
      this.setState({
        selected,
      });
    }
  }

  /**
   * Return true iff the given list of cards has an even number of
   * each dot.
   */
  proSetEh(selectedCards) {
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
    let visibleCards = { ...this.state.visibleCards };
    for (let i = 0; i < NCARDS; i++) {
      if (selectedCards.has(visibleCards[i])) {
        visibleCards[i] = 0;
      }
    }
    let deck = [...this.state.deck];
    this.drawCards(visibleCards, deck);
    this.setState({
      visibleCards,
      deck,
      selected: 0,
    });
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
        pipTotal ^ this.state.visibleCards[i],
      );
      if (useIt !== 0) {
        return useIt;
      }
      const loseIt = this.findProSet(
        choices,
        i + 1,
        pipTotal ^ this.state.visibleCards[i],
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
    let selection = [];
    for (let i = 0; i < NCARDS; i++) {
      if (proSet & (1 << i)) {
        selection.push(this.state.visibleCards[i]);
      }
    }
    let selected = 0;
    for (let i = 0; i < NCARDS; i++) {
      if (proSet & (1 << i)) {
        selected ^= (1 << i);
      }
    }
    this.setState({
      selected,
      spoiler: true,
    });
  }
}

export default App;
