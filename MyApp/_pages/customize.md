---
title: Customize
---

## Custom Naming Strategy

App's can configure litdb to use a custom naming strategy for tables and columns by configuring the dialect's strategy. 

```ts
import { SnakeCaseStrategy } from "litdb"
import { connect } from "@litdb/postgres"

export const connection = connect({hostname, database, user, password})
export const { $, async: db, native:sql } = connection
connection.dialect.strategy = new SnakeCaseStrategy()
```

Where SnakeCaseStrategy is defined as returning table and column names in snake_case:

```ts
class SnakeCaseStrategy {
    tableName(table:string) : string { return snakeCase(table) }
    columnName(column:string) : string { return snakeCase(column) }
}
```

## Type Converters

litdb uses type converters to convert between JavaScript Objects and RDBMS data types. App's can configure litdb to use 
custom type converters by registering them with the driver's schema.

A Type Convert is an object with `toDb` and `fromDb` functions that convert between JavaScript and RDBMS data types.

```ts
interface TypeConverter {
    toDb(value: any): any;
    fromDb(value: any): any;
}
```

For example, this `DateConverter` is used to convert `Date` objects to and from MySQL's `DATETIME` format:

```ts
class DateConverter implements TypeConverter
{
    toDb(value: any) {
        const d = toDate(value)
        return d ? dateISOString(d).replace('T',' ') : null
    }
    fromDb(value: any) {
        if (!value) return null
        return toDate(value)
    }
}
```

Custom Type Converters can be registered with the driver's schema on the data type that they convert:

```ts
export const connection = connect({ host, database, user, password })
export const { $, async:db, native } = connection

connection.schema.converters['DATETIME'] = new DateTimeConverter()
```

## Register Converter for Mutliple Data Types

The `converterFor` utility function can be used to register a converter for multiple data types:

```ts
import { converterFor } from "litdb"

Object.assign(connection.schema.converters, 
    converterFor(new DateConverter(), "DATE", "DATETIME", "TIMESTAMP", "TIMESTAMPZ"))
```
