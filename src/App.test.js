import React from 'react';
import { render, fireEvent, waitForElement } from '@testing-library/react'
import App from './App';

test('can spoil a ProSet', async () => {
  const div = document.createElement('div');
  const { getByText, getAllByTestId, queryAllByTestId } = render(<App />, div);

  fireEvent.click(getByText('I give up. Show me a sample ProSet!'));

  const spoiledCards = await waitForElement(() =>
    getAllByTestId('spoiled-card')
  );

  // Clear the spoiler
  fireEvent.click(spoiledCards[0]);

  // Click each of the spoiled cards
  for (let i = 0; i < spoiledCards.length; ++i) {
    const selectedCards = await waitForElement(
      () => queryAllByTestId('selected-card')
    );
    expect(selectedCards.length).toBe(i);
    fireEvent.click(spoiledCards[i]);
  }

  // If we clicked on a valid ProSet, the game will clear our
  // selection and provide new cards. Verify that the game has cleared
  // our selection.
  const selectedCards = await waitForElement(
    () => queryAllByTestId('selected-card')
  );
  expect(selectedCards.length).toBe(0);
});
