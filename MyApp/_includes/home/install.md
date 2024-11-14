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

To get the most out of `litdb` we recommend using text editors that supports TypeScript definitions 
(e.g. VS Code, JetBrains IDEs, neovim, etc.)

# LitDB Drivers

Lightweight drivers with native support for its typed SQL Builders and parameterized SQL Expressions 
are also available for the popular databases:

### Bun SQLite

Use with [Bun's native SQLite3 driver](https://bun.sh/docs/api/sqlite):

:::sh
bun install @litdb/bun-sqlite
:::

### Node better-sqlite

Use with Node [better-sqlite3](https://github.com/WiseLibs/better-sqlite3):

:::sh
npm install @litdb/better-sqlite
:::

### PostgreSQL

Use with the [postgres.js](https://github.com/porsager/postgres) client:

:::sh
npm install @litdb/postgres
:::

### MySQL

Use with the [mysql2](https://github.com/sidorares/node-mysql2) client:

:::sh
npm install @litdb/mysql2
:::

### Request a Driver

If you'd like to see a driver for a specific client, please open or vote for a feature request on litdb's 
[GitHub Discussions](https://github.com/litdb/litdb/discussions/categories/ideas).

## Driver Usage

litdb drivers are lightweight data adapters providing a number of convenience APIs for executing SQL and parameters. 
They can be used with our without litdb SQL Builders, but offer the most value when used together. 

The same APIs are available across all drivers, so you can easily switch between them. They include both **sync** APIs
recommended for SQLite libraries that use SQLite's native blocking APIs, whilst **async** APIs should be used for 
all other databases, e.g. PostgreSQL and MySQL.

This is an example of using the [Bun SQLite](https://bun.sh/docs/api/sqlite) driver:

**db.ts**

```ts
import { connect } from "@litdb/bun-sqlite"

export const connection = connect("app.db") // WAL enabled by default
export const { $, sync:db, async, native } = connection
```

:::tip
When needed use `native` to access underlying driver (e.g. [bun:sqlite Database](https://bun.sh/docs/api/sqlite#database))
:::

**app.ts**

```ts
import { $, db } from "./db"
import { Contact } from "./models"

db.dropTable(Contact)
db.createTable(Contact)
db.insertAll([
    new Contact({ name:"John Doe", email:"john@mail.org" }),
    new Contact({ name:"Jane Doe", email:"jane@mail.org" }),
])

const janeEmail = 'jane@mail.org'
const jane = db.one<Contact>($.from(Contact).where(c => $`${c.email} = ${janeEmail}`))!

// Insert examples
const { lastInsertRowid: bobId } = db.insert(new Contact({ name:"Bob", email:"bob@mail.org" }))
const { lastInsertRowid } = db.exec`INSERT INTO Contact(name,email) VALUES ('Jo','jo@doe.org')`
const name = 'Alice', email = 'alice@mail.org'
db.exec`INSERT INTO Contact(name,email) VALUES (${name}, ${email})`

// Typed SQL fragment with named param example
const hasId = <Table extends { id:number }>(id:number|bigint) =>
    (x:Table) => $.sql($`${x.id} = $id`, { id })

const contacts = db.all($.from(Contact).into(Contact))                // => Contact[]
const bob = db.one($.from(Contact).where(hasId(bobId)).into(Contact)) // => Contact    
const contactsCount = db.value($.from(Contact).select`COUNT(*)`)      // => number
const emails = db.column($.from(Contact).select(c => $`${c.email}`))  // => string[]
const contactsArray = db.arrays($.from(Contact))                      // => any[][]
const bobArray = db.array($.from(Contact).where(hasId(bobId)))        // => any[]

// Update examples
jane.email = 'jane@doe.org'
db.update(jane)                           // Update all properties
db.update(jane, { onlyProps:['email'] })  // Update only email
db.exec($.update(Contact).set({ email:jane.email }).where(hasId(jane.id))) // query builder

// Delete examples
db.delete(jane)
db.exec($.deleteFrom(Contact).where(hasId(jane.id))) // query builder
```

Same source is compatible with other sync drivers, just replace `@litdb/bun-sqlite` with `@litdb/better-sqlite` to use
with [litdb/better-sqlite](https://github.com/litdb/better-sqlite).

## ASYNC Driver Usage

The same APIs are available for async access to remote RDBMS's like PostgreSQL and MySQL. 

This is an example of using the [postgres.js](https://github.com/porsager/postgres) driver:

**db.ts**

```ts
import { connect } from "@litdb/postgres"

export const connection = connect({ hostname, database, user, password })
export const { $, async:db, native:sql } = connection
```

:::tip
When needed use `sql` to access the native [postgres.js sql function](https://github.com/porsager/postgres#usage)
:::

**app.ts**

```ts
import { $, db } from "./db"
import { Contact } from "./models"

await db.dropTable(Contact)
await db.createTable(Contact)
await db.insertAll([
    new Contact({ name:"John Doe", email:"john@mail.org" }),
    new Contact({ name:"Jane Doe", email:"jane@mail.org" }),
])

const janeEmail = 'jane@mail.org'
const jane = await db.one<Contact>($.from(Contact).where(c => $`${c.email}=${janeEmail}`))

// Insert examples
const { lastInsertRowid:bobId } = await db.insert(
    new Contact({ name:"Bob", email:"bob@mail.org"}))

const { lastInsertRowid } = await db.exec
    `INSERT INTO Contact(name,email) VALUES('Jo','jo@doe.org')`

const name = 'Alice', email = 'alice@mail.org'
await db.exec`INSERT INTO Contact(name,email) VALUES (${name}, ${email})`

// Typed SQL fragment with named param example
const hasId = <Table extends { id:number }>(id:number|bigint) =>
    (x:Table) => $.sql($`${x.id} = $id`, { id })

const contacts = await db.all($.from(Contact).into(Contact))                // => Contact[]
const bob = await db.one($.from(Contact).where(hasId(bobId)).into(Contact)) // => Contact
const contactsCount = await db.value($.from(Contact).rowCount())            // => number
const emails = await db.column($.from(Contact).select(c => $`${c.email}`))  // => string[]
const contactsArray = await db.arrays($.from(Contact))                      // => any[][]
const bobArray = await db.array($.from(Contact).where(hasId(bobId)))        // => any[]

// Update examples
jane.email = 'jane@doe.org'
await db.update(jane)                           // Update all properties
await db.update(jane, { onlyProps:['email'] })  // Update only email
// query builder
await db.exec($.update(Contact).set({ email:jane.email }).where(hasId(jane.id)))

// Delete examples
await db.delete(jane)
await db.exec($.deleteFrom(Contact).where(hasId(jane.id))) // query builder
```

Same source is compatible with other async drivers, just replace `@litdb/postgres` with `@litdb/mysql2` to use
with [litdb/mysql2](https://github.com/litdb/mysql2).

