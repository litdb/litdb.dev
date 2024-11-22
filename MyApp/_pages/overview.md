---
title: Overview
---

## What is litdb?

litdb is a suite of simple and lightweight database agnostic abstractions and SQL query builders for TypeScript and JavaScript. 
It is designed to leverage TypeScript's powerful type system to provide a simple and intuitive type-safe wrapper around
constructing and executing typed SQL queries with a focus on type safety, best practices and portability.

### litdb library

The core `litdb` library provides a set of composable query builders and SQL fragments that can be used to generate
SQL that can be executed on SQLite, MySQL and PostgreSQL.

### SQL Expression

The `$` tagged template function is used to create parameterized SQL Fragments that's split into `sql` and `params`:

```ts
type Fragment = { sql:string, params:Record<string,any> }
```

<live-preview>
JSON.stringify($`id = ${1} OR name = ${'John'}`)
</live-preview>

### SQL Builder

SQL Builders are just objects containing a `build()` function which returns an SQL `Fragment`:

```ts
interface SqlBuilder {
    build(): Fragment
}
```

Their simplicity and loose coupling allows them to be used in any ORM or driver that can execute parameterized SQL.

### litdb drivers

The litdb Drivers provide a unified interface for executing custom parameterized SQL, SQL Builders and SQL Fragments 
for their respective RDBMS. The SQLite drivers support both the Sync and Async DbConnection whilst
remote databases like PostgreSQL and MySQL only support the Async DbConnection.

```ts
interface SyncDbConnection {
    driver:Driver
    $:Function
    schema:Schema
    quote(symbol:string): string
    insert<T extends ClassInstance>(row:T, options?:InsertOptions): Changes
    insertAll<T extends ClassInstance>(rows:T[], options?:InsertOptions): Changes
    update<T extends ClassInstance>(row:T, options?:UpdateOptions): Changes
    delete<T extends ClassInstance>(row:T, options?:DeleteOptions): Changes
    listTables(): string[]
    dropTable<Table extends ClassParam>(table:Table): void
    createTable<Table extends ClassParam>(table:Table): void
    all<RetType>(strings: TemplateStringsArray | SqlBuilder | Fragment | IntoFragment<RetType>, ...params: any[]): RetType[]
    one<RetType>(strings: TemplateStringsArray | SqlBuilder | Fragment | IntoFragment<RetType>, ...params: any[]): RetType
    column<ReturnValue>(strings: TemplateStringsArray | SqlBuilder | Fragment, ...params: any[]): RetType[]
    value<ReturnValue>(strings: TemplateStringsArray | SqlBuilder | Fragment, ...params: any[]): ReturnValue
    arrays(strings: TemplateStringsArray | SqlBuilder | Fragment, ...params: any[]): any[][]
    array(strings: TemplateStringsArray | SqlBuilder | Fragment, ...params: any[]): any[]
    exec(strings:TemplateStringsArray | SqlBuilder | Fragment, ...params:any[]): Changes
    run(strings:TemplateStringsArray | SqlBuilder | Fragment, ...params:any[]): void
    prepareSync<T>(str: TemplateStringsArray | SqlBuilder | Fragment, ...params: any[]): Statement    
    close()
}

type Changes = { changes: number; lastInsertRowid: number | bigint }
```

## Data Models

litdb is more a lightweight data mapper than a full-fledged ORM, but many of its APIs are designed to work with 
[data models](/models) which are simple TypeScript classes that represent and map 1:1 to tables in a database.

## Safe by default

All SQL Queries and SQL Fragments require using a tagged template function which parameterizes all values to prevent 
SQL Injection attacks, as such accidentally using a `string` will result in an error, e.g:

<live-preview>
const bobbyTables = "Robert'); DROP TABLE Students;--"
db.one(`SELECT * FROM Contact WHERE name = '${bobbyTables}'`)
</live-preview>

Driver APIs, SQL Builders and Expressions instead accept templated strings which auto parameterizes SQL queries:

<live-preview>
const bobbyTables = "Robert'); DROP TABLE Students;--"
db.one($.from(Contact).where(c => $`${c.name} = ${bobbyTables}`))
db.one($.from(Contact).where`name = ${bobbyTables}`)
db.one`SELECT * FROM Contact WHERE name = ${bobbyTables}`
db.one($`SELECT * FROM Contact WHERE name = ${bobbyTables}`)
db.one($.sql('SELECT * FROM Contact WHERE name = $bobbyTables', { bobbyTables }))
db.one({ sql:'SELECT * FROM Contact WHERE name = $bobbyTables', params:{bobbyTables} })
</live-preview>

## Portable

litdb is designed to be portable where in most cases query builders, expressions and driver APIs that stick to ANSI SQL
syntax can be used across different databases and drivers. This preserves investments and knowledge reuse allowing
your App's logic to bind to RDBMS-agnostic abstractions that can be reused across different databases or allow your 
App to easily migrate to run on different databases.

## Expressive

At the same time litdb SQL Builders and Fragments doesn't restrict you to a subset of SQL, instead of forcing the use of
a more restrictive query language that abstracts away the full power of SQL, litdb's SQL Builders are designed for creating
type-safe parameterized SQL that can be executed on any RDBMS, but when needed you can use the full expressiveness of 
your RDBMS SQL dialect to make use of RDBMS-specific features.
