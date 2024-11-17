const hotProducts = ['WIDGET', 'GADGET', 'THING', 'GIZMO', 'DOODAD']
const qHot = $.from(OrderItem)
    .where(i => $`${i.sku} IN (${hotProducts})`)
    .groupBy(i => $`${i.id}`)
    .orderBy(i => $`SUM(${i.qty}) DESC`)
    .select(i => $`${i.id}`)
    .limit(10)

const contactIds = [1,2,3]
const q = $.from(Order, 'o')
    .leftJoin(Contact, { on:(o,c) => $`${c.id} = ${o.contactId}`, as:'c'})
    .join(OrderItem,   { on:(_,i,o) => $`${o.id} = ${i.orderId}`, as:'i'})
    .leftJoin(Product, { on:(i,p) => $`${i.sku} = ${p.sku}`, as:'p' })
    .where((o,c,i,p) => $`${o.contactId} IN (${contactIds})`)
    .or((o,c,i) => $`${i.id} IN (${qHot})`)
    .select((o,c,i,p) => $`${c.name}, ${o.id}, ${p.name}, ${i.qty}, ${o.total}`)
    .orderBy(o => $`${o.total}`)
    .limit(50, 100)

db.all(q)