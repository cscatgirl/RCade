<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { GameInfo } from '../../shared/types';
  import { navigateToCarousel } from '../router.svelte';

  interface Props {
    game: GameInfo;
  }

  let { game }: Props = $props();

  function handleKeydown(event: KeyboardEvent) {
    if (event.code === 'ShiftLeft') {
      navigateToCarousel();
    }
  }

  onMount(() => {
    window.addEventListener('keydown', handleKeydown);
  });

  onDestroy(() => {
    window.removeEventListener('keydown', handleKeydown);
  });
</script>

<div class="game-page">
  <div class="game-card">
    <h1 class="game-name">{game.name}</h1>
    <p class="game-version">v{game.latestVersion}</p>
  </div>
  <p class="hint">Press Menu to return</p>
</div>

<style>
  .game-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 8px;
    text-align: center;
  }

  .game-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    width: 100%;
  }

  .game-name {
    font-size: clamp(24px, 12vw, 48px);
    font-weight: 700;
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 2px;
    word-break: break-word;
    line-height: 1.1;
    margin-bottom: 8px;
  }

  .game-version {
    font-size: clamp(12px, 5vw, 18px);
    color: #888;
    font-weight: 400;
  }

  .hint {
    font-size: clamp(10px, 4vw, 14px);
    color: #555;
    position: absolute;
    bottom: 16px;
  }
</style>
