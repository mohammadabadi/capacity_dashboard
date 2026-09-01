# Capacity Dashboard

Nuxt dashboard for classroom places. The API is raw data; used places and warnings are calculated here.

Live dashboard: [capacitydashboard.vercel.app](https://capacitydashboard.vercel.app/)

Requires Node 22.19 or another version supported by Nuxt, and pnpm 10.11 or newer.

```bash
pnpm install
pnpm dev
```

Run every non-mutating quality check with `pnpm check`. Individual scripts are
`test`, `lint`, `format`, `format:check`, `typecheck`, `build`, and `generate`.

## How it works

- `app/utils/capacity.ts` — month overlap, pairing rule, dashboard model
- `app/composables/useCapacityOverview.ts` — fetch, retry, cached data, and month state
- `app/pages/index.vue` — dashboard layout
- `app/components/RoomCard.vue` — one classroom

A 3-day and a 2-day enrolment share one place. An unpaired part-time enrolment still takes one place. Unassigned children are shown and not counted against a room.

The summary compares assigned headcount with places after pairing. Open places
are summed per room, so an over-capacity room does not reduce the open-place
count elsewhere. Rooms that are over capacity or have an age-group mismatch sit
first in each centre.

I assume an assignment only occupies a room if its dates overlap both the
reporting month and its enrolment.

## Trade-offs

No move/edit UI — the API is read-only. No chart library; a bar per room is enough. Next I would suggest rooms for unassigned children.

The fetch is client-side because the API supports CORS. This keeps data fresh
when deploying the output of `pnpm generate` to a static host. Use `pnpm build`
for a Nuxt server deployment.
