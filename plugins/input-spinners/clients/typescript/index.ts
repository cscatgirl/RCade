import { PluginChannel } from "@rcade/sdk";

export const PLAYER_1 = {
    SPINNER: { delta: 0, position: 0 }
};

export const PLAYER_2 = {
    SPINNER: { delta: 0, position: 0 },
};

export const STATUS = { connected: false };

type SpinEventData = {
    player: 1 | 2;
    delta: number;
    position: number;
};
type EventCallback = (data: SpinEventData) => void;

const spinListeners: EventCallback[] = [];

export function on(event: "spin", callback: EventCallback): () => void {
    spinListeners.push(callback);
    return () => {
        const idx = spinListeners.indexOf(callback);
        if (idx !== -1) spinListeners.splice(idx, 1);
    };
}

export function off(event: "spin", callback: EventCallback): void {
    const idx = spinListeners.indexOf(callback);
    if (idx !== -1) spinListeners.splice(idx, 1);
}

type OnceFilter = {
    player?: 1 | 2;
};

export function once(event: "spin", callback: EventCallback): () => void;
export function once(event: "spin", filter: OnceFilter, callback: EventCallback): () => void;
export function once(event: "spin"): Promise<SpinEventData>;
export function once(event: "spin", filter: OnceFilter): Promise<SpinEventData>;

export function once(
    event: "spin",
    filterOrCallback?: OnceFilter | EventCallback,
    maybeCallback?: EventCallback
): (() => void) | Promise<SpinEventData> {
    let filter: OnceFilter | undefined;
    let callback: EventCallback | undefined;

    if (typeof filterOrCallback === "function") {
        callback = filterOrCallback;
    } else if (filterOrCallback) {
        filter = filterOrCallback;
        callback = maybeCallback;
    }

    if (!callback) {
        return new Promise((resolve) => {
            const handler: EventCallback = (data) => {
                if (filter) {
                    if (!filter.player || data.player === filter.player) {
                        off("spin", handler);
                        resolve(data);
                    }
                } else {
                    off("spin", handler);
                    resolve(data);
                }
            };
            on("spin", handler);
        });
    }

    const handler: EventCallback = (data) => {
        if (filter) {
            if (!filter.player || data.player === filter.player) {
                off("spin", handler);
                callback(data);
            }
        } else {
            off("spin", handler);
            callback(data);
        }
    };

    on("spin", handler);
    return () => off("spin", handler);
}

function emit(data: SpinEventData) {
    spinListeners.forEach(cb => cb(data));
}

(async () => {
    const channel = await PluginChannel.acquire("@rcade/input-spinners", "^1.0.0");

    STATUS.connected = true;

    type InputMessage = { type: "spinners"; spinner1: number; spinner2: number };

    channel.getPort().onmessage = (event: MessageEvent<InputMessage>) => {
        const { type } = event.data;

        if (type === "spinners") {
            const { spinner1, spinner2 } = event.data;

            if (spinner1 !== 0) {
                PLAYER_1.SPINNER.delta = spinner1;
                PLAYER_1.SPINNER.position += spinner1;
                emit({ player: 1, delta: spinner1, position: PLAYER_1.SPINNER.position });
            }

            if (spinner2 !== 0) {
                PLAYER_2.SPINNER.delta = spinner2;
                PLAYER_2.SPINNER.position += spinner2;
                emit({ player: 2, delta: spinner2, position: PLAYER_2.SPINNER.position });
            }
        }
    };
})()

if (import.meta.hot) {
    import.meta.hot.accept(() => {
        (import.meta.hot as any).invalidate();
    });
}
