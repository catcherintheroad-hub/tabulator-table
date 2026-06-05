import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App';

test('renders the C.A.R.D.S. Tabulator dashboard shell', () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: /sports card inventory/i })).toBeInTheDocument();
  expect(screen.getByRole('searchbox', { name: /search by player name/i })).toBeInTheDocument();
});

test('configures Tabulator with pro dashboard columns, pagination, and player search', async () => {
  const tableApi = {
    clearFilter: jest.fn(),
    destroy: jest.fn(),
    setFilter: jest.fn(),
  };

  window.Tabulator = jest.fn(() => tableApi);

  render(<App />);

  await waitFor(() => expect(window.Tabulator).toHaveBeenCalledTimes(1));

  const [, config] = window.Tabulator.mock.calls[0];
  expect(config.pagination).toBe(true);
  expect(config.paginationSize).toBe(20);
  expect(config.layout).toBe('fitColumns');
  expect(config.initialSort).toEqual([{ column: 'date', dir: 'desc' }]);
  expect(config.data).toHaveLength(26);
  expect(config.columns.map((column) => column.title)).toEqual([
    '',
    'Title',
    'Grade',
    'Value',
    'Status',
    'Date',
  ]);

  fireEvent.change(screen.getByRole('searchbox', { name: /search by player name/i }), {
    target: { value: 'Jordan' },
  });

  expect(tableApi.setFilter).toHaveBeenCalledWith('playerName', 'like', 'Jordan');
});
