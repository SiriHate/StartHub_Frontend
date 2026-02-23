import { Client } from '@stomp/stompjs';
import config from '../config';
import { getCookie } from './apiClient';

const RECONNECT_DELAY_MS = 7000;
const HEARTBEAT_MS = 10000;

class ChatWsClient {
    constructor() {
        this._client = null;
        this._chatId = null;
        this._onMessage = null;
        this._onHistory = null;
        this._onConnectionChange = null;
    }

    get connected() {
        return this._client?.connected ?? false;
    }

    connect(chatId, { onMessage, onHistory, onConnectionChange, initialPageSize = 20 }) {
        this.disconnect();

        this._chatId = chatId;
        this._onMessage = onMessage;
        this._onHistory = onHistory;
        this._onConnectionChange = onConnectionChange;

        const token = getCookie('accessToken');

        this._client = new Client({
            brokerURL: `${config.WS_URL}?token=${token}`,
            debug: () => {},
            reconnectDelay: RECONNECT_DELAY_MS,
            heartbeatIncoming: HEARTBEAT_MS,
            heartbeatOutgoing: HEARTBEAT_MS,

            onConnect: () => {
                this._onConnectionChange?.(true);

                this._client.subscribe(`/topic/chat/${chatId}`, (frame) => {
                    try {
                        this._onMessage?.(JSON.parse(frame.body));
                    } catch (_) {}
                });

                this._client.subscribe(`/topic/chat/${chatId}/history`, (frame) => {
                    try {
                        const raw = JSON.parse(frame.body);
                        const list = Array.isArray(raw) ? raw : (raw?.content ?? []);
                        this._onHistory?.(list);
                    } catch (_) {}
                });

                this._publish('/app/chat/subscribe', {
                    chatId,
                    page: 0,
                    size: initialPageSize,
                });
            },

            onStompError: () => this._onConnectionChange?.(false),
            onWebSocketClose: () => this._onConnectionChange?.(false),
            onDisconnect: () => this._onConnectionChange?.(false),
        });

        this._client.activate();
    }

    disconnect() {
        this._onConnectionChange?.(false);
        if (this._client) {
            this._client.deactivate();
            this._client = null;
        }
        this._chatId = null;
        this._onMessage = null;
        this._onHistory = null;
        this._onConnectionChange = null;
    }

    sendMessage(chatId, messageRequest) {
        this._publish(`/app/chat/${chatId}/send`, messageRequest);
    }

    requestHistory(chatId, page, size) {
        this._publish('/app/chat/subscribe', { chatId, page, size });
    }

    _publish(destination, body) {
        if (!this._client?.connected) return;
        try {
            this._client.publish({
                destination,
                body: JSON.stringify(body),
            });
        } catch (_) {}
    }
}

const chatWsClient = new ChatWsClient();
export default chatWsClient;
