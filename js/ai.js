/**
 * Orlog AI Engine
 * Smart bot with Easy, Medium, and Hard (Strategic) decision making.
 */

import { DIE_FACES, GOD_FAVORS } from './constants.js';

export class OrlogAI {
  constructor(difficulty = 'medium') {
    this.difficulty = difficulty; // 'easy', 'medium', 'hard'
  }

  setDifficulty(diff) {
    this.difficulty = diff;
  }

  /**
   * Decide which dice to keep during roll turn (turns 1 and 2)
   */
  decideDiceToKeep(gameEngine, playerNum = 2) {
    const aiPlayer = gameEngine.getPlayer(playerNum);
    const oppPlayer = gameEngine.getOpponent(playerNum);

    if (this.difficulty === 'easy') {
      // Easy: Random keeping (50% chance for each unkept die)
      aiPlayer.dice.forEach(die => {
        if (!die.kept && Math.random() > 0.5) {
          gameEngine.toggleKeepDie(playerNum, die.id);
        }
      });
      return;
    }

    if (this.difficulty === 'medium') {
      // Medium: Keep gold border dice, keep attacks if opponent is low, keep steals
      aiPlayer.dice.forEach(die => {
        if (die.kept) return;

        let shouldKeep = false;
        if (die.isGold) shouldKeep = true;
        else if (die.face === DIE_FACES.STEAL && oppPlayer.powerTokens > 0) shouldKeep = true;
        else if (oppPlayer.hp <= 5 && (die.face === DIE_FACES.AXE || die.face === DIE_FACES.ARROW)) shouldKeep = true;
        else if (Math.random() < 0.4) shouldKeep = true;

        if (shouldKeep) {
          gameEngine.toggleKeepDie(playerNum, die.id);
        }
      });
      return;
    }

    // --- HARD DIFFICULTY (Strategic AI) ---
    // Count opponent's visible dice
    const oppAxes = oppPlayer.dice.filter(d => d.kept && d.face === DIE_FACES.AXE).length;
    const oppArrows = oppPlayer.dice.filter(d => d.kept && d.face === DIE_FACES.ARROW).length;
    const oppHelmets = oppPlayer.dice.filter(d => d.kept && d.face === DIE_FACES.HELMET).length;
    const oppShields = oppPlayer.dice.filter(d => d.kept && d.face === DIE_FACES.SHIELD).length;

    aiPlayer.dice.forEach(die => {
      if (die.kept) return;

      let score = 0;

      // Rule 1: Gold borders are high priority for building tokens
      if (die.isGold) score += 4;

      // Rule 2: If opponent has tokens, Steal is very valuable
      if (die.face === DIE_FACES.STEAL && oppPlayer.powerTokens > 2) score += 3;

      // Rule 3: Defensive response if AI HP is low or opponent has heavy attacks
      if (die.face === DIE_FACES.HELMET && (oppAxes > 1 || aiPlayer.hp < 6)) score += 3;
      if (die.face === DIE_FACES.SHIELD && (oppArrows > 1 || aiPlayer.hp < 6)) score += 3;

      // Rule 4: Offensive push if opponent is weak or has no defenses
      if (die.face === DIE_FACES.AXE && oppHelmets === 0) score += 2.5;
      if (die.face === DIE_FACES.ARROW && oppShields === 0) score += 2.5;

      // Keep die if score >= 2.5
      if (score >= 2.5) {
        gameEngine.toggleKeepDie(playerNum, die.id);
      }
    });
  }

  /**
   * Decide God Favor invocation
   */
  decideFavor(gameEngine, playerNum = 2) {
    const aiPlayer = gameEngine.getPlayer(playerNum);
    const oppPlayer = gameEngine.getOpponent(playerNum);

    if (aiPlayer.favors.length === 0 || aiPlayer.powerTokens < 2) {
      gameEngine.selectFavor(playerNum, null, null);
      return;
    }

    if (this.difficulty === 'easy') {
      // Easy: 30% chance to select a favor randomly if affordable
      if (Math.random() < 0.3) {
        const availableFavors = aiPlayer.favors
          .map(id => GOD_FAVORS[id])
          .filter(f => f && f.tiers[0].cost <= aiPlayer.powerTokens);
        
        if (availableFavors.length > 0) {
          const chosen = availableFavors[Math.floor(Math.random() * availableFavors.length)];
          gameEngine.selectFavor(playerNum, chosen.id, 0);
          return;
        }
      }
      gameEngine.selectFavor(playerNum, null, null);
      return;
    }

    // Medium / Hard Strategic Favor Choice
    let bestChoice = null; // { favorId, tierIndex, score }
    let maxScore = 0;

    aiPlayer.favors.forEach(favorId => {
      const favor = GOD_FAVORS[favorId];
      if (!favor) return;

      favor.tiers.forEach((tier, tierIdx) => {
        if (aiPlayer.powerTokens >= tier.cost) {
          let score = tier.cost * 1.2;

          // Priority logic based on game state
          if (favor.id === 'THOR') {
            // Thor's Strike deals direct damage
            if (oppPlayer.hp <= tier.value) score += 20; // Fatal strike!
            else score += tier.value * 2;
          } else if (favor.id === 'IDUNN') {
            // Heal if low HP
            if (aiPlayer.hp <= 8) score += (15 - aiPlayer.hp) * 1.8;
          } else if (favor.id === 'ULLR') {
            // Ignore shields
            const oppShields = oppPlayer.dice.filter(d => d.face === DIE_FACES.SHIELD).length;
            if (oppShields >= 2) score += 10;
          } else if (favor.id === 'VIDAR') {
            // Reduce helmets
            const oppHelmets = oppPlayer.dice.filter(d => d.face === DIE_FACES.HELMET).length;
            if (oppHelmets >= 2) score += 8;
          } else if (favor.id === 'HEL') {
            // Heal from axes
            const myAxes = aiPlayer.dice.filter(d => d.face === DIE_FACES.AXE).length;
            if (myAxes >= 2) score += 9;
          }

          if (score > maxScore) {
            maxScore = score;
            bestChoice = { favorId: favor.id, tierIndex: tierIdx };
          }
        }
      });
    });

    if (bestChoice && maxScore >= 5) {
      gameEngine.selectFavor(playerNum, bestChoice.favorId, bestChoice.tierIndex);
    } else {
      gameEngine.selectFavor(playerNum, null, null);
    }
  }
}
