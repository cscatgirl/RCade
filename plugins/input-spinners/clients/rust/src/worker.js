/**
 * layout:
 * - 00 | Connected (1 byte)
 * - 01 | padding (1 byte, for alignment)
 * - 02-03 | spinner1 delta (i16, 2 bytes)
 * - 04-07 | spinner1 position (i32, 4 bytes)
 * - 08-09 | spinner2 delta (i16, 2 bytes)
 * - 10-13 | spinner2 position (i32, 4 bytes)
 */

const CONNECTED = 0;
const PLAYER1_SPINNER_DELTA = 2;
const PLAYER1_SPINNER_POSITION = 4;
const PLAYER2_SPINNER_DELTA = 8;
const PLAYER2_SPINNER_POSITION = 10;

function write(offset, value) {
    const cur_lock = lock();
    cur_lock.getDataView()[offset] = value ? 1 : 0;
    cur_lock.release();
}

function writeI16(offset, value) {
    const cur_lock = lock();
    const view = new DataView(cur_lock.getDataView().buffer, cur_lock.getDataView().byteOffset);
    view.setInt16(offset, value, true);
    cur_lock.release();
}

function writeI32(offset, value) {
    const cur_lock = lock();
    const view = new DataView(cur_lock.getDataView().buffer, cur_lock.getDataView().byteOffset);
    view.setInt32(offset, value, true);
    cur_lock.release();
}

function readI32(offset) {
    const cur_lock = lock();
    const view = new DataView(cur_lock.getDataView().buffer, cur_lock.getDataView().byteOffset);
    const value = view.getInt32(offset, true);
    cur_lock.release();
    return value;
}

function handleMessage(data) {
    const { type } = data;

    if (type === "spinners") {
        const { spinner1, spinner2 } = data;

        if (spinner1 !== 0) {
            writeI16(PLAYER1_SPINNER_DELTA, spinner1);
            const currentPos = readI32(PLAYER1_SPINNER_POSITION);
            writeI32(PLAYER1_SPINNER_POSITION, currentPos + spinner1);
        }

        if (spinner2 !== 0) {
            writeI16(PLAYER2_SPINNER_DELTA, spinner2);
            const currentPos = readI32(PLAYER2_SPINNER_POSITION);
            writeI32(PLAYER2_SPINNER_POSITION, currentPos + spinner2);
        }
    }
}

function init() {
    write(CONNECTED, true);
}
