-- =============================================================
-- Mana Tactics — PART 2 of 2 (DrawSQL)
-- Game systems: NPCs, progression, battles, shop
-- 7 tables (+ stubs for Part 1 tables so FK arrows render)
-- =============================================================

-- ── Stubs (defined in Part 1) ─────────────────────────────────────────────────

CREATE TABLE "users"   ("id" uuid NOT NULL, PRIMARY KEY ("id"));
CREATE TABLE "cards"   ("id" uuid NOT NULL, PRIMARY KEY ("id"));
CREATE TABLE "decks"   ("id" uuid NOT NULL, PRIMARY KEY ("id"));
CREATE TABLE "regions" ("id" uuid NOT NULL, PRIMARY KEY ("id"));
CREATE TABLE "clubs"   ("id" uuid NOT NULL, PRIMARY KEY ("id"));

-- ── NPCs ──────────────────────────────────────────────────────────────────────

CREATE TABLE "npcs" (
  "id"           uuid    NOT NULL DEFAULT gen_random_uuid(),
  "club_id"      uuid,
  "name"         varchar NOT NULL,
  "texture_key"  varchar NOT NULL,
  "tile_x"       integer NOT NULL,
  "tile_y"       integer NOT NULL,
  "dialog"       jsonb   NOT NULL,
  "is_archmage"  boolean NOT NULL DEFAULT false,
  "battle_color" varchar,
  "reward_gold"  integer NOT NULL DEFAULT 10,
  "tab_color"    varchar,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("club_id") REFERENCES "clubs" ("id") ON DELETE SET NULL
);

CREATE TABLE "npc_decks" (
  "id"       uuid    NOT NULL DEFAULT gen_random_uuid(),
  "npc_id"   uuid    NOT NULL,
  "card_id"  uuid    NOT NULL,
  "quantity" integer NOT NULL DEFAULT 1,
  PRIMARY KEY ("id"),
  UNIQUE ("npc_id", "card_id"),
  FOREIGN KEY ("npc_id")  REFERENCES "npcs"  ("id") ON DELETE CASCADE,
  FOREIGN KEY ("card_id") REFERENCES "cards" ("id") ON DELETE CASCADE
);

-- ── Progression ───────────────────────────────────────────────────────────────

CREATE TABLE "player_seals" (
  "id"        uuid      NOT NULL DEFAULT gen_random_uuid(),
  "user_id"   uuid      NOT NULL,
  "region_id" uuid      NOT NULL,
  "earned_at" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  UNIQUE ("user_id", "region_id"),
  FOREIGN KEY ("user_id")   REFERENCES "users"   ("id") ON DELETE CASCADE,
  FOREIGN KEY ("region_id") REFERENCES "regions" ("id") ON DELETE CASCADE
);

-- ── Battles ───────────────────────────────────────────────────────────────────

CREATE TABLE "battles" (
  "id"          uuid      NOT NULL DEFAULT gen_random_uuid(),
  "user_id"     uuid      NOT NULL,
  "npc_id"      uuid      NOT NULL,
  "deck_id"     uuid      NOT NULL,
  "result"      varchar   NOT NULL,
  "turns"       integer   NOT NULL DEFAULT 0,
  "gold_earned" integer   NOT NULL DEFAULT 0,
  "hp_delta"    integer   NOT NULL DEFAULT 0,
  "created_at"  timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("npc_id")  REFERENCES "npcs"  ("id") ON DELETE CASCADE,
  FOREIGN KEY ("deck_id") REFERENCES "decks" ("id") ON DELETE CASCADE
);

CREATE TABLE "battle_events" (
  "id"         uuid    NOT NULL DEFAULT gen_random_uuid(),
  "battle_id"  uuid    NOT NULL,
  "turn"       integer NOT NULL,
  "event_type" varchar NOT NULL,
  "actor"      varchar NOT NULL,
  "card_id"    uuid,
  "payload"    jsonb,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("battle_id") REFERENCES "battles" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("card_id")   REFERENCES "cards"   ("id") ON DELETE SET NULL
);

-- ── Shop ──────────────────────────────────────────────────────────────────────

CREATE TABLE "shop_listings" (
  "id"         uuid    NOT NULL DEFAULT gen_random_uuid(),
  "card_id"    uuid    NOT NULL,
  "gold_price" integer NOT NULL,
  "stock"      integer,
  "available"  boolean NOT NULL DEFAULT true,
  PRIMARY KEY ("id"),
  FOREIGN KEY ("card_id") REFERENCES "cards" ("id") ON DELETE CASCADE
);

CREATE TABLE "purchases" (
  "id"           uuid      NOT NULL DEFAULT gen_random_uuid(),
  "user_id"      uuid      NOT NULL,
  "listing_id"   uuid      NOT NULL,
  "gold_spent"   integer   NOT NULL,
  "purchased_at" timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  FOREIGN KEY ("user_id")    REFERENCES "users"         ("id") ON DELETE CASCADE,
  FOREIGN KEY ("listing_id") REFERENCES "shop_listings" ("id") ON DELETE CASCADE
);
