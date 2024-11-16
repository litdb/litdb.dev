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
db.column`SELECT firstName FROM Contact`          // => string[]
db.arrays`SELECT * FROM Contact`                  // => any[][]
db.array`SELECT * FROM Contact WHERE id = ${id}`  // => any[]
</live-preview>

## SELECT Query Builder

`$.from(Table)` is used to create a SELECT query builder which by default selects all known columns of the data model.

<live-preview>
$.from(Contact)
</live-preview>

