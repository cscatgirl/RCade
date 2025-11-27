import type { GameInfo } from '../shared/types';

type Route =
  | { page: 'carousel' }
  | { page: 'game'; game: GameInfo };

let currentRoute = $state<Route>({ page: 'carousel' });

export function getRoute() {
  return currentRoute;
}

export function navigateToCarousel() {
  currentRoute = { page: 'carousel' };
}

export function navigateToGame(game: GameInfo) {
  currentRoute = { page: 'game', game };
}
