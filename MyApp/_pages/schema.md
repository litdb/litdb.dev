---
title: Schema APIs
---

:::info
All live examples use the data models defined in [/models](/models).
:::

## Create Table

<live-preview>
class Freight {
  id = 0
  name = ''
  cost = 0.0
}
Table(Freight, {
  columns: {
    id: { type:'INTEGER', autoIncrement:true },
    name: { type:'TEXT', required:true, unique:true, index:true },
    cost: { type:'MONEY', required:true }
  }
})
db.createTable(Freight)
db.createTable(Contact)
db.createTable(Order)
db.createTable(OrderItem)
db.createTable(Product)
</live-preview>

## Drop Table

<live-preview>
db.dropTable(Contact)
</live-preview>
