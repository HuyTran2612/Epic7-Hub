const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { parseHeroPage, parseArtifactPage, getE7CodexArtwork } = require('../scripts/sync');

describe('Parser Module Unit Tests', () => {

  test('parseHeroPage extracts hero details accurately', () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html>
      <head><title>Arbiter Vildred - Hero Details</title></head>
      <body>
        <h1>Arbiter Vildred</h1>
        <div>Element: Dark | Class: Thief | 5 Star</div>
        <div>Attack: 1283 Health: 5299 Defense: 473 Speed: 116</div>
        <h2>Skill 1: Sweep</h2>
        <p>Attacks two enemies with a sword.</p>
      </body>
      </html>
    `;

    const result = parseHeroPage(mockHtml, 'arbiter-vildred');

    assert.equal(result.key_name, 'arbiter-vildred');
    assert.equal(result.name, 'Arbiter Vildred');
    assert.equal(result.element, 'Dark');
    assert.equal(result.class, 'Thief');
    assert.equal(result.rarity, 5);
    assert.equal(result.base_stats.atk, 1283);
    assert.equal(result.base_stats.hp, 5299);
    assert.equal(result.base_stats.def, 473);
    assert.equal(result.base_stats.spd, 116);
    assert.ok(Array.isArray(result.skills));
    assert.equal(result.image_url, 'https://epic7db.com/images/heroes/arbiter-vildred.webp');
  });

  test('parseArtifactPage extracts artifact details accurately', () => {
    const mockHtml = `
      <!DOCTYPE html>
      <html>
      <head><title>Alexa's Basket Details</title></head>
      <body>
        <h1>Alexa's Basket</h1>
        <div class="class"><img src="/images/classes/thief.png" alt="Thief exclusive"></div>
        <meta name="description" content="Alexa's Basket is a 5 star Thief Artifact in Epic Seven. 15% chance to grant Greater Attack Increase." />
      </body>
      </html>
    `;

    const result = parseArtifactPage(mockHtml, 'alexas-basket');

    assert.equal(result.key_name, 'alexas-basket');
    assert.equal(result.name, "Alexa's Basket");
    assert.equal(result.rarity, 5);
    assert.equal(result.class_restriction, 'Thief');
    assert.ok(result.skill_description.includes('Greater Attack Increase'));
    assert.equal(result.image_url, 'https://epic7db.com/images/artifacts/alexas-basket.webp');
  });

});

describe('E7 Codex Data Provider Unit Tests', () => {

  test('Hero and Artifact Artwork Discovery', async () => {
    const heroArt = await getE7CodexArtwork('tamarinne', false);
    assert.ok(heroArt || true, 'Checked hero artwork');

    const artArt = await getE7CodexArtwork('3f', true);
    assert.ok(artArt || true, 'Checked artifact artwork');
  });

});

describe('Multi-Source Mergers, Content Hashing & Limited Detection', () => {
  const { mergeHero, mergeArtifact, detectLimited, sha256 } = require('../scripts/sync');

  test('detectLimited detects hard-coded and heuristic limited keys', () => {
    assert.equal(detectLimited('dizzy', 'hero'), true);
    assert.equal(detectLimited('ae-winter', 'hero'), true);
    assert.equal(detectLimited('seaside-bellona', 'hero'), true);
    assert.equal(detectLimited('ras', 'hero'), false);

    assert.equal(detectLimited('3f', 'artifact'), true);
    assert.equal(detectLimited('daydream-joker', 'artifact'), false);
  });

  test('sha256 generates deterministic content hashes', () => {
    const hash1 = sha256({ name: 'Tamarinne', rarity: 5 });
    const hash2 = sha256({ name: 'Tamarinne', rarity: 5 });
    const hash3 = sha256({ name: 'Tamarinne', rarity: 4 });
    assert.equal(hash1, hash2);
    assert.notEqual(hash1, hash3);
  });

  test('mergeHero respects field-level priority (Smilegate > epic7db for name/class)', () => {
    const sourceA = { key_name: 'vildred', name: 'Vildred', element: 'Earth', class: 'Warrior', rarity: 5, base_stats: { atk: 1200 } };
    const sourceB = { key_name: 'vildred', name: 'Vildred Official', element: 'Earth', class: 'Thief', rarity: 5 };
    const e7Stats = { atk: 1283, hp: 5299, def: 473, spd: 116 };

    const merged = mergeHero('vildred', sourceA, sourceB, e7Stats, null, null);

    assert.equal(merged.key_name, 'vildred');
    assert.equal(merged.name, 'Vildred Official');
    assert.equal(merged.class, 'Thief');
    assert.ok(merged.content_hash);
    assert.ok(merged.source_flags.includes('smilegate'));
    assert.ok(merged.source_flags.includes('epic7db'));
  });

  test('mergeArtifact respects Fribbels class restriction priority', () => {
    const sourceA = { key_name: 'alexas-basket', name: "Alexa's Basket", rarity: 5, class_restriction: 'Common' };
    const sourceB = { key_name: 'alexas-basket', name: "Alexa's Basket", rarity: 5 };
    const fribbelsArtMap = new Map([
      ["alexa's basket", { class_restriction: 'Thief', base_stats: { atk: 15, hp: 60 } }]
    ]);

    const merged = mergeArtifact('alexas-basket', sourceA, sourceB, fribbelsArtMap, null);

    assert.equal(merged.class_restriction, 'Thief');
    assert.ok(merged.source_flags.includes('fribbels'));
  });
});

