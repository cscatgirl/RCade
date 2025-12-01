#ifndef RCADE_INPUT_H
#define RCADE_INPUT_H

#include <emscripten.h>
#include <functional>

namespace rcade {

/**
 * Button state for a single player
 */
struct PlayerInput {
    bool UP = false;
    bool DOWN = false;
    bool LEFT = false;
    bool RIGHT = false;
    bool A = false;
    bool B = false;
    bool C = false;
    bool D = false;
    bool E = false;
    bool F = false;
};

/**
 * System button state
 */
struct SystemInput {
    bool PAUSE = false;
    bool SETTINGS = false;
};

/**
 * RCadeInput - Manages input from the RCade input-classic plugin
 *
 * This class handles connection to the RCade input plugin and provides
 * a fallback to keyboard input for local development. It automatically
 * sets up the plugin channel and manages input state.
 */
class Input {
public:
    /**
     * Creates and initializes the input system
     *
     * This will attempt to connect to the RCade input-classic plugin.
     * If the plugin is not available (e.g., during local development),
     * it will automatically fall back to keyboard controls.
     *
     * @param keyboardFallback Enable keyboard fallback (default: true)
     */
    Input(bool keyboardFallback = true);

    /**
     * Get player 1 input state
     */
    const PlayerInput& getPlayer1() const { return player1_; }

    /**
     * Get player 2 input state
     */
    const PlayerInput& getPlayer2() const { return player2_; }

    /**
     * Get system input state
     */
    const SystemInput& getSystem() const { return system_; }

    /**
     * Check if any button is pressed (useful for "press any button" prompts)
     */
    bool anyButtonPressed() const;

    /**
     * Update input state (called internally via JavaScript callback)
     * Do not call this manually unless you're implementing custom input handling
     */
    void updateState(const PlayerInput& p1, const PlayerInput& p2, const SystemInput& sys);

    /**
     * Set a callback to be called whenever input state changes
     *
     * @param callback Function to call on input change
     */
    void setInputCallback(std::function<void()> callback) {
        inputCallback_ = callback;
    }

private:
    PlayerInput player1_;
    PlayerInput player2_;
    SystemInput system_;
    bool keyboardFallback_;
    std::function<void()> inputCallback_;

    void setupPlugin();
    void setupKeyboardFallback();
};

// Global input instance pointer (for C callback bridge)
extern Input* g_inputInstance;

} // namespace rcade

#endif // RCADE_INPUT_H
