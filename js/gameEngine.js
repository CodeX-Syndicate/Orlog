/**
 * Orlog Core Game Engine
 * Fully independent engine supporting single-player VS Bot and multiplayer synchronization.
 */

import { DIE_FACES, STANDARD_DIE_FACES, GOD_FAVORS, DEFAULT_BEGINNER_FAVORS } from './constants.js';

export class GameEngine {
  constructor(options = {}) {
    this.mode = options.mode || 'BEGINNER'; // 'BEGINNER', 'CASUAL', 'EXPERT'
    this.maxHp = options.maxHp || 15;
    this.player1Name = options.player1Name || 'Joueur 1';
    this.player2Name = options.player2Name || 'Bot';
    
    // Player 1 & Player 2 State
    this.p1 = this.createPlayerState(this.player1Name, options.p1Favors || DEFAULT_BEGINNER_FAVORS);
    this.p2 = this.createPlayerState(this.player2Name, options.p2Favors || DEFAULT_BEGINNER_FAVORS);

    this.round = 1;
    this.startingPlayer = 1; // 1 or 2
    this.currentPlayer = 1;  // 1 or 2
    this.rollTurn = 1;       // 1, 2, 3
    this.phase = 'INIT';     // 'INIT', 'DRAFT', 'ROLL', 'FAVOR', 'RESOLUTION', 'GAME_OVER'

    this.winner = null;
    this.resolutionSteps = [];
    this.log = [];
  }

  createPlayerState(name, favorIds) {
    return {
      name,
      hp: this.maxHp,
      powerTokens: 0,
      favors: favorIds || [...DEFAULT_BEGINNER_FAVORS],
      chosenFavor: null, // { favorId, tierIndex }
      dice: Array.from({ length: 6 }, (_, i) => ({ id: i, face: DIE_FACES.AXE, isGold: false, kept: false })),
      keptDice: []
    };
  }

  addLog(message, type = 'info') {
    this.log.push({ message, type, round: this.round, timestamp: new Date().toLocaleTimeString() });
  }

  startNewGame() {
    this.p1.hp = this.maxHp;
    this.p2.hp = this.maxHp;
    this.p1.powerTokens = 0;
    this.p2.powerTokens = 0;
    this.round = 1;
    this.winner = null;
    
    // Coin toss for starting player
    this.startingPlayer = Math.random() < 0.5 ? 1 : 2;
    this.currentPlayer = this.startingPlayer;
    this.addLog(`🪙 Tirage au sort : ${this.getPlayer(this.startingPlayer).name} joue en premier pour le tour 1 !`, 'system');

    this.startRound();
  }

  startRound() {
    this.phase = 'ROLL';
    this.rollTurn = 1;
    this.currentPlayer = this.startingPlayer;

    this.resetDiceForPlayer(this.p1);
    this.resetDiceForPlayer(this.p2);

    this.p1.chosenFavor = null;
    this.p2.chosenFavor = null;

    this.addLog(`--- MANCHE ${this.round} ---`, 'round');
    this.rollDiceForPlayer(this.currentPlayer);
  }

  resetDiceForPlayer(player) {
    player.dice = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      face: DIE_FACES.AXE,
      isGold: false,
      kept: false
    }));
    player.keptDice = [];
  }

  rollDiceForPlayer(playerNum) {
    const player = this.getPlayer(playerNum);
    
    // Roll all unkept dice
    player.dice.forEach(die => {
      if (!die.kept) {
        const randomConfig = STANDARD_DIE_FACES[Math.floor(Math.random() * STANDARD_DIE_FACES.length)];
        die.face = randomConfig.face;
        die.isGold = randomConfig.isGold;
      }
    });

    // If it's turn 3, auto-keep all remaining unkept dice
    if (this.rollTurn === 3) {
      player.dice.forEach(die => {
        die.kept = true;
      });
      player.keptDice = [...player.dice];
    }
  }

  toggleKeepDie(playerNum, dieId) {
    if (this.phase !== 'ROLL' || this.currentPlayer !== playerNum || this.rollTurn === 3) return false;
    
    const player = this.getPlayer(playerNum);
    const die = player.dice.find(d => d.id === dieId);
    if (die) {
      die.kept = !die.kept;
      player.keptDice = player.dice.filter(d => d.kept);
      return true;
    }
    return false;
  }

  confirmRollTurn(playerNum) {
    if (this.phase !== 'ROLL' || this.currentPlayer !== playerNum) return false;

    const player = this.getPlayer(playerNum);
    
    // Lock kept dice
    player.keptDice = player.dice.filter(d => d.kept);

    // Turn advancement logic
    if (this.startingPlayer === 1) {
      if (this.currentPlayer === 1) {
        this.currentPlayer = 2;
        this.rollDiceForPlayer(2);
      } else { // currentPlayer === 2
        this.rollTurn++;
        if (this.rollTurn <= 3) {
          this.currentPlayer = 1;
          this.rollDiceForPlayer(1);
        } else {
          this.startFavorPhase();
        }
      }
    } else { // startingPlayer === 2
      if (this.currentPlayer === 2) {
        this.currentPlayer = 1;
        this.rollDiceForPlayer(1);
      } else { // currentPlayer === 1
        this.rollTurn++;
        if (this.rollTurn <= 3) {
          this.currentPlayer = 2;
          this.rollDiceForPlayer(2);
        } else {
          this.startFavorPhase();
        }
      }
    }
    return true;
  }

  startFavorPhase() {
    this.phase = 'FAVOR';
    this.addLog(`✨ Phase des Faveurs Divines : Choisissez votre offrande.`, 'phase');
  }

  selectFavor(playerNum, favorId, tierIndex) {
    const player = this.getPlayer(playerNum);
    if (!favorId || tierIndex === null || tierIndex === undefined) {
      player.chosenFavor = null;
    } else {
      player.chosenFavor = { favorId, tierIndex };
    }
  }

  getPlayer(num) {
    return num === 1 ? this.p1 : this.p2;
  }

  getOpponent(num) {
    return num === 1 ? this.p2 : this.p1;
  }

  /**
   * Complete Resolution Phase Simulation
   */
  resolveRound() {
    this.phase = 'RESOLUTION';
    this.resolutionSteps = [];

    const first = this.startingPlayer === 1 ? this.p1 : this.p2;
    const second = this.startingPlayer === 1 ? this.p2 : this.p1;

    // --- STEP 1: Gold border dice power tokens ---
    const p1Gold = this.p1.dice.filter(d => d.isGold).length;
    const p2Gold = this.p2.dice.filter(d => d.isGold).length;

    this.p1.powerTokens += p1Gold;
    this.p2.powerTokens += p2Gold;

    this.resolutionSteps.push({
      step: 'GOLD_DICE',
      title: '🌟 Jetons des Dés Dorés',
      details: [
        `${this.p1.name} gagne +${p1Gold} jeton(s) de pouvoir (Total: ${this.p1.powerTokens})`,
        `${this.p2.name} gagne +${p2Gold} jeton(s) de pouvoir (Total: ${this.p2.powerTokens})`
      ]
    });

    // --- STEP 2: Pre-combat God Favors & Thrymr Theft ---
    let p1Favor = this.processFavorChoice(this.p1);
    let p2Favor = this.processFavorChoice(this.p2);

    // Check Thrymr (Vol de Thrymr reduces enemy favor tier)
    if (p1Favor && p1Favor.favor.id === 'THRYMR' && p2Favor) {
      const reduceVal = p1Favor.tier.value;
      p2Favor.tierIndex = Math.max(-1, p2Favor.tierIndex - reduceVal);
      if (p2Favor.tierIndex < 0) p2Favor = null;
      this.resolutionSteps.push({
        step: 'FAVOR_THRYMR',
        title: '⚡ Vol de Thrymr',
        details: [`${this.p1.name} réduit la faveur de ${this.p2.name} de ${reduceVal} niveau(x).`]
      });
    }

    if (p2Favor && p2Favor.favor.id === 'THRYMR' && p1Favor) {
      const reduceVal = p2Favor.tier.value;
      p1Favor.tierIndex = Math.max(-1, p1Favor.tierIndex - reduceVal);
      if (p1Favor.tierIndex < 0) p1Favor = null;
      this.resolutionSteps.push({
        step: 'FAVOR_THRYMR',
        title: '⚡ Vol de Thrymr',
        details: [`${this.p2.name} réduit la faveur de ${this.p1.name} de ${reduceVal} niveau(x).`]
      });
    }

    // Apply Before-combat favors (Thor, Vidar, Ullr, Baldr, Brunhild, Skuld, Freyr, Skadi, Loki)
    const combatModifiers = {
      p1DirectDamage: 0,
      p2DirectDamage: 0,
      p1VidarHelmetReduction: 0,
      p2VidarHelmetReduction: 0,
      p1UllrUnblockableArrows: 0,
      p2UllrUnblockableArrows: 0,
      p1BaldrDefenseBonus: 0,
      p2BaldrDefenseBonus: 0,
      p1BrunhildAxeMultiplier: 1.0,
      p2BrunhildAxeMultiplier: 1.0,
      p1SkadiBonusArrows: 0,
      p2SkadiBonusArrows: 0,
      p1BannedDice: 0,
      p2BannedDice: 0
    };

    [ { player: first, favor: first === this.p1 ? p1Favor : p2Favor, isP1: first === this.p1 },
      { player: second, favor: second === this.p1 ? p1Favor : p2Favor, isP1: second === this.p1 }
    ].forEach(({ player, favor, isP1 }) => {
      if (!favor) return;
      const f = favor.favor;
      const t = favor.tier;
      
      // Pay token cost
      if (player.powerTokens >= t.cost) {
        player.powerTokens -= t.cost;

        if (f.id === 'THOR') {
          if (isP1) combatModifiers.p1DirectDamage += t.value;
          else combatModifiers.p2DirectDamage += t.value;
          this.resolutionSteps.push({
            step: 'FAVOR_EXEC',
            title: `⚡ ${f.name}`,
            details: [`${player.name} invoque ${f.name} (Niveau ${favor.tierIndex + 1}) : ${t.value} dégâts directs !`]
          });
        } else if (f.id === 'VIDAR') {
          if (isP1) combatModifiers.p1VidarHelmetReduction = t.value;
          else combatModifiers.p2VidarHelmetReduction = t.value;
          this.resolutionSteps.push({
            step: 'FAVOR_EXEC',
            title: `⚡ ${f.name}`,
            details: [`${player.name} détruit jusqu'à ${t.value} Casques adverses.`]
          });
        } else if (f.id === 'ULLR') {
          if (isP1) combatModifiers.p1UllrUnblockableArrows = t.value;
          else combatModifiers.p2UllrUnblockableArrows = t.value;
          this.resolutionSteps.push({
            step: 'FAVOR_EXEC',
            title: `⚡ ${f.name}`,
            details: [`${t.value} flèche(s) de ${player.name} ignoreront les Boucliers.`]
          });
        } else if (f.id === 'BALDR') {
          if (isP1) combatModifiers.p1BaldrDefenseBonus = t.value;
          else combatModifiers.p2BaldrDefenseBonus = t.value;
          this.resolutionSteps.push({
            step: 'FAVOR_EXEC',
            title: `⚡ ${f.name}`,
            details: [`${player.name} gagne +${t.value} de défense par dé de défense.`]
          });
        } else if (f.id === 'BRUNHILD') {
          if (isP1) combatModifiers.p1BrunhildAxeMultiplier = t.multiplier;
          else combatModifiers.p2BrunhildAxeMultiplier = t.multiplier;
          this.resolutionSteps.push({
            step: 'FAVOR_EXEC',
            title: `⚡ ${f.name}`,
            details: [`${player.name} multiplie ses Haches par x${t.multiplier}.`]
          });
        } else if (f.id === 'SKULD') {
          const arrowCount = player.dice.filter(d => d.face === DIE_FACES.ARROW).length;
          const tokensDestroyed = arrowCount * t.value;
          const opp = this.getOpponent(isP1 ? 1 : 2);
          opp.powerTokens = Math.max(0, opp.powerTokens - tokensDestroyed);
          this.resolutionSteps.push({
            step: 'FAVOR_EXEC',
            title: `⚡ ${f.name}`,
            details: [`${player.name} détruit ${tokensDestroyed} jeton(s) de pouvoir de ${opp.name}.`]
          });
        } else if (f.id === 'SKADI') {
          if (isP1) combatModifiers.p1SkadiBonusArrows = t.value;
          else combatModifiers.p2SkadiBonusArrows = t.value;
          this.resolutionSteps.push({
            step: 'FAVOR_EXEC',
            title: `⚡ ${f.name}`,
            details: [`${player.name} gagne +${t.value} flèche(s) par dé Flèche.`]
          });
        } else if (f.id === 'LOKI') {
          if (isP1) combatModifiers.p1BannedDice = t.value;
          else combatModifiers.p2BannedDice = t.value;
          this.resolutionSteps.push({
            step: 'FAVOR_EXEC',
            title: `⚡ ${f.name}`,
            details: [`${player.name} bannit ${t.value} dé(s) de l'adversaire.`]
          });
        }
      } else {
        this.resolutionSteps.push({
          step: 'FAVOR_FAIL',
          title: `❌ ${f.name} Échoue`,
          details: [`${player.name} n'a pas assez de jetons (${player.powerTokens}/${t.cost}).`]
        });
      }
    });

    // Apply Direct Damage from Thor
    if (combatModifiers.p1DirectDamage > 0) {
      this.p2.hp = Math.max(0, this.p2.hp - combatModifiers.p1DirectDamage);
    }
    if (combatModifiers.p2DirectDamage > 0) {
      this.p1.hp = Math.max(0, this.p1.hp - combatModifiers.p2DirectDamage);
    }

    // --- STEP 3: Steal Phase (Mains / Hands) ---
    const p1StealsRaw = this.p1.dice.filter(d => d.face === DIE_FACES.STEAL).length;
    const p2StealsRaw = this.p2.dice.filter(d => d.face === DIE_FACES.STEAL).length;

    // Bragi's verve check
    if (p1Favor && p1Favor.favor.id === 'BRAGI' && this.p1.powerTokens >= p1Favor.tier.cost) {
      this.p1.powerTokens -= p1Favor.tier.cost;
      this.p1.powerTokens += p1StealsRaw * p1Favor.tier.value;
    }
    if (p2Favor && p2Favor.favor.id === 'BRAGI' && this.p2.powerTokens >= p2Favor.tier.cost) {
      this.p2.powerTokens -= p2Favor.tier.cost;
      this.p2.powerTokens += p2StealsRaw * p2Favor.tier.value;
    }

    // Execute Steals in turn order
    let p1Stolen = 0;
    let p2Stolen = 0;

    if (this.startingPlayer === 1) {
      p1Stolen = Math.min(p1StealsRaw, this.p2.powerTokens);
      this.p2.powerTokens -= p1Stolen;
      this.p1.powerTokens += p1Stolen;

      p2Stolen = Math.min(p2StealsRaw, this.p1.powerTokens);
      this.p1.powerTokens -= p2Stolen;
      this.p2.powerTokens += p2Stolen;
    } else {
      p2Stolen = Math.min(p2StealsRaw, this.p1.powerTokens);
      this.p1.powerTokens -= p2Stolen;
      this.p2.powerTokens += p2Stolen;

      p1Stolen = Math.min(p1StealsRaw, this.p2.powerTokens);
      this.p2.powerTokens -= p1Stolen;
      this.p1.powerTokens += p1Stolen;
    }

    this.resolutionSteps.push({
      step: 'STEAL',
      title: '🖐️ Phase de Vol (Mains)',
      details: [
        `${this.p1.name} vole ${p1Stolen} jeton(s) à ${this.p2.name}`,
        `${this.p2.name} vole ${p2Stolen} jeton(s) à ${this.p1.name}`
      ]
    });

    // --- STEP 4: Ranged Combat (Arrows vs Shields) ---
    const p1ArrowDice = Math.max(0, this.p1.dice.filter(d => d.face === DIE_FACES.ARROW).length - combatModifiers.p2BannedDice);
    const p2ArrowDice = Math.max(0, this.p2.dice.filter(d => d.face === DIE_FACES.ARROW).length - combatModifiers.p1BannedDice);

    let p1TotalArrows = p1ArrowDice * (1 + combatModifiers.p1SkadiBonusArrows);
    let p2TotalArrows = p2ArrowDice * (1 + combatModifiers.p2SkadiBonusArrows);

    const p1ShieldDice = Math.max(0, this.p1.dice.filter(d => d.face === DIE_FACES.SHIELD).length);
    const p2ShieldDice = Math.max(0, this.p2.dice.filter(d => d.face === DIE_FACES.SHIELD).length);

    let p1ShieldVal = p1ShieldDice > 0 ? p1ShieldDice + (p1ShieldDice * combatModifiers.p1BaldrDefenseBonus) : 0;
    let p2ShieldVal = p2ShieldDice > 0 ? p2ShieldDice + (p2ShieldDice * combatModifiers.p2BaldrDefenseBonus) : 0;

    // Apply Ullr unblockable arrows
    const p1Unblockable = Math.min(p1TotalArrows, combatModifiers.p1UllrUnblockableArrows);
    const p1NormalArrows = p1TotalArrows - p1Unblockable;
    const p1BlockedRanged = Math.min(p1NormalArrows, p2ShieldVal);
    const p1RangedDamage = p1Unblockable + Math.max(0, p1NormalArrows - p2ShieldVal);

    const p2Unblockable = Math.min(p2TotalArrows, combatModifiers.p2UllrUnblockableArrows);
    const p2NormalArrows = p2TotalArrows - p2Unblockable;
    const p2BlockedRanged = Math.min(p2NormalArrows, p1ShieldVal);
    const p2RangedDamage = p2Unblockable + Math.max(0, p2NormalArrows - p1ShieldVal);

    this.p2.hp = Math.max(0, this.p2.hp - p1RangedDamage);
    this.p1.hp = Math.max(0, this.p1.hp - p2RangedDamage);

    this.resolutionSteps.push({
      step: 'RANGED',
      title: '🏹 Combat à Distance (Flèches vs Boucliers)',
      details: [
        `${this.p1.name}: ${p1TotalArrows} Flèches vs ${p2ShieldVal} Boucliers -> ${p1RangedDamage} dégât(s) infligé(s)`,
        `${this.p2.name}: ${p2TotalArrows} Flèches vs ${p1ShieldVal} Boucliers -> ${p2RangedDamage} dégât(s) infligé(s)`
      ]
    });

    // --- STEP 5: Melee Combat (Axes vs Helmets) ---
    const p1AxeDice = Math.max(0, this.p1.dice.filter(d => d.face === DIE_FACES.AXE).length - combatModifiers.p2BannedDice);
    const p2AxeDice = Math.max(0, this.p2.dice.filter(d => d.face === DIE_FACES.AXE).length - combatModifiers.p1BannedDice);

    let p1TotalAxes = Math.ceil(p1AxeDice * combatModifiers.p1BrunhildAxeMultiplier);
    let p2TotalAxes = Math.ceil(p2AxeDice * combatModifiers.p2BrunhildAxeMultiplier);

    const p1HelmetDice = Math.max(0, this.p1.dice.filter(d => d.face === DIE_FACES.HELMET).length);
    const p2HelmetDice = Math.max(0, this.p2.dice.filter(d => d.face === DIE_FACES.HELMET).length);

    let p1HelmetVal = Math.max(0, p1HelmetDice - combatModifiers.p2VidarHelmetReduction);
    if (p1HelmetVal > 0 && combatModifiers.p1BaldrDefenseBonus > 0) p1HelmetVal += p1HelmetDice * combatModifiers.p1BaldrDefenseBonus;

    let p2HelmetVal = Math.max(0, p2HelmetDice - combatModifiers.p1VidarHelmetReduction);
    if (p2HelmetVal > 0 && combatModifiers.p2BaldrDefenseBonus > 0) p2HelmetVal += p2HelmetDice * combatModifiers.p2BaldrDefenseBonus;

    const p1BlockedMelee = Math.min(p1TotalAxes, p2HelmetVal);
    const p1MeleeDamage = Math.max(0, p1TotalAxes - p2HelmetVal);

    const p2BlockedMelee = Math.min(p2TotalAxes, p1HelmetVal);
    const p2MeleeDamage = Math.max(0, p2TotalAxes - p1HelmetVal);

    this.p2.hp = Math.max(0, this.p2.hp - p1MeleeDamage);
    this.p1.hp = Math.max(0, this.p1.hp - p2MeleeDamage);

    this.resolutionSteps.push({
      step: 'MELEE',
      title: '🪓 Combat au Corps-à-Corps (Haches vs Casques)',
      details: [
        `${this.p1.name}: ${p1TotalAxes} Haches vs ${p2HelmetVal} Casques -> ${p1MeleeDamage} dégât(s) infligé(s)`,
        `${this.p2.name}: ${p2TotalAxes} Haches vs ${p1HelmetVal} Casques -> ${p2MeleeDamage} dégât(s) infligé(s)`
      ]
    });

    // --- STEP 6: Post-Combat Favors (Idunn, Hel, Heimdall, Odin, Tyr, Var, Mimir) ---
    [ { player: first, favor: first === this.p1 ? p1Favor : p2Favor, isP1: first === this.p1 },
      { player: second, favor: second === this.p1 ? p1Favor : p2Favor, isP1: second === this.p1 }
    ].forEach(({ player, favor, isP1 }) => {
      if (!favor) return;
      const f = favor.favor;
      const t = favor.tier;

      if (f.timing === 'AFTER_COMBAT' && player.powerTokens >= t.cost) {
        player.powerTokens -= t.cost;

        if (f.id === 'IDUNN') {
          player.hp = Math.min(this.maxHp, player.hp + t.value);
          this.resolutionSteps.push({
            step: 'POST_FAVOR',
            title: `✨ ${f.name}`,
            details: [`${player.name} se soigne de ${t.value} PV.`]
          });
        } else if (f.id === 'HEL') {
          const axeDmg = isP1 ? p1MeleeDamage : p2MeleeDamage;
          const heal = axeDmg * t.value;
          player.hp = Math.min(this.maxHp, player.hp + heal);
          this.resolutionSteps.push({
            step: 'POST_FAVOR',
            title: `✨ ${f.name}`,
            details: [`${player.name} se soigne de ${heal} PV grâce à ses dégâts de Hache.`]
          });
        } else if (f.id === 'HEIMDALL') {
          const blocks = isP1 ? (p2BlockedRanged + p2BlockedMelee) : (p1BlockedRanged + p1BlockedMelee);
          const heal = blocks * t.value;
          player.hp = Math.min(this.maxHp, player.hp + heal);
          this.resolutionSteps.push({
            step: 'POST_FAVOR',
            title: `✨ ${f.name}`,
            details: [`${player.name} se soigne de ${heal} PV grâce à ses attaques bloquées.`]
          });
        }
      }
    });

    // Check Win Condition
    if (this.p1.hp <= 0 || this.p2.hp <= 0) {
      this.phase = 'GAME_OVER';
      if (this.p1.hp <= 0 && this.p2.hp <= 0) {
        this.winner = 'DRAW';
        this.addLog(`🤝 Égalité parfaite ! Les deux vikings sont tombés au combat.`, 'victory');
      } else if (this.p1.hp > 0) {
        this.winner = 1;
        this.addLog(`🏆 Victoire de ${this.p1.name} ! Skál !`, 'victory');
      } else {
        this.winner = 2;
        this.addLog(`🏆 Victoire de ${this.p2.name} ! Skál !`, 'victory');
      }
    } else {
      // Next Round Preparation
      this.round++;
      this.startingPlayer = this.startingPlayer === 1 ? 2 : 1;
    }
  }

  processFavorChoice(player) {
    if (!player.chosenFavor) return null;
    const favor = GOD_FAVORS[player.chosenFavor.favorId];
    if (!favor) return null;
    const tierIndex = player.chosenFavor.tierIndex;
    const tier = favor.tiers[tierIndex];
    if (!tier) return null;
    return { favor, tierIndex, tier };
  }
}
