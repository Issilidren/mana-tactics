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
  type        text        NOT NULL CHECK (type IN ('creature', 'spell', 'enchantment', 'artifact')),
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
