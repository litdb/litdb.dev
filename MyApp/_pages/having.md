---
title: HAVING Examples
---

## Simple HAVING

The `having` method can be used to filter the results of a `groupBy` query:

<live-preview>
$.from(Contact)
    .join(Order, { on:(c,o) => $`${c.id} = ${o.contactId}` })
    .groupBy(c => $`${c.city}`)
    .having(c => $`COUNT(${c.id}) > 5`)
    .select(c => $`${c.city}, COUNT(${c.id})`)
</live-preview>

## Multiple HAVING

Multiple having's can be added in one or multiple `having` methods:

<live-preview>
const q = $.from(Contact)
    .join(Order, { on:(c,o) => $`${c.id} = ${o.contactId}` })
    .groupBy(c => $`${c.city}`)
    .select(c => $`${c.city}, COUNT(${c.id})`)
    
db.all(q.clone().having((c,o) => $`COUNT(${c.id}) > 5  AND SUM(${o.total}) < 1000`))
db.all(q.clone()
    .having(c => $`COUNT(${c.id}) > 5`).having((_,o) => $`SUM(${o.total}) < 1000`))
</live-preview>

## HAVING Builder

When more flexibility is needed, `$.having` can be used to create a HAVING builder which can be constructed independently
of the query:

<live-preview>
$.from(Contact)
.join(Order, { on:(c,o) => $`${c.id} = ${o.contactId}` })
.groupBy(c => $`${c.city}`)
.having(
    $.having(Contact,Order)
        .add(c => $`COUNT(${c.id}) > 5`)
        .add((_,o) => $`SUM(${o.total}) < 1000`)
).select(c => $`${c.city}, COUNT(${c.id})`)
</live-preview>

## Reset HAVING

Calling `having` with no arguments will reset the ORDER BY clause:

<live-preview>
$.from(Contact).having`name`.having().select`name`
</live-preview>
