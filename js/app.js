/**
 * Main Entry Point for Orlog Web Game
 */

import { GameEngine } from './gameEngine.js';
import { OrlogAI } from './ai.js';
import { MultiplayerClient } from './multiplayer.js';
import { OrlogUI } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
  const gameEngine = new GameEngine();
  const ai = new OrlogAI('medium');
  const multiplayer = new MultiplayerClient();
  const ui = new OrlogUI(gameEngine, ai, multiplayer);

  ui.init();
  gameEngine.startNewGame();
  ui.renderAll();

  // Expose global app for debugging if needed
  window.OrlogApp = { gameEngine, ai, multiplayer, ui };
});
