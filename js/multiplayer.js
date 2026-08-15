/**
 * Orlog Multiplayer Client Module
 * Handles WebSocket communication for 1v1 online matches.
 */

export class MultiplayerClient {
  constructor(serverUrl = null) {
    this.serverUrl = serverUrl || (window.location.origin.replace(/^http/, 'ws') + '/ws');
    this.socket = null;
    this.roomCode = null;
    this.playerNum = null;
    this.isConnected = false;
    this.callbacks = {};
  }

  on(event, callback) {
    this.callbacks[event] = callback;
  }

  emit(event, data) {
    if (this.callbacks[event]) {
      this.callbacks[event](data);
    }
  }

  connect(roomCode = null, customUrl = null) {
    return new Promise((resolve, reject) => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const wsUrl = customUrl || `${protocol}//${host}/ws`;

        this.socket = new WebSocket(wsUrl);

        this.socket.onopen = () => {
          this.isConnected = true;
          this.emit('connected', { status: 'ok' });
          if (roomCode) {
            this.joinRoom(roomCode);
          } else {
            this.createRoom();
          }
          resolve(true);
        };

        this.socket.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleServerMessage(message);
          } catch (e) {
            console.error("Malformed WebSocket message:", event.data);
          }
        };

        this.socket.onerror = (err) => {
          console.warn("WebSocket connection error:", err);
          this.isConnected = false;
          this.emit('error', err);
          reject(err);
        };

        this.socket.onclose = () => {
          this.isConnected = false;
          this.emit('disconnected', {});
        };

      } catch (err) {
        reject(err);
      }
    });
  }

  send(action, payload = {}) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ action, roomCode: this.roomCode, playerNum: this.playerNum, ...payload }));
    }
  }

  createRoom() {
    this.send('CREATE_ROOM');
  }

  joinRoom(code) {
    this.roomCode = code;
    this.send('JOIN_ROOM', { roomCode: code });
  }

  sendKeepDie(dieId) {
    this.send('TOGGLE_KEEP', { dieId });
  }

  sendConfirmTurn() {
    this.send('CONFIRM_TURN');
  }

  sendFavorChoice(favorId, tierIndex) {
    this.send('SELECT_FAVOR', { favorId, tierIndex });
  }

  handleServerMessage(msg) {
    switch (msg.action) {
      case 'ROOM_CREATED':
        this.roomCode = msg.roomCode;
        this.playerNum = 1;
        this.emit('roomCreated', { roomCode: msg.roomCode });
        break;

      case 'PLAYER_JOINED':
        if (!this.playerNum) this.playerNum = 2;
        this.emit('playerJoined', { roomCode: msg.roomCode, opponentName: msg.opponentName });
        break;

      case 'GAME_START':
        this.emit('gameStart', msg.gameState);
        break;

      case 'STATE_UPDATE':
        this.emit('stateUpdate', msg.gameState);
        break;

      case 'OPPONENT_DISCONNECTED':
        this.emit('opponentDisconnected', {});
        break;

      case 'ERROR':
        this.emit('serverError', { message: msg.message });
        break;
    }
  }
}
