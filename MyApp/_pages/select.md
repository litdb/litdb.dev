---
title: SELECT Examples
---

## Simple Queries

Simple queries can be executed directly on the litdb driver APIs, the different APIs available based on whether the
query is expected to return multiple rows, a single row, a single value, a single column, etc.

<live-preview>
const id = 1
db.all`SELECT * FROM Contact`                     // => Contact[]
db.one`SELECT * FROM Contact WHERE id = ${id}`    // => Contact
db.value`SELECT COUNT(*) FROM Contact`            // => number
db.column`SELECT name FROM Contact`               // => string[]
db.arrays`SELECT * FROM Contact`                  // => any[][]
db.array`SELECT * FROM Contact WHERE id = ${id}`  // => any[]
</live-preview>

## SELECT Query Builder

`$.from(Table)` is used to create a SELECT query builder which by default selects all known columns of the data model.

<live-preview>
$.from(Contact)
</live-preview>

## Typed Selects

When a custom select is needed you can use select function to specify the columns to select. All tables and columns
using typed references are automatically quoted.

<live-preview>
$.from(Contact).select(c => $`${c.id}, ${c.name}, ${c.email}`)
</live-preview>

## Aliases

A table alias can be specified in `$.from()`, with the `.as()` method or by using `$.ref()` to 
create a table reference.

<live-preview>
db.all($.from(Contact,'c').select(c => $`${c.id}, ${c.name}, ${c.email}`))
db.all($.from(Contact).as('c').select(c => $`${c.id}, ${c.name}, ${c.age}`))
const c = $.ref(Contact,'c')
db.all($.from(c).select(c => $`${c.id}, ${c.name}, ${c.createdAt}`))
</live-preview>

## Select a list of Properties or Columns

The `props` option can be used to select a list of properties from the data model where any aliases would be used if defined, 
whilst the `columns` option can be used to select a list of RDBMS columns from the table.

<live-preview>
db.all($.from(Contact).select({ props:['id', 'name', 'age'] }))
db.all($.from(Contact).select({ columns:['id', 'name', 'email'] }))
</live-preview>
