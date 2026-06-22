-- =============================================================
-- Mana Tactics — FULL GAME schema (DrawSQL diagram)
-- Import at drawsql.app → New Diagram → Import SQL
-- PostgreSQL dialect
-- =============================================================

-- ─── AUTH ─────────────────────────────────────────────────────────────────────
-- Supabase manages this — stubbed so FK arrows render

CREATE TABLE "users" (
  "id"         uuid    NOT NULL,
  "email"      varchar NOT NULL,
  PRIMARY KEY ("id")
);

-- ─── PLAYER ───────────────────────────────────────────────────────────────────

CREATE TABLE "player_profiles" (
  "id"             uuid    NOT NULL DEFAULT gen_random_uuid(),
  "user_id"        uuid    NOT NULL UNIQUE,
  "hp"             integer NOT NULL DEFAULT 20,
  "gold"           integer NOT NULL DEFAULT 0,
  "active_deck_id" uuid,               -- which deck is currently equipped
  "created_at"     timestamp NOT NULL DEFAULT now(),
  "updated_at"     timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);

-- ─── CARDS ────────────────────────────────────────────────────────────────────

CREATE TABLE "cards" (
  "id"          uuid    NOT NULL DEFAULT gen_random_uuid(),
  "name"        varchar NOT NULL,
  "type"        varchar NOT NULL,   -- creature | spell | enchantment | artifact | land
  "color"       varchar NOT NULL,   -- white | blue | black | red | green | colorless
  "mana_cost"   jsonb,              -- { "white": 2, "colorless": 1 }
  "power"       integer,            -- null for non-creatures
  "toughness"   integer,            -- null for non-creatures
  "abilities"   jsonb,              -- ["flying", "trample", ...]
  "rarity"      varchar NOT NULL,   -- common | uncommon | rare | mythic
  "description" text,
  "subtype"     varchar,            -- Angel | Dragon | Wizard | etc.
  "set_code"    varchar,            -- scryfall set abbreviation
  PRIMARY KEY ("id")
);

-- ─── DECKS ────────────────────────────────────────────────────────────────────

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
  "quantity" integer NOT NULL DEFAULT 1,  -- max 3 per card
  PRIMARY KEY ("id"),
  UNIQUE ("deck_id", "card_id"),
  FOREIGN KEY ("deck_id") REFERENCES "decks" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("card_id") REFERENCES "cards" ("id") ON DELETE CASCADE
);

-- wire active_deck_id now that decks exists
ALTER TABLE "player_profiles"
  ADD FOREIGN KEY ("active_deck_id") REFERENCES "decks" ("id") ON DELETE SET NULL;

-- ─── WORLD ────────────────────────────────────────────────────────────────────

CREATE TABLE "regions" (
  "id"           uuid    NOT NULL DEFAULT gen_random_uuid(),
  "key"          varchar NOT NULL UNIQUE,  -- white | blue | black | red | green
  "name"         varchar NOT NULL,         -- Solara Plains, Tidefall Isles, etc.
  "scene_key"    varchar NOT NULL,         -- Phaser scene key: ClubWhite, etc.
  "color_hex"    varchar NOT NULL,         -- UI accent color
  "reward_gold"  integer NOT NULL DEFAULT 50,
  "lore"         text,
  PRIMARY KEY ("id")
);

CREATE TABLE "clubs" (
  "id"           uuid    NOT NULL DEFAULT gen_random_uuid(),
  "region_id"    uuid    NOT NULL,
  "name"         varchar NOT NULL,         -- Solara Plains Club, etc.
  "archmage_name"varchar NOT NULL,
  "archmage_texture" varchar NOT NULL,     -- Phaser texture key
  PRIMARY KEY ("id"),
  FOREIGN KEY ("region_id") REFERENCES "regions" ("id") ON DELETE CASCADE
);

-- ─── NPCs ─────────────────────────────────────────────────────────────────────

CREATE TABLE "npcs" (
  "id"           uuid    NOT NULL DEFAULT gen_random_uuid(),
  "club_id"      uuid,                    -- null = Hub NPC
  "name"         varchar NOT NULL,
  "texture_key"  varchar NOT NULL,        -- Phaser sprite key
  "tile_x"       integer NOT NULL,
  "tile_y"       integer NOT NULL,
  "dialog"       jsonb   NOT NULL,        -- ["line 1", "line 2", ...]
  "is_archmage"  boolean NOT NULL DEFAULT false,
  "battle_color" varchar,                 -- which color deck they fight with
  "reward_gold"  integer NOT NULL DEFAULT 10,
  "tab_color"    varchar,                 -- hex for FFTA dialog name tab
  PRIMARY KEY ("id"),
  FOREIGN KEY ("club_id") REFERENCES "clubs" ("id") ON DELETE SET NULL
);

CREATE TABLE "npc_decks" (
  "id"      uuid    NOT NULL DEFAULT gen_random_uuid(),
  "npc_id"  uuid    NOT NULL,
  "card_id" uuid    NOT NULL,
  "quantity" integer NOT NULL DEFAULT 1,
  PRIMARY KEY ("id"),
  UNIQUE ("npc_id", "card_id"),
  FOREIGN KEY ("npc_id") REFERENCES "npcs" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("card_id") REFERENCES "cards" ("id") ON DELETE CASCADE
);

-- ─── PLAYER PROGRESSION ───────────────────────────────────────────────────────

CREATE TABLE "player_seals" (
  "id"         uuid      NOT NULL DEFAULT gen_random_uuid(),
  "user_id"    uuid      NOT NULL,
  "region_id"  uuid      NOT NULL,
  "earned_at"  timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("user_id", "region_id"),
  FOREIGN KEY ("user_id")   REFERENCES "users"   ("id") ON DELETE CASCADE,
  FOREIGN KEY ("region_id") REFERENCES "regions" ("id") ON DELETE CASCADE
);

-- ─── BATTLES ──────────────────────────────────────────────────────────────────

CREATE TABLE "battles" (
  "id"          uuid      NOT NULL DEFAULT gen_random_uuid(),
  "user_id"     uuid      NOT NULL,
  "npc_id"      uuid      NOT NULL,
  "deck_id"     uuid      NOT NULL,         -- snapshot of which deck was used
  "result"      varchar   NOT NULL,         -- win | loss | draw
  "turns"       integer   NOT NULL DEFAULT 0,
  "gold_earned" integer   NOT NULL DEFAULT 0,
  "hp_delta"    integer   NOT NULL DEFAULT 0,   -- negative = damage taken
  "created_at"  timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  FOREIGN KEY ("user_id") REFERENCES "users"  ("id") ON DELETE CASCADE,
  FOREIGN KEY ("npc_id")  REFERENCES "npcs"   ("id") ON DELETE CASCADE,
  FOREIGN KEY ("deck_id") REFERENCES "decks"  ("id") ON DELETE CASCADE
);

CREATE TABLE "battle_events" (
  "id"         uuid    NOT NULL DEFAULT gen_random_uuid(),
  "battle_id"  uuid    NOT NULL,
  "turn"       integer NOT NULL,
  "event_type" varchar NOT NULL,    -- play_card | attack | block | draw | end_turn
  "actor"      varchar NOT NULL,    -- player | npc
  "card_id"    uuid,                -- card involved (null for non-card events)
  "payload"    jsonb,               -- damage dealt, targets, etc.
  PRIMARY KEY ("id"),
  FOREIGN KEY ("battle_id") REFERENCES "battles" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("card_id")   REFERENCES "cards"   ("id") ON DELETE SET NULL
);

-- ─── SHOP / ECONOMY ───────────────────────────────────────────────────────────

CREATE TABLE "shop_listings" (
  "id"          uuid    NOT NULL DEFAULT gen_random_uuid(),
  "card_id"     uuid    NOT NULL,
  "gold_price"  integer NOT NULL,
  "stock"       integer,           -- null = unlimited
  "available"   boolean NOT NULL DEFAULT true,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("card_id") REFERENCES "cards" ("id") ON DELETE CASCADE
);

CREATE TABLE "purchases" (
  "id"          uuid      NOT NULL DEFAULT gen_random_uuid(),
  "user_id"     uuid      NOT NULL,
  "listing_id"  uuid      NOT NULL,
  "gold_spent"  integer   NOT NULL,
  "purchased_at"timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  FOREIGN KEY ("user_id")    REFERENCES "users"          ("id") ON DELETE CASCADE,
  FOREIGN KEY ("listing_id") REFERENCES "shop_listings"  ("id") ON DELETE CASCADE
);
