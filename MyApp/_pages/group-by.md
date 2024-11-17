---
title: GROUP BY Examples
---

## Simple GROUP BY

`groupBy` works like Query Builder methods where it's called with the query's table references in the order they were added: 

<live-preview>
$.from(Contact)
    .join(Order, { on:(c,o) => $`${c.id} = ${o.contactId}` })
    .groupBy(c => $`${c.name}`)
    .select((c, o) => $`${c.name}, SUM(${o.total}) AS Total`)
</live-preview>

## Multiple GROUP BY

Multiple group by's can be added in one or multiple `groupBy` methods:

<live-preview>
const q = $.from(Contact,'c')
    .join(Order, { on:(c,o) => $`${c.id} = ${o.contactId}` })
    .select((c, o) => $`${c.name}, ${c.city}, SUM(${o.total})`)
db.all(q.clone().groupBy(c => $`${c.name}, ${c.city}`))
db.all(q.clone().groupBy(c => $`${c.name}`).groupBy(c => $`${c.city}`))
</live-preview>

## GROUP BY Builder

When more flexibility is needed, `$.groupBy` can be used to create a HAVING builder which can be constructed independently
of the query:

<live-preview>
$.from(Contact,'c')
    .join(Order, { as:'o', on:(c,o) => $`${c.id} = ${o.contactId}` })
    .join(OrderItem, { as:'i', on:(o,i) => $`${o.id} = ${i.orderId}` })
    .groupBy(
        $.groupBy(Contact,OrderItem)
            .add(c => $`${c.name}`)
            .add((_,i) => $`${i.sku}`)
    )
    .select((c,o,i) => $`${c.name}, ${i.sku}, SUM(${o.total}) AS total`)
</live-preview>

## Reset GROUP BY

Calling `groupBy` with no arguments will reset the GROUP BY clause:

<live-preview>
$.from(Contact).groupBy`name`.groupBy().select`name`
</live-preview>
