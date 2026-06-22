-- =============================================================
-- Mana Tactics — DrawSQL diagram schema
-- Import this at drawsql.app → New Diagram → Import SQL
-- PostgreSQL dialect
-- =============================================================

-- Supabase manages this table — stubbed here so the FK renders
CREATE TABLE "users" (
  "id"    uuid        NOT NULL,
  "email" varchar     NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE "cards" (
  "id"          uuid        NOT NULL DEFAULT gen_random_uuid(),
  "name"        varchar     NOT NULL,
  "type"        varchar     NOT NULL,   -- creature | spell | enchantment | artifact
  "color"       varchar     NOT NULL,   -- white | blue | black | red | green | colorless
  "mana_cost"   jsonb,                  -- { "white": 2, "colorless": 1 }
  "power"       integer,                -- null for non-creatures
  "toughness"   integer,                -- null for non-creatures
  "rarity"      varchar     NOT NULL,   -- common | uncommon | rare | mythic
  "description" text,
  PRIMARY KEY ("id")
);

CREATE TABLE "decks" (
  "id"          uuid        NOT NULL DEFAULT gen_random_uuid(),
  "user_id"     uuid        NOT NULL,
  "name"        varchar     NOT NULL,
  "color"       varchar     NOT NULL,
  "description" text,
  "created_at"  timestamp   NOT NULL DEFAULT now(),
  "updated_at"  timestamp   NOT NULL DEFAULT now(),
  PRIMARY KEY ("id"),
  FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE
);

CREATE TABLE "deck_cards" (
  "id"       uuid    NOT NULL DEFAULT gen_random_uuid(),
  "deck_id"  uuid    NOT NULL,
  "card_id"  uuid    NOT NULL,
  "quantity" integer NOT NULL DEFAULT 1,  -- 1–3 max per card per deck
  PRIMARY KEY ("id"),
  UNIQUE ("deck_id", "card_id"),
  FOREIGN KEY ("deck_id") REFERENCES "decks" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("card_id") REFERENCES "cards" ("id") ON DELETE CASCADE
);
