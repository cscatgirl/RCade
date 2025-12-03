# @rcade/plugin-input-spinners

Input plugin for RCade's spinner controls (rotary encoders).

## Installation

```bash
npm install @rcade/plugin-input-spinners
```

## Usage

```javascript
import { PLAYER_1, PLAYER_2, on } from "@rcade/plugin-input-spinners";

function gameLoop() {
  // Polling-based: check spinner position
  const paddleX = PLAYER_1.SPINNER.position % screenWidth;

  requestAnimationFrame(gameLoop);
}

// Event-based: respond to spin events
on("spin", ({ player, delta, position }) => {
  console.log(`Player ${player} spun ${delta}, now at ${position}`);
});
```

## API

### PLAYER_1 / PLAYER_2

```typescript
{
  SPINNER: { delta: number, position: number }
}
```

- `delta`: The change since the last update
- `position`: Cumulative position (can be negative)

### STATUS

```typescript
{
  connected: boolean
}
```

### Events

#### on(event, callback)

Subscribe to spin events.

```typescript
const unsubscribe = on("spin", (data) => {
  // data: { player: 1 | 2, delta: number, position: number }
});

// Later: unsubscribe()
```

#### off(event, callback)

Unsubscribe from spin events.

#### once(event, [filter], [callback])

Listen for a single spin event. Supports filtering by player and both callback and Promise styles.

```typescript
// Promise style
const data = await once("spin");

// Promise with filter
const p1Data = await once("spin", { player: 1 });

// Callback style
const cancel = once("spin", (data) => { /* ... */ });
```

## Development

```bash
bun install
```
