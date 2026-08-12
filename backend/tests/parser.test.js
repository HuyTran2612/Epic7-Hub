const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { parseHeroPage, parseArtifactPage } = require('../scripts/parser');

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
