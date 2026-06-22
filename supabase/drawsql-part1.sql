-- =============================================================
-- Mana Tactics — PART 1 of 2 (DrawSQL)
-- Foundation: auth, player, cards, decks, world structure
-- 7 tables
-- =============================================================

CREATE TABLE "users" (
  "id"         uuid    NOT NULL,
  "email"      varchar NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE "player_profiles" (
  "id"             uuid      NOT NULL DEFAULT gen_random_uuid(),
  "user_id"        uuid      NOT NULL UNIQUE,
  "hp"             integer   NOT NULL DEFAULT 20,
  "gold"           integer   NOT NULL DEFAULT 0,
  "active_deck_id" uuid,
  "created_at"     timestamp NOT NULL DEFAULT now(),
  "updated_at"     timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);

CREATE TABLE "cards" (
  "id"          uuid    NOT NULL DEFAULT gen_random_uuid(),
  "name"        varchar NOT NULL,
  "type"        varchar NOT NULL,
  "color"       varchar NOT NULL,
  "mana_cost"   jsonb,
  "power"       integer,
  "toughness"   integer,
  "abilities"   jsonb,
  "rarity"      varchar NOT NULL,
  "description" text,
  "subtype"     varchar,
  "set_code"    varchar,
  PRIMARY KEY ("id")
);

CREATE TABLE "decks" (
  "id"          uuid      NOT NULL DEFAULT gen_random_uuid(),
  "user_id"     uuid      NOT NULL,
  "name"        varchar   NOT NULL,
  "color"       varchar   NOT NULL,
  "description" text,
  "created_at"  timestamp NOT NULL DEFAULT now(),
  "updated_at"  timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);

CREATE TABLE "deck_cards" (
  "id"       uuid    NOT NULL DEFAULT gen_random_uuid(),
  "deck_id"  uuid    NOT NULL,
  "card_id"  uuid    NOT NULL,
  "quantity" integer NOT NULL DEFAULT 1,
  PRIMARY KEY ("id"),
  UNIQUE ("deck_id", "card_id"),
  FOREIGN KEY ("deck_id") REFERENCES "decks" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("card_id") REFERENCES "cards" ("id") ON DELETE CASCADE
);

CREATE TABLE "regions" (
  "id"          uuid    NOT NULL DEFAULT gen_random_uuid(),
  "key"         varchar NOT NULL UNIQUE,
  "name"        varchar NOT NULL,
  "scene_key"   varchar NOT NULL,
  "color_hex"   varchar NOT NULL,
  "reward_gold" integer NOT NULL DEFAULT 50,
  "lore"        text,
  PRIMARY KEY ("id")
);

CREATE TABLE "clubs" (
  "id"               uuid    NOT NULL DEFAULT gen_random_uuid(),
  "region_id"        uuid    NOT NULL,
  "name"             varchar NOT NULL,
  "archmage_name"    varchar NOT NULL,
  "archmage_texture" varchar NOT NULL,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("region_id") REFERENCES "regions" ("id") ON DELETE CASCADE
);
