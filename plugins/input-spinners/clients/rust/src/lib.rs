pub mod state;

use rcade_sdk::{channel::PluginChannel, shmem_runner::PluginSharedMemoryRunner};
use wasm_bindgen::JsValue;

use crate::state::SpinnerState;

const CONNECTED: i32 = 0;
// Byte 1 is padding for alignment
const PLAYER1_SPINNER_DELTA: usize = 2;    // i16 (2 bytes)
const PLAYER1_SPINNER_POSITION: usize = 4; // i32 (4 bytes)
const PLAYER2_SPINNER_DELTA: usize = 8;    // i16 (2 bytes)
const PLAYER2_SPINNER_POSITION: usize = 10; // i32 (4 bytes)

pub struct SpinnerController {
    runner: PluginSharedMemoryRunner,
}

impl SpinnerController {
    pub async fn acquire() -> Result<SpinnerController, JsValue> {
        let channel = PluginChannel::acquire("@rcade/input-spinners", "1.0.0").await?;
        let runner = PluginSharedMemoryRunner::spawn(include_str!("./worker.js"), channel, 14)?;

        Ok(SpinnerController { runner })
    }

    pub fn state(&self) -> SpinnerState {
        let data_view = self.runner.lock_blocking().data_view();

        let player1_spinner_delta = read_i16(&data_view, PLAYER1_SPINNER_DELTA);
        let player1_spinner_position = read_i32(&data_view, PLAYER1_SPINNER_POSITION);
        let player2_spinner_delta = read_i16(&data_view, PLAYER2_SPINNER_DELTA);
        let player2_spinner_position = read_i32(&data_view, PLAYER2_SPINNER_POSITION);

        SpinnerState {
            connected: data_view.at(CONNECTED).unwrap() != 0,
            player1_spinner_delta,
            player1_spinner_position,
            player2_spinner_delta,
            player2_spinner_position,
        }
    }
}

fn read_i16(data_view: &js_sys::Uint8Array, offset: usize) -> i16 {
    let low = data_view.at(offset as i32).unwrap_or(0);
    let high = data_view.at((offset + 1) as i32).unwrap_or(0);
    i16::from_le_bytes([low, high])
}

fn read_i32(data_view: &js_sys::Uint8Array, offset: usize) -> i32 {
    let b0 = data_view.at(offset as i32).unwrap_or(0);
    let b1 = data_view.at((offset + 1) as i32).unwrap_or(0);
    let b2 = data_view.at((offset + 2) as i32).unwrap_or(0);
    let b3 = data_view.at((offset + 3) as i32).unwrap_or(0);
    i32::from_le_bytes([b0, b1, b2, b3])
}
