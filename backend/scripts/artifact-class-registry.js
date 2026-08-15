/**
 * Epic Seven Artifact Class Restriction Official Registry
 * Maps canonical artifact key_names to exact Hero Class Restrictions:
 * 'Warrior', 'Knight', 'Thief', 'Ranger', 'Mage', 'Soul Weaver', 'Common'
 */

const ARTIFACT_CLASS_MAP = {
  // Knight
  'aurius': 'Knight',
  'adamant-shield': 'Knight',
  'elbris-3-d-sword': 'Knight',
  'elbris-3d-sword': 'Knight',
  'holy-sacrifice': 'Knight',
  'hilag-lance': 'Knight',
  'noble-oath': 'Knight',
  'bastion-of-perlutia': 'Knight',
  'crown-of-glory': 'Knight',
  'rise-of-a-monarch': 'Knight',
  'justice-for-all': 'Knight',
  'sword-of-ezera': 'Knight',
  'lance-of-dark-dragon': 'Knight',
  'bastion-of-hope': 'Knight',
  'flawless-garments': 'Knight',
  'rocket-punch-gauntlet': 'Knight',
  'victorious-flag': 'Knight',
  'guide-to-a-decision': 'Knight',
  'goblet-of-oath': 'Knight',
  'unfading-memories': 'Knight',
  'shield-of-raging-tempest': 'Knight',

  // Warrior
  'sigurd-scythe': 'Warrior',
  'uberius-tooth': 'Warrior',
  'durandal': 'Warrior',
  'draco-plate': 'Warrior',
  'cradle-of-life': 'Warrior',
  'samsara-prayer-beads': 'Warrior',
  'creation-and-destruction': 'Warrior',
  'champions-trophy': 'Warrior',
  'snowed-on-sphere': 'Warrior',
  'alencinoxs-wrath': 'Warrior',
  'golden-rose': 'Warrior',
  'sweet-miracle': 'Warrior',
  'exif-detective-ed-gadget': 'Warrior',
  'upgraded-dragon-knuckles': 'Warrior',
  'strak-gauntlet': 'Warrior',
  'hell-cutter': 'Warrior',
  'els-fist': 'Warrior',
  'border-coin': 'Warrior',
  'junkyard-dog': 'Warrior',
  'sepic-art-charm': 'Warrior',
  'crimson-moon-of-nightmares': 'Warrior',
  'anchorage-of-the-soul': 'Warrior',

  // Thief
  'alexas-basket': 'Thief',
  'wind-rider': 'Thief',
  'rhianna-and-luciella': 'Thief',
  'dust-devil': 'Thief',
  'violet-talisman': 'Thief',
  'elyhas-knife': 'Thief',
  'moonlight-dreamblade': 'Thief',
  'secret-art-elsist': 'Thief',
  'shepherd-of-the-hollow': 'Thief',
  'sword-of-summer-twilight': 'Thief',
  'manica-of-control': 'Thief',
  'double-edged-decrescent': 'Thief',
  'torn-sleeve': 'Thief',
  'jack-os-symbol': 'Thief',
  'decrescendo': 'Thief',
  'silver-rain': 'Thief',
  'santa-muerte': 'Thief',
  'sword-of-the-morning': 'Thief',
  'r&l': 'Thief',
  'r-and-l': 'Thief',

  // Ranger
  'song-of-stars': 'Ranger',
  'reingar-special-drink': 'Ranger',
  'bloodstone': 'Ranger',
  'rosa-hargana': 'Ranger',
  'guiding-light': 'Ranger',
  'iron-fan': 'Ranger',
  'sashe-ithanes': 'Ranger',
  'ms-confille': 'Ranger',
  'wall-of-order': 'Ranger',
  'star-of-the-deep-sea': 'Ranger',
  'dux-noctis': 'Ranger',
  'sword-of-judgment': 'Ranger',
  'andres-crossbow': 'Ranger',
  'air-to-surface-missile-misha': 'Ranger',
  'infinity-basket': 'Ranger',
  'ambrote': 'Ranger',
  'radiant-forever': 'Ranger',
  'surag-bow': 'Ranger',

  // Mage
  'tagehels-ancient-book': 'Mage',
  'eticas-scepter': 'Mage',
  'time-matter': 'Mage',
  'abyssal-crown': 'Mage',
  'kaladra': 'Mage',
  'spirits-breath': 'Mage',
  'necro-and-undine': 'Mage',
  'iela-violin': 'Mage',
  'chatty': 'Mage',
  'sirens-call': 'Mage',
  'last-teatime': 'Mage',
  'fairy-tale-for-a-nightmare': 'Mage',
  'anti-magic-mask': 'Mage',
  'black-hand-of-the-goddess': 'Mage',
  'dignus-orb': 'Mage',
  'sir-purrgis-goggles': 'Mage',
  'radiant-forever': 'Mage',
  'bloody-rose': 'Mage',
  'barthezs-orb': 'Mage',
  'violin': 'Mage',

  // Soul Weaver
  'shimadra-staff': 'Soul Weaver',
  'celestine': 'Soul Weaver',
  'rod-of-amaryllis': 'Soul Weaver',
  'idels-cheer': 'Soul Weaver',
  'touch-of-rekos': 'Soul Weaver',
  'unfading-memories': 'Soul Weaver',
  'doctors-bag': 'Soul Weaver',
  'stella-harpa': 'Soul Weaver',
  'wondrous-potion-vial': 'Soul Weaver',
  'magarahas-tome': 'Soul Weaver',
  'guardian-ice-crystals': 'Soul Weaver',
  'sole-consolation': 'Soul Weaver',
  'water-origin': 'Soul Weaver',
  'waters-origin': 'Soul Weaver',
  'candlestick': 'Soul Weaver',
  'prophetic-candlestick': 'Soul Weaver',
  'maraharas-tome': 'Soul Weaver',
  'eternus': 'Soul Weaver',
  'snowy-crystal': 'Soul Weaver',

  // Common
  'daydream-joker': 'Common',
  'exorcists-tonfa': 'Common',
  'portrait-of-the-saviors': 'Common',
  'compass': 'Common',
  'labyrinth-cube': 'Common',
  'grail-of-blood': 'Common',
  'ancient-sheath': 'Common',
  'oath-key': 'Common',
  'alsacian-spear': 'Common',
  'mighty-yaksha': 'Common',
  'forest-totem': 'Common',
  '3f': 'Common'
};

function getArtifactClassRestriction(keyName, textContent = '') {
  const clean = (keyName || '').toLowerCase().trim();
  if (ARTIFACT_CLASS_MAP[clean]) {
    return ARTIFACT_CLASS_MAP[clean];
  }

  // Fallback regex keyword scanning if not explicitly mapped
  const text = textContent.toLowerCase();
  if (text.includes('knight exclusive') || text.includes('knight only') || text.includes('knight artifact')) return 'Knight';
  if (text.includes('warrior exclusive') || text.includes('warrior only') || text.includes('warrior artifact')) return 'Warrior';
  if (text.includes('thief exclusive') || text.includes('thief only') || text.includes('thief artifact')) return 'Thief';
  if (text.includes('ranger exclusive') || text.includes('ranger only') || text.includes('ranger artifact')) return 'Ranger';
  if (text.includes('mage exclusive') || text.includes('mage only') || text.includes('mage artifact')) return 'Mage';
  if (text.includes('soul weaver exclusive') || text.includes('soul weaver only') || text.includes('soul weaver artifact')) return 'Soul Weaver';

  return 'Common';
}

module.exports = {
  ARTIFACT_CLASS_MAP,
  getArtifactClassRestriction
};
