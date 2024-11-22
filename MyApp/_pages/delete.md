---
title: DELETE Examples
---

## Simple DELETE

Delete an entity using the `db.delete` driver method:

<live-preview>
db.delete(new Contact({ id:1, name:'John', email:'john@email.com', age:27 }))
</live-preview>

## DELETE Query Builder
    
When a custom query is needed you can use `$.deleteFrom()` to create a DELETE query builder:

<live-preview>
const yearAgo = new Date(new Date().setFullYear(new Date().getFullYear() - 1))
db.run($.deleteFrom(Order).where(c => $`${c.createdAt} < ${yearAgo}`))
</live-preview>

## DELETE Expression

When the full flexibility of SQL is needed, you can execute a SQL fragment directly:

<live-preview>
const name = 'John'
db.run`DELETE FROM Contact WHERE name = ${name}`
</live-preview>