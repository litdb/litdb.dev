---
title: litdb for Bun SQLite
---

Use litdb with [Bun's native SQLite3 driver](https://bun.sh/docs/api/sqlite) (requires Bun):

:::sh
bun install @litdb/bun-sqlite
:::

## Configuration

**db.ts**

```ts
import { connect } from "@litdb/bun-sqlite"

export const connection = connect("app.db") // WAL enabled by default
export const { $, sync:db, async, native } = connection
```

:::tip
When needed use `native` to access underlying [bun:sqlite Database](https://bun.sh/docs/api/sqlite#database) 
:::

### Configuration Options

```ts
type ConnectionOptions = {
    // Creates a new database connection to the specified SQLite DB. 
    // If the database file does not exist, it is created.
    // default "app.db"
    fileName?:string
    // Whether to enable WAL
    // default true
    wal?:boolean
    // Open the database as read-only (no write operations, no create).
    readonly?: boolean
    // Allow creating a new database
    create?: boolean;
    // Open the database as read-write
    readwrite?: boolean;
    // When set to `true`, integers are returned as `bigint` types.
    // When set to `false`, integers are returned as `number` types and truncated to 52 bits.
    // default false
    safeIntegers?: boolean;
    // When set to `false` or `undefined`:
    // - Queries missing bound parameters will NOT throw an error
    // - Bound named parameters in JavaScript need to exactly match the SQL query.
    // default true
    strict?: boolean;
}
```

Example:

```ts
export const connection = connect({ fileName:'app.db' })
```

## Usage

Example of using `@litdb/bun-sqlite` sync APIs:

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
