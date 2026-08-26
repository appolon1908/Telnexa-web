## Scope

Describe the user-visible or operational change.

## Evidence

- [ ] `npm run validate`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] page and form smoke tests
- [ ] Docker build when runtime files change

## Safety

- [ ] no secrets committed
- [ ] browser does not call Odoo or n8n directly
- [ ] production form acceptance remains fail-closed
- [ ] live delivery or provisioning capabilities remain disabled unless separately approved

## Rollback

Describe the commit or immutable image to restore.
