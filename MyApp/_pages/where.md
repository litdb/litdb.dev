---
title: WHERE Examples
---

## Simple WHERE Clauses

The `where` method is used to add a WHERE clause to the query, it's an alias for `and` which can be called multiple times 
to add multiple **AND** conditions to the WHERE clause, whilst `or` can be used to add an **OR** condition.

<live-preview>
$.from(Order)
  .leftJoin(Contact, { on:(o,c) => $`${o.contactId} = ${c.id}` })
  .where((o,c) => $`${c.id} = ${1} AND ${c.age} > ${18}`)
  .or(o => $`${o.total} > ${100}`)
  .select('*')
</live-preview>

## Array Expansion

Arrays embedded in SQL Fragments are expanded into a list of parameters, this can be used to create IN clauses.

<live-preview>
$.from(Contact).where`id IN (${[10,20,30]})`
</live-preview>

## WHERE with Subqueries

Fragments can embed other fragments where their SQL and parameters are merged.

<live-preview>
const hasPurchasesOver = (c,total) => $`EXISTS (
       SELECT 1 FROM Order WHERE o.contactId = ${c.id} AND total >= ${total})`
const inCity = (...cities) => c => $`${c.city} IN (${cities})`
const olderThan = age => $.sql('age >= $age', { age })
const q = $.from(Contact,'c')
    .where(c => hasPurchasesOver(c,1000))
    .and(inCity('Austin','Chicago'))
    .and(olderThan(18))
    .and({ contains: { name:'John' } })
db.all(q)
</live-preview>

### Subqueries with Query Builders

Similarly, Query Builders and SQL Fragments can be embedded in other Query Builders to create complex subqueries.

<live-preview src="/mjs/subselect.mjs"></live-preview>

## WHERE convenience options

The `where` method can also be called with an object containing a number of convenience options to simplify creating
common queries with an object query. If needed `op` can be used to create options for a custom SQL operator.

<live-preview>
const search = {
    name: 'John',
    age: 27,
    city: 'Austin',
}
db.all($.from(Contact).where({ equals: search }))
db.all($.from(Contact).where({ notEquals: search }))
db.all($.from(Contact).where({ like: { name:'John', city:'Austin' } }))
db.all($.from(Contact).where({ notLike: { name:'John', city:'Austin' } }))
db.all($.from(Contact).where({ op: ['>=', { id:10, age:18 }] }))
</live-preview>

### LIKE convenience options

The `startsWith`, `endsWith` and `contains` options can be used to create **LIKE** conditions that match the start, 
end or any part of a string.

<live-preview>
$.from(Contact).where({ 
    startsWith: { city:'A' }, 
    contains: { email:'@gmail.' }, 
    endsWith: { name:'J' }, 
})
</live-preview>

### NULL check convenience options

Whilst the `isNull` and `notNull` convenience options can be used to create **IS NULL** and **IS NOT NULL** conditions.

<live-preview>
$.from(Contact).where({ 
    isNull: ['city', 'age'], 
    notNull: ['email'], 
})
</live-preview>

## Reset WHERE

Calling `where` with no arguments will reset the WHERE clause:

<live-preview>
$.from(Contact).where`name LIKE ${'John%'}`.where().and`id = ${1}`
</live-preview>
