---
title: litdb for Node.js better-sqlite3
---

Use litdb with the [better-sqlite3 driver](https://github.com/WiseLibs/better-sqlite3) (requires Node.js):

:::sh
bun install @litdb/better-sqlite
:::

## Configuration

**db.ts**

```ts
import { connect } from "@litdb/better-sqlite"

export const connection = connect("app.db") // WAL enabled by default
export const { $, sync:db, async, native } = connection
```

:::tip
When needed use `native` to access the native [better-sqlite3 Database](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md#class-database)
:::

### Configuration Options

```ts
type ConnectionOptions = {
    // Creates a new database connection to the specified SQLite DB. 
    // If the database file does not exist, it is created.
    // default: app.db
    fileName?:string
    // Whether to enable WAL
    // default: true
    wal?:boolean
    // Open the database as read-only (no write operations, no create).
    // default: false
    readonly?: boolean
    // If the database does not exist, an Error will be thrown instead of creating a new file
    fileMustExist?: boolean | undefined;
    // The number of milliseconds to wait when executing queries on a locked database, 
    // before throwing a SQLITE_BUSY error
    // default: 5000
    timeout?: number | undefined;
    // Provide a function that gets called with every SQL string executed by the db connection
    verbose?: ((message?: unknown, ...additionalArgs: unknown[]) => void) | undefined;
    // If you're using a build system that moves, transforms, or concatenates your JS files,
    // you can solve it by using this option to provide the file path of better_sqlite3.node 
    // (relative to the current working directory).
    nativeBinding?: string | undefined;
}
```

Example:

```ts
export const connection = connect({ fileName:'app.db' })
```

## Usage

Example of using `@litdb/better-sqlite` sync APIs:

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
