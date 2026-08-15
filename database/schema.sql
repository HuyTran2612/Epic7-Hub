CREATE DATABASE IF NOT EXISTS epic7_personal;
USE epic7_personal;

DROP TABLE IF EXISTS sync_logs;
DROP TABLE IF EXISTS user_notes;
DROP TABLE IF EXISTS hero_artifact_recommendations;
DROP TABLE IF EXISTS artifacts;
DROP TABLE IF EXISTS heroes;

-- Bảng Heroes
CREATE TABLE heroes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  key_name VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  element ENUM('Fire','Ice','Earth','Light','Dark') NOT NULL,
  class ENUM('Warrior','Knight','Thief','Ranger','Mage','Soul Weaver') NOT NULL,
  rarity TINYINT NOT NULL,
  is_limited BOOLEAN DEFAULT FALSE,
  base_stats JSON,
  skills JSON,
  exclusive_equipment JSON,
  recommended_builds JSON,
  image_url VARCHAR(500),
  full_artwork_url VARCHAR(500),
  description TEXT,
  last_synced_at DATETIME,
  content_hash VARCHAR(64) NULL,
  source_flags JSON NULL COMMENT 'list of sources that contributed to this record',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_heroes_element_class (element, class),
  INDEX idx_heroes_rarity (rarity),
  INDEX idx_heroes_limited (is_limited),
  INDEX idx_heroes_key (key_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Artifacts
CREATE TABLE artifacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  key_name VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(150) NOT NULL,
  rarity TINYINT NOT NULL,
  is_limited BOOLEAN DEFAULT FALSE,
  class_restriction VARCHAR(50) DEFAULT 'Common',
  base_stats JSON,
  max_stats JSON,
  skill_description TEXT,
  skill_max_description TEXT,
  recommended_heroes JSON,
  image_url VARCHAR(500),
  full_artwork_url VARCHAR(500),
  last_synced_at DATETIME,
  content_hash VARCHAR(64) NULL,
  source_flags JSON NULL COMMENT 'list of sources that contributed to this record',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_artifacts_rarity_class (rarity, class_restriction),
  INDEX idx_artifacts_limited (is_limited),
  INDEX idx_artifacts_key (key_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Quan hệ Hero - Artifact Recommendation
CREATE TABLE hero_artifact_recommendations (
  hero_id INT NOT NULL,
  artifact_id INT NOT NULL,
  priority TINYINT DEFAULT 1,
  note VARCHAR(255),
  PRIMARY KEY (hero_id, artifact_id),
  FOREIGN KEY (hero_id) REFERENCES heroes(id) ON DELETE CASCADE,
  FOREIGN KEY (artifact_id) REFERENCES artifacts(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ghi chú cá nhân & Tier List
CREATE TABLE user_notes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  target_type ENUM('hero','artifact') NOT NULL,
  target_id INT NOT NULL,
  note TEXT,
  personal_tier ENUM('S','A','B','C','D') NULL,
  category VARCHAR(32) DEFAULT 'general',
  priority TINYINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_target (target_type, target_id),
  INDEX idx_personal_tier (personal_tier),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Log sync dữ liệu
CREATE TABLE sync_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('heroes','artifacts','full') NOT NULL,
  status ENUM('success','failed','partial') NOT NULL,
  message TEXT,
  records_affected INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sync_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng conflict log khi multi-source bất đồng nhau
CREATE TABLE IF NOT EXISTS sync_conflicts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  entity_type ENUM('hero','artifact') NOT NULL,
  key_name VARCHAR(100) NOT NULL,
  field_name VARCHAR(80) NOT NULL,
  source_a VARCHAR(50) NOT NULL,
  value_a JSON,
  source_b VARCHAR(50) NOT NULL,
  value_b JSON,
  resolution VARCHAR(30) NULL COMMENT 'kept_a | kept_b | merged | ignored',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_conflict_entity (entity_type, key_name),
  INDEX idx_conflict_unresolved (resolution)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
