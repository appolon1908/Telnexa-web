# Telnexa branch policy

- `main` contains reviewed, releasable code only.
- `feat/nuxt-production-platform` contains the public Nuxt/Vue application implementation.
- `ops/production-deployment` contains server-specific Caddy, Kong, Docker, SSH, DNS, and smoke-test changes after the application branch is reviewed.
- Every production merge must use an exact reviewed SHA and green required checks.
