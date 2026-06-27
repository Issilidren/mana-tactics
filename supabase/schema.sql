-- =============================================================
-- Mana Tactics — schema.sql
-- Run this first in the Supabase SQL editor.
-- =============================================================


-- -------------------------------------------------------------
-- 1. TABLES
-- -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.cards (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  type        text        NOT NULL CHECK (type IN ('creature', 'spell', 'instant', 'sorcery', 'enchantment', 'artifact', 'land')),
  color       text        NOT NULL CHECK (color IN ('white', 'blue', 'black', 'red', 'green', 'colorless')),
  mana_cost   jsonb,
  power       int,
  toughness   int,
  rarity      text        NOT NULL CHECK (rarity IN ('common', 'uncommon', 'rare', 'mythic')),
  description text
);

CREATE TABLE IF NOT EXISTS public.decks (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  color       text        NOT NULL,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.deck_cards (
  id        uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id   uuid  NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
  card_id   uuid  NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  quantity  int   NOT NULL DEFAULT 1 CHECK (quantity BETWEEN 1 AND 3),
  UNIQUE (deck_id, card_id)
);


-- -------------------------------------------------------------
-- 2. UPDATED_AT TRIGGER (decks only)
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_decks_updated_at ON public.decks;

CREATE TRIGGER trg_decks_updated_at
  BEFORE UPDATE ON public.decks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();


-- -------------------------------------------------------------
-- 3. ROW-LEVEL SECURITY
-- -------------------------------------------------------------

ALTER TABLE public.cards      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deck_cards ENABLE ROW LEVEL SECURITY;


-- cards: authenticated users may only read
CREATE POLICY "cards: authenticated read"
  ON public.cards
  FOR SELECT
  TO authenticated
  USING (true);


-- decks: full CRUD on own rows only
CREATE POLICY "decks: select own"
  ON public.decks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "decks: insert own"
  ON public.decks
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "decks: update own"
  ON public.decks
  FOR UPDATE
  TO authenticated
  USING     (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "decks: delete own"
  ON public.decks
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- deck_cards: full CRUD where the parent deck belongs to the user
CREATE POLICY "deck_cards: select own"
  ON public.deck_cards
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = (SELECT user_id FROM public.decks WHERE id = deck_id)
  );

CREATE POLICY "deck_cards: insert own"
  ON public.deck_cards
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = (SELECT user_id FROM public.decks WHERE id = deck_id)
  );

CREATE POLICY "deck_cards: update own"
  ON public.deck_cards
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = (SELECT user_id FROM public.decks WHERE id = deck_id)
  )
  WITH CHECK (
    auth.uid() = (SELECT user_id FROM public.decks WHERE id = deck_id)
  );

CREATE POLICY "deck_cards: delete own"
  ON public.deck_cards
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = (SELECT user_id FROM public.decks WHERE id = deck_id)
  );


-- -------------------------------------------------------------
-- 4. PROGRESSION TABLES (run once — idempotent)
-- -------------------------------------------------------------

-- Fix deck_cards quantity constraint — lands have no copy limit
ALTER TABLE public.deck_cards DROP CONSTRAINT IF EXISTS deck_cards_quantity_check;
ALTER TABLE public.deck_cards ADD CONSTRAINT deck_cards_quantity_check CHECK (quantity >= 1);

CREATE TABLE IF NOT EXISTS public.player_profiles (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  gold       integer     NOT NULL DEFAULT 0,
  hp         integer     NOT NULL DEFAULT 10,
  seals      jsonb       NOT NULL DEFAULT '[]',
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.player_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles: own" ON public.player_profiles;
CREATE POLICY "profiles: own" ON public.player_profiles
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.shop_listings (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  gold_price integer     NOT NULL,
  available  boolean     NOT NULL DEFAULT true
);
ALTER TABLE public.shop_listings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "listings: read" ON public.shop_listings;
CREATE POLICY "listings: read" ON public.shop_listings FOR SELECT USING (true);

INSERT INTO public.shop_listings (name, gold_price)
SELECT 'Booster Pack', 50
WHERE NOT EXISTS (SELECT 1 FROM public.shop_listings WHERE name = 'Booster Pack');

CREATE TABLE IF NOT EXISTS public.purchases (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id   uuid        NOT NULL REFERENCES public.shop_listings(id),
  gold_spent   integer     NOT NULL,
  purchased_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "purchases: own" ON public.purchases;
CREATE POLICY "purchases: own" ON public.purchases
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Cards owned by each player (populated from starter pick + booster packs)
CREATE TABLE IF NOT EXISTS public.player_cards (
  id        uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   uuid    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id   uuid    NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  quantity  integer NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  UNIQUE (user_id, card_id)
);
ALTER TABLE public.player_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "player_cards: own" ON public.player_cards;
CREATE POLICY "player_cards: own" ON public.player_cards
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- All gold and HP change events (battles, shop, caretaker rest)
CREATE TABLE IF NOT EXISTS public.transactions (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type  text        NOT NULL,
  gold_delta  integer     NOT NULL DEFAULT 0,
  hp_delta    integer     NOT NULL DEFAULT 0,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "transactions: own" ON public.transactions;
CREATE POLICY "transactions: own" ON public.transactions
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
