// Use external aliased table references across multiple query builders
const c = $.ref(Contact,'c'),
      o = $.ref(Order,'o')

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
    .join(o, $`${c.id} = ${o.contactId}`)
    .where`${o.createdAt} = (${recentOrder})`
    .select`${c.id}, 
       ${c.name}, 
       ${o.createdAt}, 
       (${last30Days}) AS last30Days,
       (${totalOrders}) AS totalOrders`
    .orderBy`last30Days DESC`

db.all(q)