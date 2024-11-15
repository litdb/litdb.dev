---
title: litdb for postgres.js
---

Use litdb with [postgres.js](https://github.com/porsager/postgres) driver:

:::sh
npm install @litdb/postgres
:::

## Configuration

**db.ts**

```ts
import { connect } from "@litdb/postgres"

export const connection = connect({ hostname, database, user, password })
export const { $, async:db, native:sql } = connection
```

:::tip
When needed use `sql` to access the native [postgres.js sql function](https://github.com/porsager/postgres#usage)
:::

### Configuration Options

```ts
type ConnectionOptions = {
    /** Postgres ip address[s] or domain name[s] */
    host?: string | undefined;
    /** Postgres server[s] port[s] */
    port?: number | undefined;
    /** unix socket path (usually '/tmp') */
    path?: string | undefined;
    /** Password of database user (an alias for `password`) */
    pass?: Options<T>['password'] | undefined;
    /**
     * Password of database user
     * @default process.env['PGPASSWORD']
     */
    password?: string | (() => string | Promise<string>) | undefined;
    /** Name of database to connect to (an alias for `database`) */
    db?: Options<T>['database'] | undefined;
    /** Username of database user (an alias for `user`) */
    username?: Options<T>['user'] | undefined;
    /** Postgres ip address or domain name (an alias for `host`) */
    hostname?: Options<T>['host'] | undefined;
    /**
     * Disable prepared mode
     * @deprecated use "prepare" option instead
     */
    no_prepare?: boolean | undefined;
    /**
     * Idle connection timeout in seconds
     * @deprecated use "idle_timeout" option instead
     */
    timeout?: Options<T>['idle_timeout'] | undefined;
}
```

See [postgres.js Connection Options](https://github.com/porsager/postgres?tab=readme-ov-file#connection-details) for more.

Example:

```ts
connection = connect({ hostname, database, user, password })
connection = connect(connectionString, options)
```

## Usage

Example of using `@litdb/postgres` async APIs:

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
