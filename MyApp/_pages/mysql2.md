---
title: litdb for mysql2
---

Use litdb with [node-mysql2](https://github.com/sidorares/node-mysql2) driver:

:::sh
npm install @litdb/postgres
:::

## Configuration

Example of using the [node-mysql2](https://github.com/sidorares/node-mysql2) driver:

**db.ts**

```ts
import { connect } from "@litdb/mysql2"

export const connection = connect({ hostname, database, user, password })
export const { $, async:db, native:sql } = connection
```

:::tip
When needed use `native` to access [mysql2 Connection Pool](https://sidorares.github.io/node-mysql2/docs#using-connection-pools)
:::

### Configuration Options

```ts
type ConnectionOptions = {
    // DECIMAL and NEWDECIMAL types will be returned as numbers if this option is set to `true`
    // default: false
    decimalNumbers?: boolean;
    // The MySQL user to authenticate as
    user?: string;
    // The password of that MySQL user
    password?: string;
    // Name of the database to use for this connection
    database?: string;
    // The charset for the connection.
    // default: UTF8_GENERAL_CI
    charset?: string;
    // The hostname of the database you are connecting to
    // default: localhost
    host?: string;
    // The port number to connect to
    // default: 3306
    port?: number;
    // The source IP address to use for TCP connection
    localAddress?: string;
    // The path to a unix domain socket to connect to. When used host and port are ignored
    socketPath?: string;
    // The timezone used to store local dates
    // default: local
    timezone?: string | 'local';
}
```

See [node-mysql Connection Pool Options](https://sidorares.github.io/node-mysql2/docs#using-connection-pools) for more.

Example:

```ts
connection = connect({ host, database, user, password })
connection = connect(connectionString)
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
