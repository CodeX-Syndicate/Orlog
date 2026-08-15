/**
 * Constants and Configuration for Orlog Web Game
 */

export const DIE_FACES = {
  AXE: 'AXE',          // Hache (Melee attack)
  ARROW: 'ARROW',      // Flèche (Ranged attack)
  HELMET: 'HELMET',    // Casque (Melee defense)
  SHIELD: 'SHIELD',    // Bouclier (Ranged defense)
  STEAL: 'STEAL'       // Main (Steal god power token)
};

export const FACE_ICONS = {
  AXE: '🪓',
  ARROW: '🏹',
  HELMET: '🪖',
  SHIELD: '🛡️',
  STEAL: '🖐️'
};

export const FACE_NAMES_FR = {
  AXE: 'Hache',
  ARROW: 'Flèche',
  HELMET: 'Casque',
  SHIELD: 'Bouclier',
  STEAL: 'Main'
};

// Standard face distribution for an Orlog die (6 faces, 2 with gold borders)
export const STANDARD_DIE_FACES = [
  { face: DIE_FACES.AXE, isGold: false },
  { face: DIE_FACES.ARROW, isGold: false },
  { face: DIE_FACES.HELMET, isGold: false },
  { face: DIE_FACES.SHIELD, isGold: false },
  { face: DIE_FACES.STEAL, isGold: true },
  { face: DIE_FACES.AXE, isGold: true }
];

export const TIMING = {
  BEFORE_COMBAT: 'BEFORE_COMBAT',
  STEAL_PHASE: 'STEAL_PHASE',
  RANGED_PHASE: 'RANGED_PHASE',
  MELEE_PHASE: 'MELEE_PHASE',
  AFTER_COMBAT: 'AFTER_COMBAT'
};

/**
 * 20 GOD FAVORS (Faveurs Divines)
 * Exact specifications from README.md & official rules
 */
export const GOD_FAVORS = {
  THOR: {
    id: 'THOR',
    name: 'Frappe de Thor',
    god: 'Thor',
    description: 'Inflige des dégâts directs à l’adversaire.',
    timing: TIMING.BEFORE_COMBAT,
    tiers: [
      { cost: 4, value: 2, text: '2 dégâts directs (4 🌟)' },
      { cost: 8, value: 5, text: '5 dégâts directs (8 🌟)' },
      { cost: 12, value: 8, text: '8 dégâts directs (12 🌟)' }
    ]
  },
  VIDAR: {
    id: 'VIDAR',
    name: 'Puissance de Vidar',
    god: 'Vidar',
    description: 'Soustrait des dés de Casques à l’adversaire.',
    timing: TIMING.BEFORE_COMBAT,
    tiers: [
      { cost: 2, value: 2, text: '-2 Casques (2 🌟)' },
      { cost: 4, value: 4, text: '-4 Casques (4 🌟)' },
      { cost: 6, value: 6, text: '-6 Casques (6 🌟)' }
    ]
  },
  IDUNN: {
    id: 'IDUNN',
    name: "Rajeunissement d'Idunn",
    god: 'Idunn',
    description: 'Reconstitution de santé après la phase de résolution.',
    timing: TIMING.AFTER_COMBAT,
    tiers: [
      { cost: 4, value: 2, text: '+2 Santé (4 🌟)' },
      { cost: 7, value: 4, text: '+4 Santé (7 🌟)' },
      { cost: 10, value: 6, text: '+6 Santé (10 🌟)' }
    ]
  },
  HEL: {
    id: 'HEL',
    name: 'Étreinte de Hel',
    god: 'Hel',
    description: 'Les dégâts de Hache infligés vous soignent.',
    timing: TIMING.AFTER_COMBAT,
    tiers: [
      { cost: 6, value: 1, text: '+1 Santé par dégât de Hache (6 🌟)' },
      { cost: 12, value: 2, text: '+2 Santé par dégât de Hache (12 🌟)' },
      { cost: 18, value: 3, text: '+3 Santé par dégât de Hache (18 🌟)' }
    ]
  },
  HEIMDALL: {
    id: 'HEIMDALL',
    name: 'Guet de Heimdall',
    god: 'Heimdall',
    description: 'Reconstitution de santé pour chaque attaque bloquée.',
    timing: TIMING.AFTER_COMBAT,
    tiers: [
      { cost: 4, value: 1, text: '+1 Santé par blocage (4 🌟)' },
      { cost: 7, value: 2, text: '+2 Santé par blocage (7 🌟)' },
      { cost: 10, value: 3, text: '+3 Santé par blocage (10 🌟)' }
    ]
  },
  ULLR: {
    id: 'ULLR',
    name: "Visée d'Ullr",
    god: 'Ullr',
    description: 'Les flèches ignorent les boucliers de l’adversaire.',
    timing: TIMING.BEFORE_COMBAT,
    tiers: [
      { cost: 2, value: 2, text: '2 Flèches ignorent les Boucliers (2 🌟)' },
      { cost: 3, value: 3, text: '3 Flèches ignorent les Boucliers (3 🌟)' },
      { cost: 4, value: 6, text: '6 Flèches ignorent les Boucliers (4 🌟)' }
    ]
  },
  BALDR: {
    id: 'BALDR',
    name: "Invulnérabilité de Baldr",
    god: 'Baldr',
    description: 'Ajout de défenses supplémentaires aux dés de défense.',
    timing: TIMING.BEFORE_COMBAT,
    tiers: [
      { cost: 3, value: 1, text: '+1 défense par dé de défense (3 🌟)' },
      { cost: 6, value: 2, text: '+2 défense par dé de défense (6 🌟)' },
      { cost: 9, value: 3, text: '+3 défense par dé de défense (9 🌟)' }
    ]
  },
  BRUNHILD: {
    id: 'BRUNHILD',
    name: 'Fureur de Brunehilde',
    god: 'Brunehilde',
    description: 'Multiplication des haches (arrondi supérieur).',
    timing: TIMING.BEFORE_COMBAT,
    tiers: [
      { cost: 6, multiplier: 1.5, text: 'x1.5 Haches (6 🌟)' },
      { cost: 10, multiplier: 2.0, text: 'x2 Haches (10 🌟)' },
      { cost: 18, multiplier: 3.0, text: 'x3 Haches (18 🌟)' }
    ]
  },
  SKULD: {
    id: 'SKULD',
    name: 'Annonce de Skuld',
    god: 'Skuld',
    description: 'Destruction des jetons de l’adversaire par dé Flèche.',
    timing: TIMING.BEFORE_COMBAT,
    tiers: [
      { cost: 4, value: 2, text: '-2 🌟 par dé Flèche (4 🌟)' },
      { cost: 6, value: 3, text: '-3 🌟 par dé Flèche (6 🌟)' },
      { cost: 8, value: 4, text: '-4 🌟 par dé Flèche (8 🌟)' }
    ]
  },
  FRIGG: {
    id: 'FRIGG',
    name: 'Vue de Frigg',
    god: 'Frigg',
    description: 'Nouveau lancer de dés choisis.',
    timing: TIMING.BEFORE_COMBAT,
    tiers: [
      { cost: 2, value: 2, text: 'Relance 2 dés (2 🌟)' },
      { cost: 3, value: 3, text: 'Relance 3 dés (3 🌟)' },
      { cost: 4, value: 4, text: 'Relance 4 dés (4 🌟)' }
    ]
  },
  ODIN: {
    id: 'ODIN',
    name: "Sacrifice d'Odin",
    god: 'Odin',
    description: 'Sacrifice de santé contre des jetons de pouvoir.',
    timing: TIMING.AFTER_COMBAT,
    tiers: [
      { cost: 6, value: 2, text: '+2 🌟 par PV sacrifié (6 🌟)' },
      { cost: 8, value: 3, text: '+3 🌟 par PV sacrifié (8 🌟)' },
      { cost: 10, value: 5, text: '+5 🌟 par PV sacrifié (10 🌟)' }
    ]
  },
  FREYR: {
    id: 'FREYR',
    name: 'Don de Freyr',
    god: 'Freyr',
    description: 'Ajout au total de la face de dé majoritaire.',
    timing: TIMING.BEFORE_COMBAT,
    tiers: [
      { cost: 4, value: 2, text: '+2 au type majoritaire (4 🌟)' },
      { cost: 6, value: 3, text: '+3 au type majoritaire (6 🌟)' },
      { cost: 8, value: 4, text: '+4 au type majoritaire (8 🌟)' }
    ]
  },
  TYR: {
    id: 'TYR',
    name: 'Gage de Tyr',
    god: 'Tyr',
    description: 'Sacrifice de santé pour détruire les jetons de l’adversaire.',
    timing: TIMING.AFTER_COMBAT,
    tiers: [
      { cost: 4, value: 2, text: '-2 🌟 ennemi par PV sacrifié (4 🌟)' },
      { cost: 6, value: 3, text: '-3 🌟 ennemi par PV sacrifié (6 🌟)' },
      { cost: 8, value: 5, text: '-5 🌟 ennemi par PV sacrifié (8 🌟)' }
    ]
  },
  VAR: {
    id: 'VAR',
    name: 'Lien de Var',
    god: 'Var',
    description: 'Soins pour chaque jeton dépense par l’adversaire.',
    timing: TIMING.AFTER_COMBAT,
    tiers: [
      { cost: 10, value: 1, text: '+1 PV par 🌟 dépensé par l’ennemi (10 🌟)' },
      { cost: 14, value: 2, text: '+2 PV par 🌟 dépensé par l’ennemi (14 🌟)' },
      { cost: 18, value: 3, text: '+3 PV par 🌟 dépensé par l’ennemi (18 🌟)' }
    ]
  },
  THRYMR: {
    id: 'THRYMR',
    name: 'Vol de Thrymr',
    god: 'Thrymr',
    description: 'Réduction du niveau de la faveur invoquée par l’adversaire.',
    timing: TIMING.BEFORE_COMBAT,
    tiers: [
      { cost: 3, value: 1, text: '-1 niveau de faveur ennemie (3 🌟)' },
      { cost: 6, value: 2, text: '-2 niveaux de faveur ennemie (6 🌟)' },
      { cost: 9, value: 3, text: '-3 niveaux de faveur ennemie (9 🌟)' }
    ]
  },
  SKADI: {
    id: 'SKADI',
    name: 'Chasse de Skadi',
    god: 'Skadi',
    description: 'Ajout de flèches à chaque dé ayant obtenu une flèche.',
    timing: TIMING.BEFORE_COMBAT,
    tiers: [
      { cost: 6, value: 1, text: '+1 Flèche par dé Flèche (6 🌟)' },
      { cost: 10, value: 2, text: '+2 Flèches par dé Flèche (10 🌟)' },
      { cost: 14, value: 3, text: '+3 Flèches par dé Flèche (14 🌟)' }
    ]
  },
  FREYJA: {
    id: 'FREYJA',
    name: 'Abondance de Freyja',
    god: 'Freyja',
    description: 'Lancer de dés supplémentaire durant ce tour.',
    timing: TIMING.BEFORE_COMBAT,
    tiers: [
      { cost: 2, value: 1, text: '+1 dé supplémentaire (2 🌟)' },
      { cost: 4, value: 2, text: '+2 dés supplémentaires (4 🌟)' },
      { cost: 6, value: 3, text: '+3 dés supplémentaires (6 🌟)' }
    ]
  },
  MIMIR: {
    id: 'MIMIR',
    name: 'Sagesse de Mimir',
    god: 'Mimir',
    description: 'Gain de jetons pour chaque dégât subi cette manche.',
    timing: TIMING.AFTER_COMBAT,
    tiers: [
      { cost: 3, value: 1, text: '+1 🌟 par dégât subi (3 🌟)' },
      { cost: 5, value: 2, text: '+2 🌟 par dégât subi (5 🌟)' },
      { cost: 7, value: 3, text: '+3 🌟 par dégât subi (7 🌟)' }
    ]
  },
  LOKI: {
    id: 'LOKI',
    name: 'Ruse de Loki',
    god: 'Loki',
    description: 'Bannissement des dés de l’adversaire pour cette manche.',
    timing: TIMING.BEFORE_COMBAT,
    tiers: [
      { cost: 3, value: 1, text: 'Bannit 1 dé ennemi (3 🌟)' },
      { cost: 6, value: 2, text: 'Bannit 2 dés ennemis (6 🌟)' },
      { cost: 9, value: 3, text: 'Bannit 3 dés ennemis (9 🌟)' }
    ]
  },
  BRAGI: {
    id: 'BRAGI',
    name: 'Verve de Bragi',
    god: 'Bragi',
    description: 'Gain de jetons pour chaque dé ayant obtenu une main.',
    timing: TIMING.STEAL_PHASE,
    tiers: [
      { cost: 4, value: 2, text: '+2 🌟 par dé Main (4 🌟)' },
      { cost: 8, value: 3, text: '+3 🌟 par dé Main (8 🌟)' },
      { cost: 12, value: 4, text: '+4 🌟 par dé Main (12 🌟)' }
    ]
  }
};

export const DEFAULT_BEGINNER_FAVORS = ['THOR', 'IDUNN', 'ODIN'];
