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

To get the most out of `litdb` we recommend using an editor that supports TypeScript definitions 
(e.g. VS Code, JetBrains IDEs, neovim, etc.)

## RDBMS Drivers

Lightweight drivers with native support for its typed SQL Builders and parameterized SQL Expressions 
are also available for the popular databases:

### Bun SQLite

Use with [Bun's native SQLite3 driver](https://bun.sh/docs/api/sqlite): 

:::sh
bun install @litdb/bun-sqlite
:::

### PostgreSQL

Use with [postgres.js](https://github.com/porsager/postgres) client:

:::sh
npm install @litdb/postgres
:::

### MySql

Use with [node-mysql2](https://github.com/sidorares/node-mysql2) client:

:::sh
npm install @litdb/mysql
:::

### Request a Driver

If you'd like to see a driver for a specific client, please open or vote for a feature request on litdb's 
[GitHub Discussions](https://github.com/litdb/litdb/discussions/categories/ideas).
