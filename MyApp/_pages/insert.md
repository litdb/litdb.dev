---
title: INSERT Examples
---

## Simple Insert

<live-preview>
db.insert(new Contact({ name:'John', email:'john@email.com', age:27 }))
db.insert(new Product({ sku:'W123', name:'Widget', cost:10 }))
</live-preview>

## Insert Multiple Rows

<live-preview>
db.insertAll([
    new Contact({ name:'John', email:'john@email.com', age:27 }),
    new Contact({ name:'Jane', email:'jane@email.com', age:31 })
])
</live-preview>
