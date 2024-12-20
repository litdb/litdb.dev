---
title: Models
---

Model definitions are a representation of your RDBMS tables and columns in your App's code that's used to
configure how your App's classes and properties map to your database tables and columns.

They're used for creating table schemas and is able to influence the SQL that's generated by query builders 
and how results are mapped between your data models and RDBMS.

They can be defined using a Fluent API to configure existing classes or by using JavaScript decorators to declaratively 
annotate classes. In both cases litdb's TypeScript definitions provide intelli-sense to assist you in annotating your models. 

## Fluent API

```ts
import { Table } from 'litdb'

export class Contact {
    constructor(data) { Object.assign(this, data) }
    id = 0
    name = ''
    age = 0 || undefined
    email = ''
    city = '' || undefined
    createdAt = new Date(2025,1,1)
}
export class Order {
    constructor(data) { Object.assign(this, data) }
    id = 0
    contactId = 0
    total = 0.0
    createdAt = new Date()
}
export class OrderItem {
    constructor(data) { Object.assign(this, data) }
    id = 0
    orderId = 0
    sku = ''
    qty = 0
    total = 0.0
}
export class Product {
    constructor(data) { Object.assign(this, data) }
    sku = ''
    name = ''
    cost = 0.0
}

Table(Contact, {
    columns: {
        id:        { type:"INTEGER",  autoIncrement:true },
        name:      { type:"TEXT",     required:true },
        age:       { type:"INTEGER" },
        email:     { type:"TEXT",     required:true, index:true, unique:true },
        city:      { type:"TEXT" },
        createdAt: { type:"DATETIME", defaultValue:"CURRENT_TIMESTAMP" },
    }
})
Table(Order, {
    columns: {
        id:        { type:"INTEGER",  autoIncrement:true },
        contactId: { type:"INTEGER",  required:true, references:{ table:Contact, on:["DELETE","CASCADE"] } },
        total:     { type:"MONEY",    required:true },
        createdAt: { type:"DATETIME", defaultValue:"CURRENT_TIMESTAMP" },
    }
})
Table(OrderItem, {
    columns: {
        id:      { type:"INTEGER", autoIncrement:true },
        orderId: { type:"INTEGER", required:true, references:{ table:Order,   on:["DELETE","RESTRICT"] } },
        sku:     { type:"TEXT",    required:true, references:{ table:Product, on:["DELETE","RESTRICT"] } },
        qty:     { type:"INTEGER", required:true },
        total:   { type:"MONEY",   required:true }
    }
})
Table(Product, {
    columns: {
        sku:  { type:"TEXT",  primaryKey:true },
        name: { type:"TEXT",  required:true, index:true, unique:true },
        cost: { type:"MONEY", required:true },
    }
})
```

## Declarative Annotations

TypeScript or JS build systems that support [TC39 decorators](https://github.com/tc39/proposal-decorators) can use the 
`@table` and `@column` decorators to define their data models, e.g: 

```ts
import { table, column, DefaultValues } from 'litdb'

@table()
export class Contact {
    constructor(data?: Partial<Contact>) { Object.assign(this, data) }

    @column("INTEGER", { autoIncrement: true })
    id = 0
    
    @column("TEXT", { required: true })
    name = ''
    
    @column("INTEGER")
    age?: number

    @column("TEXT", { required:true, index:true, unique:true })
    email = ''

    @column("TEXT")
    city = ''
    
    @column("DATETIME", { defaultValue:'CURRENT_TIMESTAMP' })
    createdAt = new Date()
}

@table()
export class Order {
    constructor(data?: Partial<Order>) { Object.assign(this, data) }

    @column("INTEGER", { autoIncrement:true })
    id: number = 0

    @column("INTEGER", { required:true, references:{ table:Contact, on:["DELETE","CASCADE"] } })
    contactId: number = 0

    @column("MONEY", { required:true})
    total: number = 0

    @column("DATETIME", { defaultValue:DefaultValues.NOW })
    createdAt = new Date()
}

@table()
export class OrderItem {
    @column("INTEGER", { autoIncrement:true })
    id: number = 0

    @column("INTEGER", { required:true, references:{ table:Order, on:["DELETE","RESTRICT"] } })
    orderId: number = 0

    @column("TEXT", { required:true, references:{ table:Product, on:["DELETE","RESTRICT"] } })
    sku: string = ''

    @column("INTEGER", { required:true })
    qty: number = 0

    @column("MONEY", { required:true })
    total: number = 0
}

@table()
export class Product {
    @column("TEXT", { primaryKey:true })
    sku = ''
    @column("TEXT", { required:true, index:true, unique:true })
    name = ''
    @column("MONEY", { required:true })
    cost = 0.0
}
```

### Custom Data Types

When needed, a `Symbol` can be used to define custom data types, e.g:

```ts
class Address {
    @column(Symbol("POINT"))
    location
}
```
