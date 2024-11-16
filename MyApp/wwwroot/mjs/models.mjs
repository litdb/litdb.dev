import { Table } from 'litdb'

export class Contact {
    constructor(data) { Object.assign(this, data) }
    id = 0
    name = ''
    age = 0 || undefined
    email = ''
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