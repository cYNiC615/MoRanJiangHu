# Homebrew Dead Feature Registry

> Date: 2026-06-16
>
> Current-state registry only. Deleted feature families are not kept here as
> history; git history and the Phase 1 / Phase 1.5 notes cover that.

## Current State

Phase 1.5 final cleanup has removed the confirmed public-release, community,
mobile/native, auction, old battle UI/model, wuxia cultivation, fandom/original
adaptation, and novel-decomposition packages from reachable runtime surfaces.

This file now records only retired residue that still truly exists in the
workspace and should not be mistaken for Phase 2 retained-feature decisions.

## Current Live Residue

| Residue | Current Shape | Required Cleanup |
| --- | --- | --- |
| Old battle state shell | `components/features/Battle` and `models/battle.ts` are gone, and variable commands to the old `战斗` root are blocked. A shallow `战斗` state key, empty-state helpers, save/load plumbing, and some tests still exist as a compatibility shell. | When safe, delete the `战斗` state root from `useGame`, save/load, command processing, variable calibration, tests, and `types`; future conflict/opposition design must start from a new model. |
| Generic organization legacy naming | The retained initial-organization feature still uses historical names such as `开局生成门派`, `玩家组织`, and `详细门派结构` in schema and helper names. Active player role fields like old sect id/rank/contribution are no longer written. | Phase 2 must decide whether to keep, rename, or replace the organization subsystem. If renamed, migrate schema, prompts, save keys, UI copy, tests, and mode package data together. |
| Structured weather/festival field shell | AI commands to `环境.天气` and `环境.节日` are blocked, and prompts say weather/festivals are prose atmosphere only. `stateTransforms` and opening empty state still include structural placeholders. | Delete model/state placeholders and normalization once environment save shape is simplified. Image prompts may still mention weather as visual atmosphere. |

## Guardrail

If grep finds runtime code, model fields, storage keys, prompts, scripts,
static assets, or tests that still implement a deleted feature family, delete
that residue in the same cleanup slice and only keep a short current-state row
here while the residue exists.

Use `docs/homebrew-phase2-feature-audit-inventory.md` for retained-feature
audit work. Phase 2 should discuss features that remain after cleanup, not
reopen already deleted packages.
