---
title: ORDER BY Examples
---

## Simple ORDER BY

Like other Query Builder methods, `orderBy` is called with the query's table references in the order they were added:

<live-preview>
$.from(Contact)
    .join(Order, { on:(c,o) => $`${c.id} = ${o.contactId}` })
    .select((c, o) => $`${c.name}, ${o.total}`)
    .orderBy(c => $`${c.name}`)
</live-preview>

## Multiple ORDER BY

Multiple order by's can be added in one or multiple `orderBy` methods:

<live-preview>
const q = $.from(Contact)
    .join(Order, { on:(c,o) => $`${c.id} = ${o.contactId}` })
    .select((c, o) => $`${c.name}, ${c.city}, ${o.total}`)
db.all(q.clone().orderBy(c => $`${c.name}, ${c.city}`))
db.all(q.clone().orderBy(c => $`${c.name}`).orderBy(c => $`${c.city}`))
</live-preview>

## ORDER BY Builder

When more flexibility is needed, `$.orderBy` can be used to create a ORDER BY builder which can be constructed independently
of the query:

<live-preview>
$.from(Contact,'c')
    .join(Order, { as:'o', on:(c,o) => $`${c.id} = ${o.contactId}` })
    .select((c, o) => $`${c.name}, ${o.total}`)
    .orderBy(
        $.orderBy(Contact,Order)
        .add(c => $`${c.name}`)
        .add((_,o) => $`${o.total} DESC`)
    )
</live-preview>

## Reset ORDER BY

Calling `orderBy` with no arguments will reset the ORDER BY clause:

<live-preview>
$.from(Contact).orderBy`name`.orderBy().select`name`
</live-preview>
