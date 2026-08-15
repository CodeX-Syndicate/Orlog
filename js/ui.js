/**
 * Orlog Web Application UI Renderer
 * Manages DOM interaction, Viking aesthetic board, dice animations, modals, and combat resolution sequence.
 */

import { FACE_ICONS, FACE_NAMES_FR, GOD_FAVORS } from './constants.js';
import { sounds } from './sound.js';

export class OrlogUI {
  constructor(gameEngine, ai, multiplayer) {
    this.engine = gameEngine;
    this.ai = ai;
    this.multiplayer = multiplayer;
    
    this.isMultiplayer = false;
    this.selectedFavorId = null;
    this.selectedTierIndex = null;
    this.draftFavorsP1 = [...this.engine.p1.favors];
    this.draftFavorsP2 = [...this.engine.p2.favors];
  }

  init() {
    this.bindEvents();
    this.renderAll();
  }

  bindEvents() {
    // Game mode buttons
    document.getElementById('btn-vs-ai')?.addEventListener('click', () => this.startVsAiMode());
    document.getElementById('btn-vs-online')?.addEventListener('click', () => this.showMultiplayerLobby());
    
    // Controls
    document.getElementById('btn-roll')?.addEventListener('click', () => this.handleRollConfirm());
    document.getElementById('btn-confirm-favor')?.addEventListener('click', () => this.handleFavorConfirm());
    document.getElementById('btn-sound')?.addEventListener('click', () => this.toggleSound());
    document.getElementById('btn-new-game')?.addEventListener('click', () => this.showSetupModal());
    document.getElementById('btn-open-draft')?.addEventListener('click', () => this.showDraftModal());

    // Difficulty selector
    document.getElementById('ai-difficulty')?.addEventListener('change', (e) => {
      this.ai.setDifficulty(e.target.value);
      this.engine.addLog(`🤖 Niveau de l'IA changé à : ${e.target.value.toUpperCase()}`, 'system');
    });

    // Game Mode selector (Débutant, Casual, Expert)
    document.getElementById('game-mode-select')?.addEventListener('change', (e) => {
      const newMode = e.target.value;
      this.engine.mode = newMode;
      if (newMode === 'BEGINNER') {
        this.draftFavorsP1 = ['THOR', 'IDUNN', 'ODIN'];
        this.draftFavorsP2 = ['THOR', 'IDUNN', 'ODIN'];
        this.engine.p1.favors = [...this.draftFavorsP1];
        this.engine.p2.favors = [...this.draftFavorsP2];
      }
      this.renderAll();
    });

    // Multiplayer Lobby events
    document.getElementById('btn-create-room')?.addEventListener('click', () => this.createRoom());
    document.getElementById('btn-join-room')?.addEventListener('click', () => this.joinRoom());
  }

  toggleSound() {
    const isMuted = sounds.toggleMute();
    const btn = document.getElementById('btn-sound');
    if (btn) btn.innerHTML = isMuted ? '🔇 Son Off' : '🔊 Son On';
  }

  startVsAiMode() {
    this.isMultiplayer = false;
    this.hideModals();
    this.engine.startNewGame();
    this.renderAll();
    this.checkTurnForAI();
  }

  showSetupModal() {
    document.getElementById('setup-modal')?.classList.remove('hidden');
  }

  hideModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.add('hidden'));
  }

  showDraftModal() {
    this.renderDraftModal();
    document.getElementById('draft-modal')?.classList.remove('hidden');
  }

  showMultiplayerLobby() {
    document.getElementById('mp-modal')?.classList.remove('hidden');
  }

  async createRoom() {
    const statusText = document.getElementById('mp-status');
    const customUrlInput = document.getElementById('server-url-input');
    const customUrl = customUrlInput ? customUrlInput.value.trim() : null;

    if (statusText) statusText.textContent = "Connexion au serveur multijoueur...";
    
    try {
      await this.multiplayer.connect(null, customUrl || null);
      this.isMultiplayer = true;
      statusText.textContent = `Salon créé ! Code du salon : ${this.multiplayer.roomCode}. En attente du second joueur...`;
    } catch (e) {
      if (statusText) statusText.textContent = "❌ Impossible de se connecter au serveur multijoueur. Vérifiez l'URL du serveur ou server.py.";
    }
  }

  async joinRoom() {
    const codeInput = document.getElementById('room-code-input');
    const code = codeInput ? codeInput.value.trim().toUpperCase() : '';
    const customUrlInput = document.getElementById('server-url-input');
    const customUrl = customUrlInput ? customUrlInput.value.trim() : null;
    const statusText = document.getElementById('mp-status');

    if (!code) {
      if (statusText) statusText.textContent = "Veuillez entrer un code de salon valide.";
      return;
    }

    try {
      await this.multiplayer.connect(code, customUrl || null);
      this.isMultiplayer = true;
      if (statusText) statusText.textContent = `Rejoint le salon ${code} ! Démarrage du jeu...`;
      this.hideModals();
      this.engine.startNewGame();
      this.renderAll();
    } catch (e) {
      if (statusText) statusText.textContent = `❌ Salon ${code} introuvable ou erreur de réseau.`;
    }
  }

  handleRollConfirm() {
    sounds.playDiceSelect();

    if (this.engine.phase === 'ROLL') {
      if (!this.isMultiplayer) {
        this.engine.confirmRollTurn(this.engine.currentPlayer);
        this.renderAll();
        this.checkTurnForAI();
      } else {
        this.multiplayer.sendConfirmTurn();
      }
    }
  }

  handleFavorConfirm() {
    sounds.playGodFavor();

    if (!this.isMultiplayer) {
      this.engine.selectFavor(1, this.selectedFavorId, this.selectedTierIndex);
      
      // AI selects favor
      this.ai.decideFavor(this.engine, 2);

      // Execute Resolution!
      this.triggerResolutionSequence();
    } else {
      this.multiplayer.sendFavorChoice(this.selectedFavorId, this.selectedTierIndex);
    }
  }

  checkTurnForAI() {
    if (this.isMultiplayer || this.engine.phase === 'GAME_OVER') return;

    if (this.engine.phase === 'ROLL' && this.engine.currentPlayer === 2) {
      setTimeout(() => {
        this.ai.decideDiceToKeep(this.engine, 2);
        sounds.playDiceRoll();
        this.engine.confirmRollTurn(2);
        this.renderAll();

        // Check if next turn is also AI or roll phase advanced
        if (this.engine.phase === 'ROLL' && this.engine.currentPlayer === 2) {
          this.checkTurnForAI();
        }
      }, 750);
    }
  }

  async triggerResolutionSequence() {
    this.engine.resolveRound();
    this.renderAll();

    // Show step-by-step resolution overlay
    const overlay = document.getElementById('resolution-overlay');
    const content = document.getElementById('resolution-content');
    if (!overlay || !content) return;

    overlay.classList.remove('hidden');

    for (const step of this.engine.resolutionSteps) {
      content.innerHTML = `
        <div class="step-card fade-in">
          <h2>${step.title}</h2>
          <ul>
            ${step.details.map(d => `<li>${d}</li>`).join('')}
          </ul>
        </div>
      `;

      if (step.step === 'GOLD_DICE') sounds.playDiceSelect();
      else if (step.step === 'STEAL') sounds.playDiceSelect();
      else if (step.step === 'RANGED') sounds.playArrowHit();
      else if (step.step === 'MELEE') sounds.playAxeHit();
      else if (step.step.includes('FAVOR')) sounds.playGodFavor();

      await new Promise(r => setTimeout(r, 1800));
    }

    overlay.classList.add('hidden');

    if (this.engine.phase === 'GAME_OVER') {
      sounds.playVictory();
      this.showGameOverModal();
    } else {
      this.engine.startRound();
      this.renderAll();
      this.checkTurnForAI();
    }
  }

  showGameOverModal() {
    const modal = document.getElementById('game-over-modal');
    const title = document.getElementById('winner-title');
    const desc = document.getElementById('winner-desc');

    if (modal && title && desc) {
      if (this.engine.winner === 'DRAW') {
        title.textContent = "🤝 Égalité !";
        desc.textContent = "Les deux guerriers ont sombré ensemble dans la bataille.";
      } else {
        const winner = this.engine.getPlayer(this.engine.winner);
        title.textContent = `🏆 VICTOIRE DE ${winner.name.toUpperCase()} !`;
        desc.textContent = `${winner.name} a terrassé son adversaire et règne en maître sur la table d'Orlog !`;
      }
      modal.classList.remove('hidden');
    }
  }

  renderAll() {
    this.renderHeader();
    this.renderDice();
    this.renderFavorPanel();
    this.renderControls();
    this.renderLog();
  }

  renderHeader() {
    // Health & Tokens
    const p1HpEl = document.getElementById('p1-hp-val');
    const p2HpEl = document.getElementById('p2-hp-val');
    const p1TokensEl = document.getElementById('p1-tokens-val');
    const p2TokensEl = document.getElementById('p2-tokens-val');

    if (p1HpEl) p1HpEl.textContent = this.engine.p1.hp;
    if (p2HpEl) p2HpEl.textContent = this.engine.p2.hp;
    if (p1TokensEl) p1TokensEl.textContent = this.engine.p1.powerTokens;
    if (p2TokensEl) p2TokensEl.textContent = this.engine.p2.powerTokens;

    // HP Visual Stones
    this.renderHpStones('p1-hp-stones', this.engine.p1.hp, this.engine.maxHp);
    this.renderHpStones('p2-hp-stones', this.engine.p2.hp, this.engine.maxHp);

    // Phase Banner
    const phaseBanner = document.getElementById('phase-banner');
    if (phaseBanner) {
      if (this.engine.phase === 'ROLL') {
        const activeName = this.engine.getPlayer(this.engine.currentPlayer).name;
        phaseBanner.innerHTML = ` Phase 1: Lancer de dés - Tour ${this.engine.rollTurn}/3 (${activeName})`;
      } else if (this.engine.phase === 'FAVOR') {
        phaseBanner.innerHTML = `✨ Phase 2: Invoquer une Faveur Divine`;
      } else if (this.engine.phase === 'RESOLUTION') {
        phaseBanner.innerHTML = ` Phase 3: Résolution des dés & faveurs`;
      } else if (this.engine.phase === 'GAME_OVER') {
        phaseBanner.innerHTML = `🏆 Fin de la Partie`;
      }
    }
  }

  renderHpStones(containerId, currentHp, maxHp) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < maxHp; i++) {
      const stone = document.createElement('div');
      stone.className = `hp-stone ${i < currentHp ? 'active' : 'lost'}`;
      container.appendChild(stone);
    }
  }

  renderDice() {
    this.renderPlayerBowl('p1-bowl', this.engine.p1, 1);
    this.renderPlayerBowl('p2-bowl', this.engine.p2, 2);
  }

  renderPlayerBowl(containerId, player, playerNum) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    player.dice.forEach(die => {
      const dieEl = document.createElement('div');
      dieEl.className = `die-card ${die.isGold ? 'gold-border' : ''} ${die.kept ? 'kept' : ''}`;

      const icon = FACE_ICONS[die.face] || '❓';
      const name = FACE_NAMES_FR[die.face] || die.face;

      dieEl.innerHTML = `
        <div class="die-icon">${icon}</div>
        <div class="die-label">${name}</div>
        ${die.isGold ? '<div class="gold-ring">🌟</div>' : ''}
        ${die.kept ? '<div class="kept-badge">🔒 Gardé</div>' : ''}
      `;

      // Click to toggle keep (only P1 during P1 roll turn)
      if (this.engine.phase === 'ROLL' && this.engine.currentPlayer === playerNum && playerNum === 1 && this.engine.rollTurn < 3) {
        dieEl.classList.add('clickable');
        dieEl.addEventListener('click', () => {
          sounds.playDiceSelect();
          this.engine.toggleKeepDie(1, die.id);
          this.renderAll();
        });
      }

      container.appendChild(dieEl);
    });
  }

  renderFavorPanel() {
    const container = document.getElementById('favor-cards-container');
    if (!container) return;

    container.innerHTML = '';

    this.engine.p1.favors.forEach(favorId => {
      const favor = GOD_FAVORS[favorId];
      if (!favor) return;

      const card = document.createElement('div');
      card.className = `favor-card ${this.selectedFavorId === favorId ? 'selected' : ''}`;
      
      let tiersHtml = favor.tiers.map((tier, idx) => `
        <button class="tier-btn ${this.selectedFavorId === favorId && this.selectedTierIndex === idx ? 'active' : ''} ${this.engine.p1.powerTokens < tier.cost ? 'disabled' : ''}" 
                data-favor="${favorId}" data-tier="${idx}">
          ${tier.text}
        </button>
      `).join('');

      card.innerHTML = `
        <div class="favor-name">⚡ ${favor.name}</div>
        <div class="favor-god">Dieu: ${favor.god}</div>
        <div class="favor-desc">${favor.description}</div>
        <div class="favor-tiers">${tiersHtml}</div>
      `;

      card.querySelectorAll('.tier-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const fId = btn.getAttribute('data-favor');
          const tIdx = parseInt(btn.getAttribute('data-tier'), 10);
          
          if (this.selectedFavorId === fId && this.selectedTierIndex === tIdx) {
            this.selectedFavorId = null;
            this.selectedTierIndex = null;
          } else {
            this.selectedFavorId = fId;
            this.selectedTierIndex = tIdx;
          }
          this.renderFavorPanel();
        });
      });

      container.appendChild(card);
    });
  }

  renderControls() {
    const btnRoll = document.getElementById('btn-roll');
    const btnFavor = document.getElementById('btn-confirm-favor');

    if (btnRoll) {
      if (this.engine.phase === 'ROLL' && this.engine.currentPlayer === 1) {
        btnRoll.removeAttribute('disabled');
        btnRoll.textContent = this.engine.rollTurn === 3 ? '🔒 Valider les dés (Fin Lancer)' : '🎲 Valider & Relancer les dés';
      } else {
        btnRoll.setAttribute('disabled', 'true');
        btnRoll.textContent = 'En attente...';
      }
    }

    if (btnFavor) {
      if (this.engine.phase === 'FAVOR') {
        btnFavor.removeAttribute('disabled');
      } else {
        btnFavor.setAttribute('disabled', 'true');
      }
    }
  }

  renderLog() {
    const container = document.getElementById('combat-log-content');
    if (!container) return;

    container.innerHTML = this.engine.log.map(item => `
      <div class="log-entry log-${item.type}">
        <span class="log-time">[${item.timestamp}]</span> ${item.message}
      </div>
    `).join('');

    container.scrollTop = container.scrollHeight;
  }

  renderDraftModal() {
    const container = document.getElementById('draft-favors-list');
    if (!container) return;

    container.innerHTML = '';
    const allFavorIds = Object.keys(GOD_FAVORS);

    allFavorIds.forEach(id => {
      const favor = GOD_FAVORS[id];
      const isSelected = this.draftFavorsP1.includes(id);

      const card = document.createElement('div');
      card.className = `draft-card ${isSelected ? 'selected' : ''}`;
      card.innerHTML = `
        <h3>⚡ ${favor.name}</h3>
        <p><strong>Dieu:</strong> ${favor.god}</p>
        <p>${favor.description}</p>
        <button class="btn-draft-pick">${isSelected ? 'Retirer' : 'Sélectionner'}</button>
      `;

      card.querySelector('.btn-draft-pick')?.addEventListener('click', () => {
        if (isSelected) {
          this.draftFavorsP1 = this.draftFavorsP1.filter(f => f !== id);
        } else {
          if (this.draftFavorsP1.length >= 3) {
            alert("Vous pouvez sélectionner 3 Faveurs Divines maximum !");
            return;
          }
          this.draftFavorsP1.push(id);
        }
        this.engine.p1.favors = [...this.draftFavorsP1];
        this.renderDraftModal();
        this.renderFavorPanel();
      });

      container.appendChild(card);
    });
  }
}
