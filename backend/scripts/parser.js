const cheerio = require('cheerio');

/**
 * Parses Hero Detail HTML from epic7db.com
 */
function parseHeroPage(html, urlKey) {
  const $ = cheerio.load(html);

  const name = $('h1').first().text().trim() || urlKey;
  const key_name = urlKey.toLowerCase().replace(/[^a-z0-9-]/g, '');

  // Extract Element and Class from header description paragraph (e.g., "Dark Thief", "Fire Soul Weaver")
  const elemClassText = $('.description p').first().text().trim() || $('body').text();

  const elements = ['Dark', 'Light', 'Fire', 'Ice', 'Earth'];
  const classes = ['Soul Weaver', 'Warrior', 'Knight', 'Thief', 'Ranger', 'Mage'];

  let element = 'Fire';
  let heroClass = 'Warrior';

  for (const e of elements) {
    if (elemClassText.includes(e)) {
      element = e;
      break;
    }
  }
  for (const c of classes) {
    if (elemClassText.includes(c)) {
      heroClass = c;
      break;
    }
  }

  // Rarity from star container or meta description
  const metaDesc = $('meta[name="description"]').attr('content') || '';
  const starMatch = metaDesc.match(/(\d)\s*star/i);
  let rarity = starMatch ? parseInt(starMatch[1], 10) : ($('.star-container img').length || 5);

  // Extract Base Stats
  const bodyText = $('body').text();
  const statMatch = bodyText.match(/Attack:\s*(\d+)\s+Health:\s*(\d+)\s+Defense:\s*(\d+)\s+Speed:\s*(\d+)/i);

  const base_stats = {
    atk: statMatch ? parseInt(statMatch[1], 10) : 1000,
    hp: statMatch ? parseInt(statMatch[2], 10) : 5000,
    def: statMatch ? parseInt(statMatch[3], 10) : 500,
    spd: statMatch ? parseInt(statMatch[4], 10) : 110
  };

  // Image URL
  const heroImg = $('img[src*="/images/heroes/"]').first().attr('src');
  const image_url = heroImg ? (heroImg.startsWith('http') ? heroImg : `https://epic7db.com${heroImg}`) : `https://epic7db.com/images/heroes/${key_name}.webp`;

  // Description
  const description = metaDesc || `${name} is a ${rarity}-star ${element} ${heroClass} in Epic Seven.`;

  // Skills
  const skills = [];
  $('h2, h3, h4').each((_, elem) => {
    const text = $(elem).text().trim();
    if (text.includes("Skill") || text.startsWith("S1") || text.startsWith("S2") || text.startsWith("S3")) {
      const nextDesc = $(elem).next().text().trim();
      if (text && nextDesc) {
        skills.push({ name: text, desc: nextDesc });
      }
    }
  });

  return {
    key_name,
    name,
    element,
    class: heroClass,
    rarity,
    is_limited: false,
    base_stats,
    skills: skills.length > 0 ? skills : [{ name: 'Battle Skill', desc: `${name} battle skill.` }],
    recommended_builds: [{ set: 'Speed / Critical', main_stats: { neck: 'Crit Damage', ring: 'ATK%', boots: 'Speed' } }],
    image_url,
    description
  };
}

/**
 * Parses Artifact Detail HTML from epic7db.com
 */
function parseArtifactPage(html, urlKey) {
  const $ = cheerio.load(html);

  const name = $('h1').first().text().trim() || urlKey;
  const key_name = urlKey.toLowerCase().replace(/[^a-z0-9-]/g, '');

  const metaDesc = $('meta[name="description"]').attr('content') || '';
  const starMatch = metaDesc.match(/(\d)\s*star/i);
  let rarity = starMatch ? parseInt(starMatch[1], 10) : ($('.rarity img').length || 5);

  // Class restriction from .class img src/alt
  const classImgSrc = $('.class img').attr('src') || '';
  const classImgAlt = $('.class img').attr('alt') || '';
  const combinedClassStr = (classImgSrc + ' ' + classImgAlt).toLowerCase();

  const classList = [
    { key: 'soulweaver', name: 'Soul Weaver' },
    { key: 'soul-weaver', name: 'Soul Weaver' },
    { key: 'warrior', name: 'Warrior' },
    { key: 'knight', name: 'Knight' },
    { key: 'thief', name: 'Thief' },
    { key: 'ranger', name: 'Ranger' },
    { key: 'mage', name: 'Mage' }
  ];

  let class_restriction = 'Common';
  for (const c of classList) {
    if (combinedClassStr.includes(c.key)) {
      class_restriction = c.name;
      break;
    }
  }

  const baseDesc = $('.info .base p').first().text().trim();
  const maxDesc = $('.info .max p').first().text().trim();
  const skill_description = baseDesc || metaDesc || `${name} artifact in Epic Seven.`;
  const skill_max_description = maxDesc || skill_description;

  const baseAtk = parseInt($('.info .base .attack p').text().trim(), 10) || 15;
  const baseHp = parseInt($('.info .base .health p').text().trim(), 10) || 32;
  const maxAtk = parseInt($('.info .max .attack p').text().trim(), 10) || 273;
  const maxHp = parseInt($('.info .max .health p').text().trim(), 10) || 416;

  const artImg = $('img[src*="/images/artifacts/"]').first().attr('src');
  const image_url = artImg ? (artImg.startsWith('http') ? artImg : `https://epic7db.com${artImg}`) : `https://epic7db.com/images/artifacts/${key_name}.webp`;

  return {
    key_name,
    name,
    rarity,
    class_restriction,
    base_stats: { atk: baseAtk, hp: baseHp },
    max_stats: { atk: maxAtk, hp: maxHp },
    skill_description,
    skill_max_description,
    recommended_heroes: [],
    image_url
  };
}

module.exports = { parseHeroPage, parseArtifactPage };
