---
title: INSERT Examples
---

## Simple INSERT

Insert a new entity into a table using the `db.insert` driver method:

<live-preview>
db.insert(new Contact({ name:'John', email:'john@email.com', age:27 }))
db.insert(new Product({ sku:'WIDGET', name:'Acme Widget', cost:10 }))
</live-preview>

## INSERT Multiple Rows

Insert multiple entities into a table using the `db.insertAll` driver method:

<live-preview>
db.insertAll([
    new Contact({ name:'John', email:'john@email.com', age:27 }),
    new Contact({ name:'Jane', email:'jane@email.com', age:31 })
])
</live-preview>

## INSERT Expression

When the full flexibility of SQL is needed, you can execute a SQL fragment directly:

<live-preview>
const { name, age } = { name:'John', age:27 }
db.run`INSERT INTO Contact (name,age) VALUES (${name},${age})`
</live-preview>