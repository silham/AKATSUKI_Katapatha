# The same-origin proxy, with its Caddyfile built in. A deployment platform
# (Coolify) does not place repository files at bind-mount paths, so mounting
# ./Caddyfile would give Caddy an empty directory instead of its config.
FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
