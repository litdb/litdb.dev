Queries are highly composable where SQL Fragments can embed and merge the SQL and parameters of other Fragments

<live-preview>
const hasPurchasesOver = (c,total) => $`EXISTS (
       SELECT 1 FROM Order WHERE o.contactId = ${c.id} AND total >= ${total})`
const inCity = (...cities) => c => $`${c.city} IN (${cities})`
const createdAfter = after => $.sql('createdAt >= $after', { after })
const olderThan = age => ({ sql:'age >= $age', params: { age } })
const q = $.from(Contact,'c')
    .where(c => hasPurchasesOver(c,1000))
    .and(inCity('Austin','Chicago'))
    .and(createdAfter(new Date('2024-01-01')))
    .and(olderThan(18))
    .and({ contains: { name:'John' } })
db.all(q)
</live-preview>

For complex multi-part queries external references can be used across multiple Query Builders and SQL fragments
to easily create and compose multiple complex queries with shared references.

SQL Builders and SQL fragments can be embedded inside other query builders utilizing the full expressiveness of SQL
where their SQL and parameters are merged into the parent query.

<live-preview src="/mjs/composable.mjs"></live-preview>
