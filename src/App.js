import React from 'react';
import './App.css';

const NCARDS = 7;
const NPIPS = 6;
const COLORS = [
  "red",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
];

function shuffle(a) {
  for (let i = a.length; i > 0; i--) {
    const j = Math.floor(Math.random() * i);
    const tmp = a[i - 1];
    a[i - 1] = a[j];
    a[j] = tmp;
  }
}

const Card = React.memo((props) => {
  const r = Math.min(props.width / 2, props.height / 3) / 3;

  let circles = [];
  for (let i = 0; i < NPIPS; i++) {
    if (props.pips & (1 << i)) {
      circles.push(
        <circle
          key={i}
          cx={1.75 * r + (i % 2 ? 2.5 * r : 0)}
          cy={1.75 * r + 2.75 * r * Math.floor(i / 2)}
          r={r}
          fill={COLORS[i]}
          onClick={props.onClick}
        />
      );
    }
  }

  return (
    <div class="Card">
      <svg
        version="1.1"
        viewBox="0 0 220 320"
        baseProfile="full"
        xmlns="http://www.w3.org/2000/svg">
        <g>
          <rect
            stroke={(props.selected ? "green" : "black")}
            strokeWidth={props.pips > 0 ? "5px" : "0px"}
            fill="white"
            x={5}
            y={5}
            width={props.width}
            height={props.height}
            rx={r}
            onClick={props.onClick}
          />
          {circles}
        </g>
      </svg>
    </div>
  );
});

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
      this.clickHandlers.push(() => this.selectCard(i));
    }

    this.state = {
      deck,
      cardPips,
      selected: 0,
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
          selected={this.state.selected & (1 << i)}
          onClick={this.clickHandlers[i]}
        />
      );
    }

    return (
      <div className="App">
        <div className="Description">
          <p>
            <a
              href="https://en.wikipedia.org/wiki/Projective_Set_(game)"
            >
              ProSet
            </a> is a variant of <a
              href="https://en.wikipedia.org/wiki/Set_(card_game)"
            >
              Set
            </a> created at <a
              href="https://en.wikipedia.org/wiki/Canada/USA_Mathcamp"
            >
              Canada/USA MathCamp
            </a>. Find a set of cards which have an even number of each colour
            of dot!
          </p>
        </div>
        <div class="All-Cards">
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
    if (selected !== 0 && this.proSetEh(selectedCards)) {
      this.replaceSelection(selectedCards);
    } else {
      this.setState({
        selected,
      });
    }
  }

  proSetEh(selection) {
    let pipTotal = 0;
    for (let s of selection) {
      pipTotal ^= s;
    }
    return pipTotal === 0;
  }

  replaceSelection(selectedCards) {
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
}

export default App;
