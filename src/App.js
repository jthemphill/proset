import React from 'react';
import './App.css';

const NCARDS = 7;
const NPIPS = 6;
const COLORS = [
  "red",
  "orange",
  "#f7f020",
  "green",
  "blue",
  "purple",
];
const HIGHLIGHT = "#00aa00";
const CARD_BG = "#dddddd";

function shuffle(a) {
  for (let i = a.length; i > 0; i--) {
    const j = Math.floor(Math.random() * i);
    const tmp = a[i - 1];
    a[i - 1] = a[j];
    a[j] = tmp;
  }
}

class Card extends React.PureComponent {

  render() {
    const r = Math.min(this.props.width / 2, this.props.height / 3) / 3;

    let circles = [];
    for (let i = 0; i < NPIPS; i++) {
      if (this.props.pips & (1 << i)) {
        circles.push(
          <circle
            key={i}
            cx={1.80 * r + (i % 2 ? 2.5 * r : 0)}
            cy={1.75 * r + 2.75 * r * Math.floor(i / 2)}
            r={r}
            fill={COLORS[i]}
          />
        );
      }
    }

    return (
      <div className="Card" onClick={this.props.onClick}>
        <svg
          version="1.1"
          viewBox="0 0 220 320"
          baseProfile="full"
          xmlns="http://www.w3.org/2000/svg">
          <g>
            <rect
              stroke={this.getHighlight()}
              strokeWidth={this.props.pips > 0 ? "5px" : "0px"}
              fill={CARD_BG}
              x={5}
              y={5}
              width={this.props.width}
              height={this.props.height}
              rx={r}
            />
            {circles}
          </g>
        </svg>
      </div>
    );
  }

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

class App extends React.PureComponent {

  constructor() {
    super();

    let deck = [];
    for (let i = 1; i < (1 << NPIPS); i++) {
      deck.push(i);
    }
    shuffle(deck);

    let cardPips = {};
    for (let i = 0; i < NCARDS; i++) {
      cardPips[i] = 0;
    }
    this.drawCards(cardPips, deck);

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

    this.spoilHandler = () => this.spoil();

    this.state = {
      deck,
      cardPips,
      selected: 0,
      spoiler: false,
    };
  }

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
          pips={this.state.cardPips[i]}
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

  drawCards(cardPips, deck) {
    for (let i = 0; i < NCARDS; i++) {
      if (cardPips[i] === 0) {
        if (deck.length === 0) {
          return;
        }
        cardPips[i] = deck.pop();
      }
    }
  }

  selectCard(i) {
    const selected = this.state.selected ^ (1 << i);
    let selectedCards = new Set();
    for (let i = 0; i < NCARDS; i++) {
      if (selected & (1 << i)) {
        selectedCards.add(this.state.cardPips[i]);
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

  proSetEh(selected) {
    let pipTotal = 0;
    for (let s of selected) {
      pipTotal ^= s;
    }
    return pipTotal === 0;
  }

  replaceSelected(selectedCards) {
    let cardPips = { ...this.state.cardPips };
    for (let i = 0; i < NCARDS; i++) {
      if (selectedCards.has(cardPips[i])) {
        cardPips[i] = 0;
      }
    }
    let deck = [...this.state.deck];
    this.drawCards(cardPips, deck);
    this.setState({
      cardPips,
      deck,
      selected: 0,
    });
  }

  findProSet(choices, minI, pipTotal) {
    if (choices > 0 && pipTotal === 0) {
      return choices;
    }

    for (let i = minI; i < NCARDS; i++) {
      const useIt = this.findProSet(
        choices ^ (1 << i),
        i + 1,
        pipTotal ^ this.state.cardPips[i],
      );
      if (useIt !== 0) {
        return useIt;
      }
      const loseIt = this.findProSet(
        choices,
        i + 1,
        pipTotal ^ this.state.cardPips[i],
      );
      if (loseIt !== 0) {
        return loseIt;
      }
    }

    return 0;
  }

  spoil() {
    const proSet = this.findProSet(0, 0, 0);
    let selection = [];
    for (let i = 0; i < NCARDS; i++) {
      if (proSet & (1 << i)) {
        selection.push(this.state.cardPips[i]);
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
