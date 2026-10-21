## Database Migrations and Seeding

Before running database migrations or seeders, build the application to ensure the latest compiled files are available in the `dist` directory.

### Run Database Migrations

```bash
pnpm build
pnpm migration:run
```

### Run Database Seeders

```bash
pnpm build
pnpm seed:run
```

**Important:** Always run `pnpm build` before executing migrations or seeders to ensure the latest compiled code is used.