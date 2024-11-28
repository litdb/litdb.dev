---
title: Install
---

To use litdb with your favorite ORM, no driver is required. Just use the `litdb` package directly:

:::sh
npm install litdb
:::

`litdb` is also available as a module, where it can be used directly in the browser:

```html
<script type="module">
import { sqlite as $ } from "https://unpkg.com/litdb/dist/index.min.js"
const { sql, params } = $.from(Contact).select(c => $`${c.name}`).build()
</script>
```

To get the most out of `litdb` we recommend using text editors that supports TypeScript definitions (e.g. VS Code)

# LitDB Drivers

Lightweight drivers with first-class support for litdb query builders are also available for the popular databases below:

### SQLite (Bun)

Use with [Bun's native SQLite3 driver](https://bun.sh/docs/api/sqlite) (requires Bun):

:::sh
bun install @litdb/bun-sqlite
:::

See [litdb Bun SQLite Docs](/bun-sqlite).

### SQLite (Node.js)

Use with Node [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) (requires Node.js):

:::sh
npm install @litdb/better-sqlite
:::

See [litdb better-sqlite3 Docs](/better-sqlite).

### PostgreSQL

Use with the [postgres.js](https://github.com/porsager/postgres) client:

:::sh
npm install @litdb/postgres
:::

See [litdb postgres Docs](/postgres).

### MySQL

Use with the [mysql2](https://github.com/sidorares/node-mysql2) client:

:::sh
npm install @litdb/mysql2
:::

See [litdb mysql2 Docs](/mysql2).

### Request a Driver

If you'd like to see a driver for a specific client, please open or vote for a feature request on litdb's 
[GitHub Discussions](https://github.com/litdb/litdb/discussions/categories/ideas).

## Driver Usage

litdb drivers are lightweight data adapters providing convenience APIs for executing SQL and parameters. 
They can be used with or without litdb SQL Builders, but offer the most value when used together. 

The same APIs are available across all drivers, so you can easily switch between them. They include both **sync** APIs
recommended for SQLite libraries that use SQLite's native blocking APIs, whilst **async** APIs should be used for 
querying all other remote databases, e.g. PostgreSQL and MySQL.
