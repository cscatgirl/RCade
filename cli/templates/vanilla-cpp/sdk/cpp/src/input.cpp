#include "input.h"
#include <emscripten/bind.h>

namespace rcade {

// Global instance for C callback bridge
Input* g_inputInstance = nullptr;

// C-style callback for Emscripten bindings
extern "C" {
    EMSCRIPTEN_KEEPALIVE
    void rcade_update_input(
        int p1_up, int p1_down, int p1_left, int p1_right,
        int p1_a, int p1_b, int p1_c, int p1_d, int p1_e, int p1_f,
        int p2_up, int p2_down, int p2_left, int p2_right,
        int p2_a, int p2_b, int p2_c, int p2_d, int p2_e, int p2_f,
        int sys_pause, int sys_settings
    ) {
        if (!g_inputInstance) return;

        PlayerInput p1, p2;
        SystemInput sys;

        p1.UP = p1_up;
        p1.DOWN = p1_down;
        p1.LEFT = p1_left;
        p1.RIGHT = p1_right;
        p1.A = p1_a;
        p1.B = p1_b;
        p1.C = p1_c;
        p1.D = p1_d;
        p1.E = p1_e;
        p1.F = p1_f;

        p2.UP = p2_up;
        p2.DOWN = p2_down;
        p2.LEFT = p2_left;
        p2.RIGHT = p2_right;
        p2.A = p2_a;
        p2.B = p2_b;
        p2.C = p2_c;
        p2.D = p2_d;
        p2.E = p2_e;
        p2.F = p2_f;

        sys.PAUSE = sys_pause;
        sys.SETTINGS = sys_settings;

        g_inputInstance->updateState(p1, p2, sys);
    }
}

Input::Input(bool keyboardFallback)
    : keyboardFallback_(keyboardFallback) {
    g_inputInstance = this;
    setupPlugin();
}

void Input::setupPlugin() {
    EM_ASM({
        // Setup input handling with RCade input-classic plugin
        (async function() {
            try {
                const { PluginChannel } = await import('/build/main.js');
                const channel = await PluginChannel.acquire('@rcade/input-classic', '1.0.0');

                channel.port.onmessage = (event) => {
                    const { PLAYER_1, PLAYER_2, SYSTEM } = event.data;

                    Module.rcade_update_input(
                        PLAYER_1.UP ? 1 : 0,
                        PLAYER_1.DOWN ? 1 : 0,
                        PLAYER_1.LEFT ? 1 : 0,
                        PLAYER_1.RIGHT ? 1 : 0,
                        PLAYER_1.A ? 1 : 0,
                        PLAYER_1.B ? 1 : 0,
                        PLAYER_1.C ? 1 : 0,
                        PLAYER_1.D ? 1 : 0,
                        PLAYER_1.E ? 1 : 0,
                        PLAYER_1.F ? 1 : 0,

                        PLAYER_2.UP ? 1 : 0,
                        PLAYER_2.DOWN ? 1 : 0,
                        PLAYER_2.LEFT ? 1 : 0,
                        PLAYER_2.RIGHT ? 1 : 0,
                        PLAYER_2.A ? 1 : 0,
                        PLAYER_2.B ? 1 : 0,
                        PLAYER_2.C ? 1 : 0,
                        PLAYER_2.D ? 1 : 0,
                        PLAYER_2.E ? 1 : 0,
                        PLAYER_2.F ? 1 : 0,

                        SYSTEM.PAUSE ? 1 : 0,
                        SYSTEM.SETTINGS ? 1 : 0
                    );
                };
            } catch (e) {
                if ($0) {
                    console.warn('Plugin not available, using keyboard fallback');
                } else {
                    console.error('Failed to connect to input plugin:', e);
                }
            }
        })();
    }, keyboardFallback_ ? 1 : 0);

    if (keyboardFallback_) {
        setupKeyboardFallback();
    }
}

void Input::setupKeyboardFallback() {
    EM_ASM({
        if (window.rcadeKeyboardSetup) return;
        window.rcadeKeyboardSetup = true;

        const keys = {};

        const updateInput = () => {
            Module.rcade_update_input(
                // Player 1: WASD + IJKL for buttons
                keys['w'] || keys['W'] ? 1 : 0,         // UP
                keys['s'] || keys['S'] ? 1 : 0,         // DOWN
                keys['a'] || keys['A'] ? 1 : 0,         // LEFT
                keys['d'] || keys['D'] ? 1 : 0,         // RIGHT
                keys['i'] || keys['I'] ? 1 : 0,         // A
                keys['j'] || keys['J'] ? 1 : 0,         // B
                keys['k'] || keys['K'] ? 1 : 0,         // C
                keys['l'] || keys['L'] ? 1 : 0,         // D
                0, 0,                                     // E, F

                // Player 2: Arrow keys + numpad for buttons
                keys['ArrowUp'] ? 1 : 0,                 // UP
                keys['ArrowDown'] ? 1 : 0,               // DOWN
                keys['ArrowLeft'] ? 1 : 0,               // LEFT
                keys['ArrowRight'] ? 1 : 0,              // RIGHT
                keys['4'] ? 1 : 0,                       // A (numpad 4)
                keys['5'] ? 1 : 0,                       // B (numpad 5)
                keys['6'] ? 1 : 0,                       // C (numpad 6)
                keys['1'] ? 1 : 0,                       // D (numpad 1)
                0, 0,                                     // E, F

                // System buttons
                keys['Escape'] ? 1 : 0,                  // PAUSE
                keys['Enter'] ? 1 : 0                    // SETTINGS
            );
        };

        window.addEventListener('keydown', (e) => {
            keys[e.key] = true;
            updateInput();
        });

        window.addEventListener('keyup', (e) => {
            keys[e.key] = false;
            updateInput();
        });
    });
}

void Input::updateState(const PlayerInput& p1, const PlayerInput& p2, const SystemInput& sys) {
    player1_ = p1;
    player2_ = p2;
    system_ = sys;

    if (inputCallback_) {
        inputCallback_();
    }
}

bool Input::anyButtonPressed() const {
    return player1_.UP || player1_.DOWN || player1_.LEFT || player1_.RIGHT ||
           player1_.A || player1_.B || player1_.C || player1_.D ||
           player1_.E || player1_.F ||
           player2_.UP || player2_.DOWN || player2_.LEFT || player2_.RIGHT ||
           player2_.A || player2_.B || player2_.C || player2_.D ||
           player2_.E || player2_.F ||
           system_.PAUSE || system_.SETTINGS;
}


EMSCRIPTEN_BINDINGS(rcade_input) {
    emscripten::function("rcade_update_input", &rcade_update_input);
}

} // namespace rcade
