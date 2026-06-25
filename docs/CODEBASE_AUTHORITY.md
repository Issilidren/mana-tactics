# ⚠️ Codebase Authority & Integration Rules

**Last Updated:** June 2025
**Status:** ACTIVE — All contributors must follow these rules.

---

## The Problem This Solves

Previous integration attempts cherry-picked or overrode Tasklet's patches — keeping older/broken versions of files, reverting sprite fixes, ignoring tile integration, and producing visual output that contradicted the project's stated art direction (FFTA/GBA-style).

**This stops now.**

---

## Rules for Any AI Agent Working on This Repo

### 1. Do Not Override Tasklet's Visual Fixes

The following files have been specifically patched for sprite scale, tile rendering, NPC physics, and furniture drawing. **Do not revert, replace, or "keep ours" on these files without Kenny's explicit approval:**

- `src/game/scenes/HubScene.js` — FFTA tiles, NPC physics bodies, furniture rendering, sprite scale
- `src/game/scenes/ClubScene.js` — NPC sprite scaling, physics colliders
- `src/game/scenes/ArchivesScene.js` — NPC physics, sprite scaling
- `src/game/scenes/BootScene.js` — Asset loading for tiles, sprites, card art
- `src/game/systems/CardEngine.js` — MTG-compliant combat math, Main Phase 2, sorcery timing
- `src/game/BattleScreen.jsx` — Main Phase 2 UI support, card art integration

### 2. Sprite Scale Is Fixed — Don't Touch It

| Element | Display Size | Why |
|---------|-------------|-----|
| Player | 30 × 48 | Matches GBA-scale character on 32px tile grid |
| NPCs | 28 × 44 | Slightly smaller than player, consistent regardless of source sprite dimensions |
| Dialog Portraits | 56 × 110 | Fits the dialog box without explosion |

**Never use `setScale()` on sprites with mixed source dimensions.** Always use `setDisplaySize()` to force a consistent pixel size.

### 3. The Visual Target Is FFTA — Not RPG Maker

Every visual decision must be evaluated against this question:

> *"Does this look like it belongs in Final Fantasy Tactics Advance on a GBA?"*

If the answer is "no" — if it looks flat, top-down, has rainbow-colored bookshelves, uses placeholder rectangles, or feels like RPG Maker — it does not ship.

Reference:
- Warm stone tiles, not flat tan
- Crimson carpet runners, not colored rectangles
- Mana-crystal bookshelves, not rainbow blocks
- Ornate pillars and furniture, not empty rooms
- Class banners with depth, not flat colored strips

### 4. Don't Cherry-Pick Patches

When merging Tasklet's patches:
- **Take the full patch.** Don't selectively keep "ours" on files that have already been fixed.
- If there's a genuine conflict, resolve it by keeping the version with correct sprite scaling and tile integration — not the older/simpler version.
- If unsure, ask Kenny before merging.

### 5. MTG Rules Are Settled

The CardEngine has been audited and patched for MTG compliance. These behaviors are correct and must not be reverted:

- **Main Phase 2** exists after combat — players can cast creatures/sorceries/lands
- **Sorceries** can only be cast during your own Main Phase (1 or 2)
- **Deathtouch** makes any damage lethal (1 damage kills, not power = toughness)
- **Deathtouch + Trample** only needs 1 damage assigned to blocker; rest tramples
- **Lifelink** heals once based on total damage dealt (no double-healing with trample)
- **First Strike** has proper two-step damage resolution
- **Flying** validation happens at block declaration AND during damage resolution

### 6. Don't Add Windows Path Garbage

Any file path containing `C:\Users\` or backslashes is a Windows artifact and must not be committed. The repo has been cleaned of these. Keep it clean.

---

## File Ownership Quick Reference

| File | Authority | Notes |
|------|-----------|-------|
| `HubScene.js` | Tasklet | Tiles, furniture, NPC physics, sprite scale |
| `ClubScene.js` | Tasklet | NPC scale, physics |
| `ArchivesScene.js` | Tasklet | NPC physics, scale |
| `BootScene.js` | Tasklet | Asset pipeline |
| `CardEngine.js` | Tasklet | MTG rules, combat math |
| `BattleScreen.jsx` | Tasklet | Phase support, card art |
| `WorldMapScene.js` | Open | Region definitions, seal logic |
| `ShopOverlay.jsx` | Open | Shop UI |
| `aiDecks.js` | Open | Card/deck data |
| `README.md` | Kenny | Game documentation |
| `CREDITS.md` | Kenny | Collaborator credits |

**"Open"** means any contributor can modify. **"Tasklet"** means changes require preserving the existing fixes; additive changes are fine, reversions are not.

---

## Summary

> Build on what's here. Don't replace it. Don't "keep ours" over fixed code. If you wouldn't ship it on a GBA cartridge, don't ship it here.

---

*This document is maintained by Kenny Abadia Castellano and Tasklet.*
