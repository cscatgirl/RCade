# RCade C++ SDK

## Quick Start

### Basic Example

```cpp
#include <rcade/rcade.h>
#include <emscripten.h>

rcade::Canvas* canvas;
rcade::Input* input;

void gameLoop() {
    // Clear screen
    canvas->clear("#1a1a2e");

    // Get input state
    const auto& p1 = input->getPlayer1();
    const auto& p2 = input->getPlayer2();

    // Draw based on input
    if (p1.UP) {
        canvas->fillRect(100, 100, 50, 50, "#ff0000");
    }

    // Draw text
    canvas->fillText("Hello RCade!", 168, 131, "24px monospace", "#fff", "center");
}

int main() {
    canvas = new rcade::Canvas(336, 262);
    input = new rcade::Input();

    emscripten_set_main_loop(gameLoop, 60, 1);
    return 0;
}
```

### Building

Add to your `Makefile`:

```makefile
EMCC = emcc
SRC = src/main.cpp sdk/cpp/src/canvas.cpp sdk/cpp/src/input.cpp
OUTPUT = build/main.js

EMCC_FLAGS = -s WASM=1 \
             -s EXPORTED_RUNTIME_METHODS='["cwrap","ccall"]' \
             -s MODULARIZE=1 \
             -s EXPORT_NAME='createModule' \
             -s ALLOW_MEMORY_GROWTH=1 \
             -Isdk/cpp/include \
             --bind

build:
	$(EMCC) $(SRC) $(EMCC_FLAGS) -O3 -o $(OUTPUT)
```

Then run:
```bash
make build
```

## API Reference

### Canvas Class

#### Constructor
```cpp
rcade::Canvas(int width = 336, int height = 262, const char* canvasId = "gameCanvas")
```
Creates a canvas element and initializes the 2D rendering context.

#### Methods

**Basic Drawing**
- `void clear(const char* color = "#1a1a2e")` - Clear canvas with color
- `void fillRect(float x, float y, float w, float h, const char* color = "#eee")` - Draw filled rectangle
- `void strokeRect(float x, float y, float w, float h, const char* color = "#eee")` - Draw rectangle outline

**Text**
- `void fillText(const char* text, float x, float y, const char* font = "16px monospace", const char* color = "#eee", const char* align = "left")` - Draw text

**Paths**
- `void beginPath()` - Begin new path
- `void moveTo(float x, float y)` - Move to point
- `void lineTo(float x, float y)` - Draw line to point
- `void stroke(const char* color = "#eee", float lineWidth = 1.0f)` - Stroke current path
- `void setLineDash(float dash, float gap)` - Set dashed line pattern
- `void clearLineDash()` - Reset to solid line

**Getters**
- `int getWidth()` - Get canvas width
- `int getHeight()` - Get canvas height

### Input Class

#### Constructor
```cpp
rcade::Input(bool keyboardFallback = true)
```
Initializes input system and connects to RCade plugin (or keyboard fallback).

#### Methods

**Input State**
- `const PlayerInput& getPlayer1()` - Get player 1 input state
- `const PlayerInput& getPlayer2()` - Get player 2 input state
- `const SystemInput& getSystem()` - Get system button state
- `bool anyButtonPressed()` - Check if any button is pressed

**Callbacks**
- `void setInputCallback(std::function<void()> callback)` - Set callback for input changes

#### Structs

**PlayerInput**
```cpp
struct PlayerInput {
    bool UP, DOWN, LEFT, RIGHT;
    bool A, B, C, D, E, F;
};
```

**SystemInput**
```cpp
struct SystemInput {
    bool PAUSE;
    bool SETTINGS;
};
```

### Keyboard Fallback

When the RCade plugin is unavailable (local development), keyboard controls are:

**Player 1:**
- Movement: W/A/S/D
- Buttons: I/J/K/L (A/B/C/D)

**Player 2:**
- Movement: Arrow Keys
- Buttons: 4/5/6/1 (A/B/C/D)

**System:**
- Pause: Escape
- Settings: Enter

## Advanced Examples

### Pong Game (Simplified)

```cpp
#include <rcade/rcade.h>
#include <emscripten.h>

const float PADDLE_SPEED = 3.0f;
float paddle1Y = 111, paddle2Y = 111;

rcade::Canvas* canvas;
rcade::Input* input;
bool gameStarted = false;

void gameLoop() {
    const auto& p1 = input->getPlayer1();
    const auto& p2 = input->getPlayer2();

    // Start on any input
    if (!gameStarted && input->anyButtonPressed()) {
        gameStarted = true;
    }

    if (gameStarted) {
        // Update paddles
        if (p1.UP && paddle1Y > 0) paddle1Y -= PADDLE_SPEED;
        if (p1.DOWN && paddle1Y < 222) paddle1Y += PADDLE_SPEED;
        if (p2.UP && paddle2Y > 0) paddle2Y -= PADDLE_SPEED;
        if (p2.DOWN && paddle2Y < 222) paddle2Y += PADDLE_SPEED;
    }

    // Render
    canvas->clear("#1a1a2e");

    // Center line
    canvas->setLineDash(5, 5);
    canvas->beginPath();
    canvas->moveTo(168, 0);
    canvas->lineTo(168, 262);
    canvas->stroke("#444");
    canvas->clearLineDash();

    // Paddles
    canvas->fillRect(0, paddle1Y, 8, 40);
    canvas->fillRect(328, paddle2Y, 8, 40);

    if (!gameStarted) {
        canvas->fillText("Press any button", 168, 131, "16px monospace", "#eee", "center");
    }
}

int main() {
    canvas = new rcade::Canvas(336, 262);
    input = new rcade::Input();
    emscripten_set_main_loop(gameLoop, 60, 1);
    return 0;
}
```

### Custom Drawing

```cpp
void drawCircle(rcade::Canvas& canvas, float x, float y, float radius) {
    // Approximate circle with line segments
    const int segments = 32;
    const float angleStep = 6.28318f / segments; // 2*PI

    canvas.beginPath();
    for (int i = 0; i <= segments; i++) {
        float angle = i * angleStep;
        float px = x + radius * cos(angle);
        float py = y + radius * sin(angle);

        if (i == 0) {
            canvas.moveTo(px, py);
        } else {
            canvas.lineTo(px, py);
        }
    }
    canvas.stroke("#fff", 2.0f);
}

void gameLoop() {
    canvas->clear("#000");
    drawCircle(*canvas, 168, 131, 50);
}
```

### Input Callbacks

```cpp
rcade::Input* input;
bool jumpPressed = false;

void onInputChange() {
    const auto& p1 = input->getPlayer1();

    // Detect button press (not held)
    if (p1.A && !jumpPressed) {
        jumpPressed = true;
        // Trigger jump
    } else if (!p1.A) {
        jumpPressed = false;
    }
}

int main() {
    input = new rcade::Input();
    input->setInputCallback(onInputChange);

    // ...
}
```

## Architecture

The SDK provides a thin wrapper around Emscripten's JavaScript interop:

1. **Canvas**: Uses `EM_ASM` to call HTML5 Canvas API methods
2. **Input**: Connects to RCade's MessagePort-based plugin system
3. **Keyboard Fallback**: Automatically sets up keyboard listeners when plugin unavailable

## License

MIT License - see repository root for details
