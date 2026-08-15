CREATE DATABASE IF NOT EXISTS epic7_personal;
USE epic7_personal;

-- Clear existing data
DELETE FROM user_notes;
DELETE FROM hero_artifact_recommendations;
DELETE FROM artifacts;
DELETE FROM heroes;
DELETE FROM sync_logs;

-- Seed Heroes
INSERT INTO heroes (key_name, name, element, class, rarity, is_limited, base_stats, skills, recommended_builds, image_url, description) VALUES
(
  'arbiter-vildred',
  'Arbiter Vildred',
  'Dark',
  'Thief',
  5,
  FALSE,
  '{"atk": 1283, "hp": 5138, "spd": 116, "def": 522}',
  '[{"name": "Sweep", "desc": "Attacks two enemies with a swordstorm, with a 50% chance to decrease Combat Readiness by 15%."}, {"name": "Dark Contract", "desc": "Gains 100% Fighting Spirit upon death, reviving with full HP."}, {"name": "Dark Blade", "desc": "Attacks all enemies with a dark blade."}]',
  '[{"set": "Speed / Critical", "main_stats": {"neck": "Crit Damage", "ring": "ATK%", "boots": "Speed"}}]',
  'https://epic7db.com/images/heroes/arbiter-vildred.webp',
  'A fallen hero obsessed with hatred.'
),
(
  'tamarinne',
  'Tamarinne',
  'Fire',
  'Soul Weaver',
  5,
  FALSE,
  '{"atk": 957, "hp": 4370, "spd": 105, "def": 652}',
  '[{"name": "Singing Voice", "desc": "Heals the ally with the lowest HP."}, {"name": "Shining Star", "desc": "Transforms into idol mode, cleansing all debuffs."}]',
  '[{"set": "Speed / Immunity", "main_stats": {"neck": "HP%", "ring": "HP%", "boots": "Speed"}}]',
  'https://epic7db.com/images/heroes/tamarinne.webp',
  'A famous idol in Ritania.'
),
(
  'brieg',
  'Brieg',
  'Ice',
  'Knight',
  5,
  FALSE,
  '{"atk": 839, "hp": 6405, "spd": 100, "def": 752}',
  '[{"name": "Shield Bash", "desc": "Attacks an enemy and grants a barrier."}, {"name": "Judgment", "desc": "Decreases Defense of all enemies for 2 turns."}]',
  '[{"set": "Speed / Hit", "main_stats": {"neck": "HP%", "ring": "Effectiveness", "boots": "Speed"}}]',
  'https://epic7db.com/images/heroes/brieg.webp',
  'Commander of the Shadow Elves.'
);

-- Seed Artifacts
INSERT INTO artifacts (key_name, name, rarity, class_restriction, base_stats, max_stats, skill_description, skill_max_description, image_url) VALUES
(
  'alexas-basket',
  'Alexa\'s Basket',
  5,
  'Thief',
  '{"atk": 21, "hp": 32}',
  '{"atk": 273, "hp": 416}',
  '35% chance to grant increased Attack for 1 turn and 20% chance to grant Greater Attack.',
  '70% chance to grant increased Attack for 1 turn and 40% chance to grant Greater Attack.',
  'https://epic7db.com/images/artifacts/alexas-basket.webp'
),
(
  'daydream-joker',
  'Daydream Joker',
  3,
  'General',
  '{"atk": 16, "hp": 14}',
  '{"atk": 208, "hp": 182}',
  'Increases damage dealt by 1.5% of the enemy\'s max Health when attacking.',
  'Increases damage dealt by 3% of the enemy\'s max Health when attacking.',
  'https://epic7db.com/images/artifacts/daydream-joker.webp'
);

-- Seed Recommendations
INSERT INTO hero_artifact_recommendations (hero_id, artifact_id, priority, note)
SELECT h.id, a.id, 1, 'Best in slot for PvP cleave'
FROM heroes h, artifacts a
WHERE h.key_name = 'arbiter-vildred' AND a.key_name = 'alexas-basket';

INSERT INTO hero_artifact_recommendations (hero_id, artifact_id, priority, note)
SELECT h.id, a.id, 1, 'Mandatory for PvE Exp / Hunt'
FROM heroes h, artifacts a
WHERE h.key_name = 'brieg' AND a.key_name = 'daydream-joker';

-- Seed User Notes
INSERT INTO user_notes (target_type, target_id, note, personal_tier, category, priority)
SELECT 'hero', id, 'Core cleaver for Arena and Dog Walking', 'S', 'general', 10
FROM heroes WHERE key_name = 'arbiter-vildred';

INSERT INTO user_notes (target_type, target_id, note, personal_tier, category, priority)
SELECT 'hero', id, 'PVE Queen for Abyss and Raid', 'S', 'pve', 9
FROM heroes WHERE key_name = 'tamarinne';

-- Seed Sync Log
INSERT INTO sync_logs (type, status, message, records_affected) VALUES
('full', 'success', 'Initial seed data populated successfully.', 5);
