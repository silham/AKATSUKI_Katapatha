# Katapatha

**Team AKATSUKI · Katapatha**

Delivery coordination for Waypoint Group. One delivery operation, four
role-specific workspaces: **dispatcher**, **loader**, **driver** and **store
manager**, plus an **admin** who keeps the accounts, outlets and vehicles.
Every decision on the way from order to receipt carries its reason, and every
role sees the part of the same record that is theirs to act on. *Katapatha*
means mirror: one delivery story, seen from several sides.

Three apps over one shared, contract-governed API.

| App | Serves | Stack |
|---|---|---|
| `apps/api` | every client; the contract authority | Fastify 5 + Zod/AJV + Prisma, PostgreSQL 17 |
| `apps/web` | dispatcher, loader, store and admin consoles, **and** the driver mobile web | Next.js 16 |
| `apps/mobile` | the driver native app, with an offline outbox (optional) | Expo / React Native |

**Live:** **https://katapatha.silham.dev**. Sign in with the staff IDs and PINs
[below](#sign-in). The `/access` shortcut is switched off there.

**Contents:** [Run it](#run-it) · [Sign in](#sign-in) ·
[Judge walkthrough](#judge-walkthrough) ·
[Changes since the Designathon design](#changes-since-the-designathon-design) ·
[Check it](#check-it) · [Docs](#where-to-read-next)

## Run it

Requires Node 24 (`.nvmrc`), pnpm 12 and Docker.

```bash
pnpm install                    # see the note below if this is slow
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
pnpm db:up                      # Postgres 17 in Docker
pnpm demo:reset --yes           # migrate + seed a clean demo database
pnpm dev                        # api on :3001, web on :3000
```

Open **http://localhost:3000**. Every environment variable the repo reads is
listed, with its default, in [.env.example](.env.example).

> **First install is large.** The Expo native packages are about 90 MB, so a
> first `pnpm install` can take a long time on a slow connection. To judge the
> web product only, skip them:
> `pnpm install --filter @katapatha/api... --filter @katapatha/web...`
> [docs/RUNNING.md](docs/RUNNING.md) covers retries, the native driver app
> and the optional road-routing server (OSRM). Without OSRM the planner uses
> straight-line estimates and the map draws dashed lines.

## Sign in

Every sign-in screen asks for a **Waypoint staff ID and PIN**, as the
Designathon designs specify (D-01, L-01, R-01, S-01).

| Person | Role | Staff ID | PIN | Sign-in page | Scope |
|---|---|---|---|---|---|
| Nimal Perera | Dispatcher | `DSP-0101` | `2580` | `/sign-in?role=dispatcher` | depot Peliyagoda |
| Ranjith Silva | Loader | `LDR-0142` | `4826` | `/sign-in?role=loader` | Peliyagoda dock |
| Sunil Fernando | Driver | `DRV-0207` | `1357` | `/sign-in?role=driver` | claims a vehicle at Peliyagoda |
| Fathima Rizvi | Store manager | `STR-0074` | `9024` | `/sign-in?role=store` | outlet OUT074 |
| Asha Wijesinghe | Admin | `ADM-0001` | `7531` | `/sign-in` | every depot |

`?role=` only changes the wording of the page. The account's own role decides
which workspace you land in. Sign out from the top right, or go to
`/sign-out`.

**Shortcut:** in development, **http://localhost:3000/access** has one card per
account with a **Sign in and open …** button. It is a 404 in production unless
`ALLOW_DEMO_ACCESS=1`.

## Judge walkthrough

One delivery day, end to end, across all four roles. It takes about 20
minutes.

**On the live site** (https://katapatha.silham.dev), follow the steps as
written, with that host in place of `http://localhost:3000`. The live
database is shared. If 9 April is already published when you arrive (the
desk shows **Published** and **Open plan** in place of **Close order
queue**), someone has done Part 1: read the plan board and continue from
Part 2.

**Locally**, start from a clean database:

```bash
pnpm demo:reset --yes
```

> **The demo day is Thursday 9 April 2026** (`2026-04-09`), the peak-day
> scenario from the brief. Screens open on *today* by default, which has no
> deliveries, so each part below says how to reach 9 April. Once a day is
> picked, the sidebar keeps it as you move between sections.
>
> Do **not** run `pnpm demo:smoke` or `pnpm demo:morning` before this
> walkthrough. Both publish the day and play the roles for you.

### Part 1: Dispatcher plans and publishes the day

1. Go to **http://localhost:3000/sign-in?role=dispatcher** and sign in with
   **`DSP-0101`** / **`2580`**. You land on **Delivery operations**.
2. In the date box under the title, enter **9 April 2026** and click **Go**.
   The subtitle reads *Peliyagoda depot · Thu, 9 Apr 2026*.
3. Look at **Fleet status** further down: four vehicles, with **VEH104**
   already *In workshop*. Fleet availability is a real, editable record.
4. In the **Next step** box, click **Close order queue**. Closing fixes the set
   of orders the plan is built from.
5. Click **Generate plan**. The allocator gives each order a vehicle that can
   carry it, or defers it and says why: *6 trips serve 11 of 12 orders; 1
   requires a deferral decision*.
6. Click **Review draft plan**. The plan board lists the trips, and under
   **Deferral decisions** one row, **DEMO-012**, marked *No vehicle fits*.
7. Click **Choose reason**. A drawer opens (D-05). It explains that no vehicle
   in the fleet can carry 45 m³, that this was *not a choice between orders*,
   and suggests **Order too large for any vehicle**. At the bottom it previews
   the exact message the store will get. Click **Save reason**.
8. Under **Publication check**, click **Publish plan**, then confirm with
   **Publish plan** in the dialog (D-06). The fleet for the day is now locked,
   and the store has been notified about DEMO-012.

> **Optional: a harder day.** Run `pnpm demo:reset --yes` again, and before
> step 4 click **Mark in workshop** on **VEH101** (reason: `Compressor fault`)
> and on **VEH103**. With both refrigerated vehicles out, seven orders are
> deferred. Open **DEMO-006** (Fathima's chilled order): the drawer names the
> vehicles in the workshop as the cause, suggests *Vehicle in the workshop*,
> and moves the order to *Fri 10 Apr · 05:30–10:00*, first on the run. Every
> deferral needs a reason before **Publish plan** is allowed. Part 4 then shows
> the same message on the store's side, word for word.

### Part 2: Loader loads VEH102 at the dock

9. Sign out, go to **http://localhost:3000/sign-in?role=loader** and sign in
   with **`LDR-0142`** / **`4826`**.
10. Open **http://localhost:3000/loader?date=2026-04-09**. The dock queue lists
    the published trips with their bays and departure times.
11. Click the **VEH102**, **Trip 1** row. Its loading list opens, in reverse stop
    order: the last stop is loaded first (*Last stop (load first)*).
12. Count each line up to *Required* with **One more**, or type the number.
13. *(Optional)* **Can't load it all? Report it** opens the shortage report:
    Short / Damaged / Wrong item / Chiller temp. It holds the vehicle until the
    dispatcher decides in **Exceptions**. Try it on a different trip, so
    VEH102 stays free to load.
14. Click **Mark loading complete**. *Vehicle sealed and marked ready.* The
    button stays disabled while any units are uncounted or an issue holds the
    vehicle.

### Part 3: Driver delivers to OUT074

Use a phone, or narrow the browser to phone width: the driver workspace is
built for one hand in a cab.

15. Sign out, go to **http://localhost:3000/sign-in?role=driver** and sign in
    with **`DRV-0207`** / **`1357`**.
16. Open **http://localhost:3000/driver?date=2026-04-09**. Under **Claim a
    vehicle to start**, enter **`VEH102`** and click **Claim vehicle for
    today**.
17. The run lists **Stops on this trip**: OUT040, then OUT074. Click **Record
    arrival · OUT040**, then **Start unload**, then **Complete delivery**.
18. In the delivery flow, **Count with the store** (adjust a count to see a
    part delivery recorded), then **Next: receipt**. Add a receipt photo if you
    like (**Add page**, or choose a picture), enter a name under **Received
    by**, and click **Complete delivery**. *Delivery recorded.*
19. Repeat for **OUT074**. That delivers **DEMO-007**, Fathima's ambient order.
20. *(Optional)* On any stop, **Can't deliver? Report a problem** records a
    failed delivery with a reason (Outlet closed, Access denied, Vehicle
    breakdown, Road blocked, Delivery refused). It goes to the dispatcher's
    **Exceptions**, and nothing on screen promises a re-delivery the system
    has not planned.

> The web driver needs a connection and says so honestly (*Checking /
> Connected / Offline*). The offline outbox, idempotent on replay, is in the
> native app, `apps/mobile`. See [docs/RUNNING.md](docs/RUNNING.md).

### Part 4: Store manager confirms receipt

21. Sign out, go to **http://localhost:3000/sign-in?role=store** and sign in
    with **`STR-0074`** / **`9024`**.
22. Open **My orders**. **DEMO-007** shows *Delivered*. **DEMO-006**, the
    chilled order, rides VEH101 and is not delivered yet.
23. Open **DEMO-007**. Under **Delivery outcome**, compare *Ordered*, *Driver
    recorded* and *You received*, then click **Everything arrived · confirm
    receipt**, or **Something's wrong** to record a difference. *Receipt
    confirmed.*
24. **Today** at **http://localhost:3000/store?date=2026-04-09** shows the day
    from the counter: what has arrived and what is still coming.
25. **Place an order**: choose products, **Review order →**, **Place order**.
    The order goes to the next operating day, which the screen states.
26. **Report an issue**: pick a delivery, say what happened and how many units,
    and **Submit report**. It reaches the dispatcher's **Exceptions**.

### Part 5: Admin and the record

27. Sign out, go to **http://localhost:3000/sign-in** and sign in with
    **`ADM-0001`** / **`7531`**. **Overview** compares depots.
28. **Users → Add user**, then **Disable** that new user. Accounts are disabled,
    never deleted, because decisions point at them. (Disabling a demo account
    stops that role from signing in.)
29. **Activity** is the audit log: who decided what, when, and with what
    reason. Your closing, planning, deferral and publishing decisions from
    Part 1 are there.

### Part 6: A busy morning (map, exceptions, forecast)

The live screens need a day in progress. This stages one: trips loaded or
short, a vehicle swapped mid-load, a warm chiller, vehicles on the road, one
of them in Lamp Mode, and a driver problem and a store issue raised.

```bash
pnpm demo:reset --yes && pnpm demo:morning
```

30. As the dispatcher, open **Map** on 9 April
    (`/dispatcher/map?date=2026-04-09`). Routes follow the roads, and each
    vehicle shows the age of its last report. A vehicle whose last report is
    too old for a single arrival time is in **Lamp Mode** (D-09): its arrival
    becomes a range.
31. **Exceptions** (`/dispatcher/exceptions?date=2026-04-09`): shortfalls,
    chiller readings, late vehicles, driver problems and store issues in one
    list. Each decision records a reason, and **Confirm and notify** tells the
    store.
32. **Reports → Capacity forecast** needs no date. It shows weekly demand
    against fleet capacity, the reefer shortfall, and recommended actions you
    can **Approve**, **Reject** or **Apply**.
33. As the loader, `/loader?date=2026-04-09` shows the mid-load vehicle swap
    (VEH102 trip 2 → VEH104) as a three-step notice (L-04), and the shift
    handover note.

## Changes since the Designathon design

The build follows the Designathon screens (D- dispatcher, L- loader, R-
driver, S- store, E- landing). Where it differs, the reason is almost always
the same: the screen showed something the data cannot back up, and
[docs/PRODUCT.md](docs/PRODUCT.md) forbids claiming what the system does not
know.

**Added (no screen in the design)**

| What | Why |
|---|---|
| **Admin workspace** (`/admin`: Overview, Users, Outlets, Vehicles, Activity) and an ADMIN role | Someone has to keep the accounts, outlets and vehicles. Accounts are disabled, never deleted. |
| **Fleet status** on the dispatcher desk: mark a vehicle *in workshop* for a day | Fleet availability was a read-only CSV. It is now a record the dispatcher changes, and it locks at publish. |
| **Plan board** (`/dispatcher/plans/{id}`), hosting D-05 and D-06 | The defer drawer and the publish dialog open from the URL, so they can be linked and survive a reload. |
| **Product catalogue** (`/dispatcher/products`), and stores order real products | The design ordered by category. Orders now list SKUs, which the loader, driver and store all see. There is no stock or price, because nothing in the data has them. |
| **Road routing** over OpenStreetMap (OSRM) | Trips have real road minutes and routes. Without OSRM the planner falls back to straight-line estimates and says so. |
| **Deferral explanations** | The allocator records why an order was deferred, what else was competing for the vehicle, and where the order moves to. The store sees the same message. |
| **Capacity actions** from the forecast (approve / reject / apply) | A forecast deficit becomes a decision with a reason (D-13). |
| `/access` reviewer page | One-click sign-in as each seeded account, for development only. |

**Changed**

| Screen | Design showed | Built | Why |
|---|---|---|---|
| D-01, L-01, R-01, S-01 | staff ID + PIN | staff ID + PIN, on one sign-in page themed by `?role=` | as designed; the API also accepts email and password, for the native app and the scripts |
| D-02 Dashboard | weather chip, "+12% from yesterday", route map | none of those; a **Next step** box walks the day | no data backs the first two; the map is its own page |
| D-03 Orders | Vehicle / Trip column | no such column | the orders list does not know the trip, and inferring it would be a guess |
| D-04 Planning | route map and stop list per vehicle | trips and per-vehicle utilisation bars; routes are on **Map** | the planning view is trip-level |
| D-05 Defer order | "Defer and notify store"; shelf-life and promotion copy | **Save reason**; reasons drawn from the allocator | the store is only told at publish, so "notify" would promise a message not yet sent; the data has no shelf-life or promotions |
| D-08 / D-09 Map | vehicle positions and ETAs | positions shown with the age of the last report; an *idle* (at depot) state; Lamp Mode ETAs read "about" | positions come from the driver's phone, not continuous tracking |
| D-10 / D-11 Exceptions | dock stock figures | no stock | there is no stock model |
| L-03 Report shortage | stock figure and substitute | neither; a chiller reading is a person's gauge reading | the system models neither stock nor sensors |
| R-07 Check items | one row per SKU | count per order, items listed read-only | an order is planned and delivered in units |
| R-11 Failed delivery | "Called OUT075 / Waited at outlet" log | a reason and a note | there is no call or wait log |
| R-06 – R-10 offline | offline flow | native app only; the web driver never claims to save offline | only the native app has a verified outbox |
| S-03 Lamp Mode | store-side Lamp Mode | not built; the store sees the planned time, labelled as planned | a store cannot see vehicle positions |
| S-09 Delivery history | arrival times, on-time rate, driver, POD image | outcome from units ordered, recorded and received, plus issues | the rest is not recorded per outlet |
| S-10 Report issue | photos, save draft | neither | not stored |

## Check it

```bash
pnpm typecheck && pnpm lint && pnpm test
pnpm contract:lint              # the OpenAPI spec must be valid
pnpm gen:check                  # generated client must match the spec
pnpm demo:reset --yes && pnpm demo:smoke   # the whole day over HTTP
```

`demo:smoke` walks the same day as the walkthrough over the API (store orders,
dispatcher plans and publishes, loader seals, driver delivers with proof,
store confirms) and exits non-zero on any failure.

A **Prism mock** (`pnpm mock`, on :4010) serves every endpoint of the frozen
contract with realistic examples, so a screen can be built before its endpoint
exists. Note that the mock serves paths at the root, with no `/v1`.

## Where to read next

| Doc | Read it when |
|---|---|
| [docs/DATA-MODEL.md](docs/DATA-MODEL.md) | you want the tables, their relationships and the rules the database enforces |
| [docs/AI-DISCLOSURE.md](docs/AI-DISCLOSURE.md) | you want to know how AI tools (Claude Code) were used |
| [docs/RUNNING.md](docs/RUNNING.md) | running it locally, the long version |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | you want the shape of the whole thing |
| [docs/DOMAIN.md](docs/DOMAIN.md) | you are unsure what a status or a reason code means |
| [docs/PRODUCT.md](docs/PRODUCT.md) | **binding.** What the product is and is not allowed to claim |
| [docs/DESIGN.md](docs/DESIGN.md) | **binding.** Palette, type, spacing, responsive criteria |
| [docs/CONTRACT.md](docs/CONTRACT.md) | you need to change the API |
| [docs/CONVENTIONS.md](docs/CONVENTIONS.md) | before you create a file or open a PR |
| [docs/DEPLOY-COOLIFY.md](docs/DEPLOY-COOLIFY.md) | deploying with Docker on Coolify |
| [docs/ONBOARDING.md](docs/ONBOARDING.md) | your first pull request |

## Two things this repo will not let you do

**Import the database outside the API.** `@prisma/client` is a dependency of
`apps/api` only. pnpm's strict `node_modules` means a web or mobile file that
imports it fails to resolve. "API-first" is enforced by the module resolver,
not by good intentions.

**Accept a request the contract forbids.** Fastify validates every request body
against the spec's schema, so a handler cannot take a field the contract does
not declare.

## Data

The committed fixture in `apps/api/prisma/seed/fixture/` is **synthetic** and
must stay that way. The real dataset is confidential: place it beside this repo
and set `DATA_DIR`, or copy `docker-compose.override.yml.example`. Never commit
dataset derivatives.
