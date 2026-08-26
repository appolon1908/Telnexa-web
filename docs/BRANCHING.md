# Branch and merge policy

## `main`

`main` is the reviewed release line. Feature work is not committed directly to it. Every merge identifies the reviewed head SHA and preserves green validation, test, build, smoke, and image-build evidence.

## `feat/nuxt-production-platform`

Owns the Nuxt/Vue application, page and form manifests, SEO output, server API boundary, middleware forwarding contract, tests, Dockerfile, and application CI.

It must not contain production SSH keys, DNS credentials, generated evidence, temporary source archives, or server-specific secret values.

## `ops/production-deployment`

Starts from the exact reviewed application branch head and adds only deployment concerns: Compose, Caddy, Kong, immutable release workflows, SSH execution, preflight, smoke testing, rollback, and runbooks.

The operations pull request is synchronized after the application SHA changes. Production is never deployed from a stale application parent.

## Merge order

1. Review and merge `feat/nuxt-production-platform` into `main`.
2. Synchronize `ops/production-deployment` to the resulting protected `main` SHA.
3. Review and merge the operations pull request.
4. Build and publish from the exact protected merged SHA.
5. Deploy only after DNS, SSH, secrets, middleware, rollback, and public HTTPS gates pass.
