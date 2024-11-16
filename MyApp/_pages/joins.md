---
title: JOIN Examples
---

## Simple Join

Use `join` to create a new query builder with an additional table join. The `on` option is used to specify the join condition.

<live-preview>
$.from(Contact).join(Order, { on:(c,o) => $`${c.id} = ${o.contactId}` }).select('*')
</live-preview>

## Custom Join Types

Use `leftJoin`, `rightJoin`, `fullJoin`, `crossJoin` to create a new query builder with a specific join type.

<live-preview>
db.all($.from(Contact).leftJoin(Order, { on:(c,o) => $`${c.id} = ${o.contactId}` }).select('*'))
db.all($.from(Contact).rightJoin(Order, { on:(c,o) => $`${c.id} = ${o.contactId}` }).select('*'))
db.all($.from(Contact).fullJoin(Order, { on:(c,o) => $`${c.id} = ${o.contactId}` }).select('*'))
db.all($.from(Contact).crossJoin(Order, { on:(c,o) => $`${c.id} = ${o.contactId}` }).select('*'))
</live-preview>

## Multiple Joins

Multiple joins can be chained together to create complex queries. A new query builder is created for each join 
that's added containing references for all tables in the query in the order they were added. 

These references can be used in `where`, `select`, `groupBy`, `orderBy` methods to reference columns from each table.

<live-preview>
$.from(Order)
  .leftJoin(Contact, { on:(o,c) => $`${o.contactId} = ${c.id}` })
  .join(OrderItem,   { on:(_,i,o) => $`${i.orderId} = ${o.id}` })
  .leftJoin(Product, { on:(i,p) => $`${i.sku} = ${p.sku}` })
  .where((o,c,i,p) => $`${c.id} = ${1} AND ${p.cost} > ${100}`)
  .select((o,c,i,p) => $`${o.id}, ${c.name}, ${i.qty}, ${p.name}`)
</live-preview>

## Aliases

Each joined table can be assigned an alias using the `as` option. This alias is then used to reference the table in the query.

<live-preview>
$.from(Order,'o')
  .leftJoin(Contact, { on:(o,c) => $`${o.contactId} = ${c.id}`, as:'c' })
  .join(OrderItem, { on:(_,i,o) => $`${i.orderId} = ${o.id}`, as:'i' })
  .leftJoin(Product, { on:(i,p) => $`${i.sku} = ${p.sku}`, as:'p' })
  .where((o,c,i,p) => $`${c.id} = ${1} AND ${p.cost} > ${100}`)
  .select((o,c,i,p) => $`${o.id}, ${c.name}, ${i.qty}, ${p.name}`)
</live-preview>

## External References

Queries can be joined on external references which can be used across multiple query builders that can be composed together 
to create complex queries that reference other queries.

<live-preview>
const [ o, c, i, p ] = [ 
  $.ref(Order,'o'), $.ref(Contact,'c'), $.ref(OrderItem,'i'), $.ref(Product,'p') ]
const recentOrder = $.from(Order,'o2')
  .where(o2 => $`${o2.contactId} = ${c.id}`)
  .select(o2 => $`MAX(${o2.createdAt})`)
db.all($.from(o)
  .leftJoin(c, { on:(o,c) => $`${o.contactId} = ${c.id}`, as:'c' })
  .join(i, { on:(_,i,o) => $`${i.orderId} = ${o.id}`, as:'i' })
  .leftJoin(p, { on:(i,p) => $`${i.sku} = ${p.sku}`, as:'p' })
  .where`${o.createdAt} = (${recentOrder})`
  .select`${o.id}, ${c.name}, ${i.qty}, ${p.name}`)
</live-preview>
