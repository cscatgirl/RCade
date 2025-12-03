#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub struct SpinnerState {
    pub connected: bool,
    pub player1_spinner_delta: i16,
    pub player1_spinner_position: i32,
    pub player2_spinner_delta: i16,
    pub player2_spinner_position: i32,
}
