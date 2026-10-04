# Deploying on Coolify

The whole stack (Postgres, API, web, the same-origin proxy and the OpenStreetMap
road network) runs from one file, [`docker-compose.coolify.yml`](../docker-compose.coolify.yml).
`docker-compose.yml` stays the local-development file; do not point Coolify at it.

```
Internet ─HTTPS─▶ Coolify (Traefik) ─▶ proxy (Caddy :80) ─┬─ /v1/* ─▶ api :3001 ─┬─▶ db (Postgres)
                                                          └─ /*    ─▶ web :3000   └─▶ osrm :5000
```

## Server

At least **4 GB RAM** and 20 GB disk. Building the road graph peaks at ~2–4 GB
on the first deploy, and the Next.js build needs ~2 GB.

## 1. Connect GitHub (once)

Coolify → **Sources** → **+ Add** → **GitHub App**. Create the app, install it on
your GitHub account or organisation, and give it access to this repository.

## 2. Create the resource

1. **Projects** → your project → **+ New** → **Private Repository (with GitHub App)**.
2. Pick the GitHub App, then this repository and the `main` branch.
3. **Build Pack: Docker Compose.**
4. **Docker Compose Location:** `/docker-compose.coolify.yml` (Base Directory `/`).
5. Save. Coolify reads the file and lists the services.

## 3. Environment variables

| Variable | Value |
|---|---|
| `POSTGRES_PASSWORD` | A long random value, **letters and digits only** (it goes inside the database URL) |
| `ALLOW_DEMO_ACCESS` | `0` in production. `1` turns on the one-click `/access` page for a demo |

`OSRM_URL` is set inside the compose file (`http://osrm:5000`); nothing to add.

## 4. Domain

Give the domain to the **`proxy`** service only, e.g. `https://katapatha.example.com`
(it listens on port 80). Leave `web`, `api`, `db` and `osrm` without a domain.

HTTPS is required: in production the session cookie is `Secure`, so sign-in does
not work over plain HTTP. Coolify issues the certificate.

## 5. Deploy

Press **Deploy**. On the first deploy:

1. `osrm-download` fetches the Sri Lanka extract from Geofabrik (~150 MB) and exits.
2. `osrm-prepare` builds the road graph into the `osrm-data` volume (a few minutes) and exits.
3. `osrm` starts serving routes.
4. `api` applies migrations and seeds an empty database: reference data,
   products, all 25 districts and the demo accounts. Later boots skip what is already there.

The two `osrm-*` setup containers show as **exited**. That is expected; they are
excluded from the health check. On later deploys they find the data and exit
immediately.

With the GitHub App, every push to `main` redeploys automatically (toggle under
the resource's **Advanced** → *Auto Deploy*).

## 6. After the first deploy

- **Change the demo credentials.** The seed creates five accounts with published
  passwords and PINs (README / docs/RUNNING.md). Sign in as the admin
  (`ADM-0001` / `7531`), reset every PIN and password under **Users**, and
  disable the accounts you do not need.
- **Backups:** enable scheduled backups for the `db` service's volume.
- **Mobile app:** point it at `https://<your-domain>/v1`.

## Operations

| Task | How |
|---|---|
| Refresh the road data | Delete `/data/.ready` in the `osrm-data` volume (or the volume) and redeploy |
| Check routing | API logs, or `curl http://osrm:5000/nearest/v1/driving/79.8612,6.9271` from the api container |
| Run without routing | Remove the three `osrm*` services and `OSRM_URL`; plans use straight-line estimates and the map draws dashed lines |

## Map tiles

The map's base layer comes from `tile.openstreetmap.org`, whose
[usage policy](https://operations.osmfoundation.org/policies/tiles/) does not
allow heavy production traffic. For real use, switch `TILE_URL` in
`apps/web/src/app/dispatcher/map/road-map.tsx` to a tile provider (MapTiler,
Stadia, Thunderforest) or a self-hosted tile server, with its attribution.
