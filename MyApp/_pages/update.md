---
title: UPDATE Examples
---

## Simple UPDATE

Simple updates can be executed directly on the litdb driver APIs which will update all properties of a data model:

<live-preview>
contact = new Contact({ id:1, name:'John', email:'john@mail.org' })
db.update(contact)
</live-preview>

## UPDATE Specific Properties

For updating specific properties of a data model, the `onlyProps` option can be used:

<live-preview>
db.update(new Contact({ id:1, email:'john@mail.org' }), { onlyProps:['email'] })
</live-preview>

## UPDATE Query Builder

When more flexibility is needed you can use `$.update()` to create an UPDATE query builder:

<live-preview>
db.run($.update(Contact).set({ age:41, city:'Austin' }).where($.idEquals(1)))
const { age, city, email } = { age:41, email:'john@mail.org' }
const q = $.update(Contact)
if (age) q.set({ age })
if (city) q.set({ city })
if (email) q.set({ email })
db.run(q.where($.idEquals(1)))
</live-preview>

## UPDATE Expression

When the full flexibility of SQL is needed, you can execute a SQL fragment directly:

<live-preview>
const { id, name, age } = { id:1, name:'John', age:27 }
db.run`UPDATE Contact SET name=${name}, age=${age} WHERE id=${id}`
</live-preview>