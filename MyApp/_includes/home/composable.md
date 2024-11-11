Queries are highly composable where external references can be used across multiple Query Builders and SQL fragments
to easily create and compose multiple complex queries with shared references.

SQL Builders and SQL fragments can be embedded inside other query builders utilizing the full expressiveness of SQL 
where their SQL and parameters are merged into the parent query.

```ts
// External aliased table references used across multiple query builders
const [ c, o ] = [ $.ref(Contact,'c'), $.ref(Order,'o') ]

const now = new Date()
const monthAgo = new Date(now.setDate(now.getDate()-30)).toISOString().split('T')[0]
const last30Days = $.from(Order,'o2')
    .where(o2 => $`${o2.contactId} = ${c.id}`)
    .and(o2 => $`${o2.createdAt} >= ${monthAgo}`)
    .select(o2 => $`COUNT(${o2.id})`)

const recentOrder = $.from(Order,'o3')
    .where(o3 => $`${o3.contactId} = ${c.id}`)
    .select(o3 => $`MAX(${o3.createdAt})`)

// Example of SQL Fragment with parameter
const startOfYear = `2024-01-01`
const o4 = $.ref(Order,'o4')
const totalOrders = $`SELECT SUM(${o4.total}) 
     FROM ${o4} o4 
    WHERE ${o4.contactId} = ${c.id} 
      AND ${o4.createdAt} >= ${startOfYear}`

// Compose queries from multiple query builders and SQL fragments
const q = $.from(c)
    .join(o, { on:(c,o) => $`${c.id} = ${o.contactId}`})
    .where`${o.createdAt} = (${recentOrder})`
    .select`
        ${c.id}, 
        ${c.name}, 
        ${o.createdAt} AS recentOrder, 
        (${last30Days}) AS last30Days,
        (${totalOrders}) AS totalOrders`
    .orderBy`last30Days DESC`
```

Generated SQL

```sql
SELECT c."id", 
       c."name", 
       o."createdAt" AS recentOrder, 
       (SELECT COUNT(o2."id")
          FROM "Order" o2
         WHERE o2."contactId" = c."id"
           AND o2."createdAt" >= $_1) AS last30Days,
       (SELECT SUM(o4."total") 
          FROM "Order" o4
         WHERE o4."contactId" = c."id" 
           AND o4."createdAt" >= $_2) AS totalOrders
 FROM "Contact" c
 JOIN "Order" o ON c."id" = o."contactId"
WHERE o."createdAt" = (SELECT MAX(o3."createdAt")
        FROM "Order" o3
        WHERE o3."contactId" = c."id")
ORDER BY last30Days DESC
```

PARAMS

    _1: 2024-10-12
    _2: 2024-01-01

