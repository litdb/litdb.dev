// src/utils.ts
function isDate(d) {
  return d && Object.prototype.toString.call(d) === "[object Date]" && !isNaN(d);
}
function toDate(s) {
  return !s ? null : isDate(s) ? s : s[0] == "/" ? new Date(parseFloat(/Date\(([^)]+)\)/.exec(s)[1])) : new Date(s);
}
function propsWithValues(obj) {
  return Object.keys(obj).filter((k) => obj[k] != null);
}
function uniqueKeys(rows) {
  let to = [];
  rows.forEach((o) => Object.keys(o).forEach((k) => {
    if (to.indexOf(k) === -1) {
      to.push(k);
    }
  }));
  return to;
}
function pick(input, keys) {
  if (Array.isArray(input)) {
    return input.map((item) => keys.reduce((obj, key) => ({
      ...obj,
      [key]: item[key]
    }), {}));
  }
  return keys.reduce((obj, key) => ({
    ...obj,
    [key]: input[key]
  }), {});
}
function omit(input, keys) {
  if (Array.isArray(input)) {
    return input.map((item) => {
      const result2 = { ...item };
      keys.forEach((key) => delete result2[key]);
      return result2;
    });
  }
  const result = { ...input };
  keys.forEach((key) => delete result[key]);
  return result;
}
function leftPart(s, needle) {
  if (s == null)
    return null;
  let pos = s.indexOf(needle);
  return pos == -1 ? s : s.substring(0, pos);
}
function toStr(value) {
  return typeof value == "symbol" ? `:${value.description ?? ""}` : `${value}`;
}
function nextParam(params) {
  return "_" + nextParamVal(params);
}
function nextParamVal(params) {
  const positional = Object.keys(params).map((x) => x[0] === "_" ? parseInt(x.substring(1)) : NaN).filter((x) => !isNaN(x));
  return positional.length == 0 ? 1 : Math.max(...positional) + 1;
}
function mergeParams(params, f) {
  let sql = f.sql;
  const hasConflicts = Object.keys(f.params).some((x) => (x in params));
  if (!hasConflicts) {
    for (const [key, value] of Object.entries(f.params)) {
      params[key] = value;
    }
    return sql;
  }
  const startIndex = nextParamVal(params);
  const newMapping = {};
  let i = 0;
  for (const [key, _] of Object.entries(f.params)) {
    newMapping[key] = "_" + (startIndex + i++);
  }
  for (const [key, value] of Object.entries(f.params).reverse()) {
    const nextValue = newMapping[key];
    sql = sql.replaceAll(`\$${key}`, `\$${nextValue}`);
    params[nextValue] = value;
  }
  return sql;
}
function asType(cls) {
  if (!IS.obj(cls) && !IS.fn(cls))
    throw new Error(`invalid argument: ${typeof cls}`);
  const ref = cls.$ref ? cls : undefined;
  return !cls?.$ref && cls.tables ? cls.table : ref ? ref.$ref.cls : cls;
}
function asRef(cls) {
  return IS.obj(cls) && cls.$ref ? cls : undefined;
}

class IS {
  static arr(o) {
    return Array.isArray(o);
  }
  static rec(o) {
    return typeof o == "object";
  }
  static obj(o) {
    return typeof o == "object";
  }
  static fn(o) {
    return typeof o == "function";
  }
  static str(o) {
    return typeof o == "string";
  }
  static num(o) {
    return typeof o == "number";
  }
  static sym(o) {
    return typeof o == "symbol";
  }
  static tpl(o) {
    return IS.arr(o) && "raw" in o;
  }
}
function snakeCase(s) {
  return (s || "").replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
}
function clsName(name, ...args) {
  if (!args || !args.length)
    return name;
  const argName = (o) => IS.str(o) ? o : ("name" in o) ? o.name : ("constructor" in o) && ("name" in o.constructor) ? o.constructor.name : "";
  return `${name}<${Array.from(args).map(argName).join(",")}>`;
}
function isQuoted(name) {
  return name && (name[0] == '"' || name[0] == "`");
}

// src/meta.ts
var type = Symbol("type");

class Meta {
  cls;
  static metadata = {};
  constructor(cls) {
    this.cls = cls;
    if (!cls)
      throw new Error(`Class must be provided`);
    if (!cls.$type)
      throw new Error(`Class ${cls.name ?? cls} have a \$type property`);
  }
  static assertClass(table) {
    if (!table)
      throw new Error(`Class must be provided`);
    const cls = table?.constructor?.$id ? table?.constructor : table.$id ? table : null;
    if (!cls) {
      const name = table?.name ?? table?.constructor?.name;
      if (!name)
        throw new Error(`Class or constructor function required`);
      else if (IS.fn(table) || IS.fn(table.constructor))
        throw new Error(`${name} is not a Table class, missing @table?`);
      else
        throw new Error(`${name} is not a Table class with metadata, missing @table?`);
    }
    return cls;
  }
  static assertTable(table) {
    const cls = Meta.assertClass(table);
    if (!cls.$type?.table) {
      throw new Error(`${cls.name} does not have a @table annotation`);
    }
    if (!cls.$props || !cls.$props.find((x) => x.column)) {
      throw new Error(`${cls.name} does not have any columns, mssing @column?`);
    }
    return cls;
  }
  static assert(table) {
    const cls = Meta.assertClass(table);
    const id = cls.$id;
    return Meta.metadata[id] ?? (Meta.metadata[id] = new Meta(Meta.assertTable(cls)));
  }
  get name() {
    return this.cls.$type?.name ?? this.cls.name;
  }
  get tableName() {
    const cls = this.cls;
    const ret = cls.$type?.table?.alias ?? cls.$type?.name ?? cls.name;
    if (!ret)
      throw new Error(`Table name not found for ${cls.name}`);
    return ret;
  }
  get type() {
    return this.cls.$type;
  }
  get table() {
    const ret = this.type.table;
    if (!ret)
      throw new Error(`Table definition not found for ${this.cls.name}`);
    return ret;
  }
  get props() {
    return this.cls.$props ?? [];
  }
  get columns() {
    return this.props.filter((x) => x.column).map((x) => x.column);
  }
}

// src/converters.ts
function converterFor(converter, ...dataTypes) {
  const to = {};
  for (const dataType of dataTypes) {
    to[dataType] = converter;
  }
  return to;
}

class DateTimeConverter {
  static instance = new DateTimeConverter;
  toDb(value) {
    const d = toDate(value);
    return d ? d.toISOString() : null;
  }
  fromDb(value) {
    if (!value)
      return null;
    return toDate(value);
  }
}

// src/schema.ts
var DriverRequired = `Missing Driver Implementation, see: https://github.com/litdb/litdb`;
var DriverRequiredProxy = new Proxy({}, {
  get: (target, key) => {
    throw new Error(DriverRequired);
  }
});
function assertSql(sql) {
  if (!IS.rec(sql) || !sql.sql) {
    const desc = IS.sym(sql) ? sql.description : IS.arr(sql) ? "Array" : `${sql}`;
    throw new Error(`Expected ${"sql`...`"} fragment, received: ${desc}`);
  }
  return sql;
}

class Schema {
  dialect;
  constructor(dialect) {
    this.dialect = dialect;
  }
  converters = {
    ...converterFor(DateTimeConverter.instance, "DATE", "DATETIME", "TIMESTAMP", "TIMESTAMPZ")
  };
  sqlTableNames(schema) {
    throw new Error(DriverRequired);
  }
  sqlColumnDefinition(column) {
    throw new Error(DriverRequired);
  }
  sqlForeignKeyDefinition(table, column) {
    throw new Error(DriverRequired);
  }
  sqlIndexDefinition(table, column) {
    throw new Error(DriverRequired);
  }
  dropTable(table) {
    const meta = Meta.assert(table);
    let sql = `DROP TABLE IF EXISTS ${this.dialect.quoteTable(meta.tableName)}`;
    return sql;
  }
  createTable(table) {
    const meta = Meta.assert(table);
    const columns = meta.columns;
    let sqlColumns = columns.map((c) => this.sqlColumnDefinition(c));
    const foreignKeys = columns.filter((c) => c.references).map((c) => this.sqlForeignKeyDefinition(meta.table, c));
    const definitions = [
      sqlColumns,
      foreignKeys
    ].filter((x) => x.length).map((x) => x.join(",\n  ")).join(",\n  ");
    let sql = `CREATE TABLE ${this.dialect.quoteTable(meta.tableName)} (\n  ${definitions}\n);\n`;
    const indexes = columns.filter((c) => c.index).map((c) => `${this.sqlIndexDefinition(meta.table, c)};`);
    if (indexes.length > 0) {
      sql += indexes.join("\n");
    }
    return sql;
  }
  insert(table, options) {
    const meta = Meta.assert(table);
    let props = meta.props.filter((x) => x.column);
    if (options?.onlyProps) {
      props = props.filter((c) => options.onlyProps.includes(c.name));
    }
    let columns = props.map((x) => x.column).filter((c) => !c.autoIncrement);
    let sqlColumns = columns.map((c) => `${this.dialect.quoteColumn(c.name)}`).join(", ");
    let sqlParams = columns.map((c) => `\$${c.name}`).join(", ");
    let sql = `INSERT INTO ${this.dialect.quoteTable(meta.tableName)} (${sqlColumns}) VALUES (${sqlParams})`;
    return sql;
  }
  update(table, options) {
    const meta = Meta.assert(table);
    let props = options?.onlyProps ? meta.props.filter((c) => options.onlyProps.includes(c.name) || c.column?.primaryKey) : meta.props.filter((x) => x.column);
    const primaryKeys = props.filter((c) => c.column?.primaryKey);
    if (!primaryKeys.length)
      throw new Error(`${meta.name} does not have a PRIMARY KEY`);
    const columns = props.map((x) => x.column);
    const setColumns = columns.filter((c) => !c.primaryKey);
    const whereColumns = columns.filter((c) => c.primaryKey);
    const setSql = setColumns.map((c) => `${this.dialect.quoteColumn(c.name)}=\$${c.name}`).join(", ");
    const whereSql = whereColumns.map((c) => `${this.dialect.quoteColumn(c.name)} = \$${c.name}`).join(" AND ");
    let sql = `UPDATE ${this.dialect.quoteTable(meta.tableName)} SET ${setSql}`;
    if (whereSql) {
      sql += ` WHERE ${whereSql}`;
    } else {
      throw new Error(`No WHERE clause exists for UPDATE ${meta.tableName}`);
    }
    return sql;
  }
  delete(table, options) {
    const meta = Meta.assert(table);
    let props = meta.props.filter((x) => x.column);
    const columns = props.map((x) => x.column);
    const whereColumns = columns.filter((c) => c.primaryKey);
    let whereSql = whereColumns.map((c) => `${this.dialect.quoteColumn(c.name)} = \$${c.name}`).join(" AND ");
    if (options?.where) {
      let sql2 = whereSql ? " AND " : " WHERE ";
      const where = IS.arr(options.where) ? options.where : [options.where];
      whereSql += sql2 + where.join(" AND ");
    }
    let sql = `DELETE FROM ${this.dialect.quoteTable(meta.tableName)}`;
    if (whereSql) {
      sql += ` WHERE ${whereSql}`;
    } else {
      throw new Error(`No WHERE clause exists for DELETE ${meta.tableName}`);
    }
    return sql;
  }
  toDbBindings(table) {
    const values = [];
    const meta = Meta.assert(table.constructor);
    const props = meta.props.filter((x) => x.column);
    props.forEach((x) => {
      const value = table[x.column.name];
      const converter = this.converters[x.column.type];
      if (converter) {
        const dbValue = converter.toDb(value);
        values.push(dbValue);
      } else {
        values.push(value);
      }
    });
    return values;
  }
  toDbObject(table, options) {
    const values = {};
    const meta = Meta.assert(table.constructor);
    const props = meta.props.filter((x) => x.column);
    for (const x of props) {
      if (options?.onlyProps && !options.onlyProps.includes(x.name))
        continue;
      const value = table[x.name];
      const converter = this.converters[x.column.type];
      if (converter) {
        const dbValue = converter.toDb(value);
        values[x.column.name] = dbValue;
      } else {
        values[x.column.name] = value;
      }
    }
    return values;
  }
}

// src/connection.ts
class DbConnection {
  connection;
  driver;
  $;
  schema;
  constructor(connection) {
    this.connection = connection;
    this.$ = connection.$;
    this.driver = connection.driver;
    this.schema = this.$.schema = connection.driver.schema;
  }
  get sync() {
    if (this.driver.sync == null) {
      throw new Error(`${this.$.name} does not support sync APIs`);
    }
    return this.driver.sync;
  }
  quote(symbol) {
    return this.$.quote(symbol);
  }
  insert(row, options) {
    return Promise.resolve(this.sync.insert(row, options));
  }
  insertAll(rows, options) {
    return Promise.resolve(this.sync.insertAll(rows, options));
  }
  listTables() {
    return Promise.resolve(this.sync.listTables());
  }
  dropTable(table) {
    return Promise.resolve(this.sync.dropTable(table));
  }
  createTable(table) {
    return Promise.resolve(this.sync.createTable(table));
  }
  all(strings, ...params) {
    return Promise.resolve(this.sync.all(strings, ...params));
  }
  one(strings, ...params) {
    return Promise.resolve(this.sync.one(strings, ...params));
  }
  column(strings, ...params) {
    return Promise.resolve(this.sync.column(strings, ...params));
  }
  value(strings, ...params) {
    return Promise.resolve(this.sync.value(strings, ...params));
  }
  arrays(strings, ...params) {
    return Promise.resolve(this.sync.arrays(strings, ...params));
  }
  array(strings, ...params) {
    return Promise.resolve(this.sync.array(strings, ...params));
  }
  exec(strings, ...params) {
    return Promise.resolve(this.sync.exec(strings, ...params));
  }
  run(strings, ...params) {
    return Promise.resolve(this.sync.run(strings, ...params));
  }
  prepare(strings, ...params) {
    if (IS.tpl(strings)) {
      let stmt = this.connection.prepare(strings, ...params);
      return [stmt, params];
    } else if (IS.str(strings)) {
      if ("build" in strings) {
        let query = strings.build();
        let stmt = this.connection.prepare(query.sql);
        return [stmt, query.params];
      } else if ("sql" in strings) {
        let stmt = this.connection.prepare(strings.sql);
        return [stmt, strings.params ?? {}];
      }
    }
    throw new Error(`Invalid argument: ${toStr(strings)}`);
  }
}

class SyncDbConnection {
  connection;
  driver;
  $;
  schema;
  constructor(connection) {
    this.connection = connection;
    this.$ = connection.$;
    this.driver = connection.driver;
    this.schema = this.$.schema = connection.driver.schema;
  }
  quote(symbol) {
    return this.$.quote(symbol);
  }
  insert(row, options) {
    const ret = { changes: 0, lastInsertRowid: 0 };
    if (!row)
      return ret;
    const cls = row.constructor;
    if (options?.onlyProps || options?.onlyWithValues) {
      const onlyProps = options?.onlyProps ?? propsWithValues(row);
      const onlyOptions = { onlyProps };
      let stmt = this.connection.prepareSync(this.schema.insert(cls, onlyOptions));
      const dbRow = this.schema.toDbObject(row, onlyOptions);
      return stmt.execSync(dbRow);
    } else {
      let stmt = this.connection.prepareSync(this.schema.insert(cls));
      const dbRow = this.schema.toDbObject(row);
      return stmt.execSync(dbRow);
    }
  }
  insertAll(rows, options) {
    const ret = { changes: 0, lastInsertRowid: 0 };
    if (rows.length == 0)
      return ret;
    const cls = rows[0].constructor;
    if (options?.onlyProps || options?.onlyWithValues) {
      for (const row of rows) {
        const last = this.insert(row, options);
        ret.changes += last.changes;
        ret.lastInsertRowid = last.lastInsertRowid;
      }
    } else {
      let last = null;
      let stmt = this.connection.prepareSync(this.schema.insert(cls));
      for (const row of rows) {
        const dbRow = this.schema.toDbObject(row);
        last = stmt.execSync(dbRow);
        ret.changes += last.changes;
        ret.lastInsertRowid = last.lastInsertRowid;
      }
    }
    return ret;
  }
  update(row, options) {
    const ret = { changes: 0, lastInsertRowid: 0 };
    if (!row)
      return ret;
    const cls = row.constructor;
    if (options?.onlyProps || options?.onlyWithValues) {
      const pkNames = cls.$props.filter((x) => x.column?.primaryKey).map((x) => x.column.name);
      const onlyProps = Array.from(new Set([...options?.onlyProps ?? propsWithValues(row), ...pkNames]));
      const onlyOptions = { onlyProps };
      let stmt = this.connection.prepareSync(this.schema.update(cls, onlyOptions));
      const dbRow = this.schema.toDbObject(row, onlyOptions);
      return stmt.execSync(dbRow);
    } else {
      let stmt = this.connection.prepareSync(this.schema.update(cls));
      const dbRow = this.schema.toDbObject(row);
      return stmt.execSync(dbRow);
    }
  }
  delete(row, options) {
    const ret = { changes: 0, lastInsertRowid: 0 };
    if (!row)
      return ret;
    const cls = row.constructor;
    let stmt = this.connection.prepareSync(this.schema.delete(cls, options));
    const meta = Meta.assert(cls);
    const pkColumns = meta.props.filter((p) => p.column?.primaryKey);
    const onlyProps = pkColumns.map((p) => p.name);
    const dbRow = this.schema.toDbObject(row, { onlyProps });
    return stmt.execSync(dbRow);
  }
  listTables() {
    return this.column({ sql: this.schema.sqlTableNames(), params: {} });
  }
  dropTable(table) {
    let stmt = this.connection.prepareSync(this.schema.dropTable(table));
    return stmt.execSync();
  }
  createTable(table) {
    let stmt = this.connection.prepareSync(this.schema.createTable(table));
    return stmt.execSync();
  }
  prepareSync(str, ...params) {
    if (IS.tpl(str)) {
      let stmt = this.connection.prepareSync(str, ...params);
      return [stmt, params, undefined];
    } else if (IS.obj(str)) {
      if ("build" in str) {
        let query = str.build();
        let stmt = this.connection.prepareSync(query.sql);
        return [stmt, query.params ?? {}, query.into];
      } else if ("sql" in str) {
        let sql = str.sql;
        let params2 = str.params ?? {};
        let stmt = this.connection.prepareSync(sql);
        return [stmt, params2, str.into];
      }
    }
    throw new Error(`Invalid argument: ${toStr(str)}`);
  }
  all(strings, ...params) {
    const [stmt, p, into] = this.prepareSync(strings, ...params);
    if (into) {
      const use = stmt.as(into);
      return Array.isArray(p) ? use.allSync(...p) : use.allSync(p);
    } else {
      return Array.isArray(p) ? stmt.allSync(...p) : stmt.allSync(p);
    }
  }
  one(strings, ...params) {
    const [stmt, p, into] = this.prepareSync(strings, ...params);
    if (into) {
      const use = stmt.as(into);
      return Array.isArray(p) ? use.oneSync(...p) : use.oneSync(p);
    } else {
      return Array.isArray(p) ? stmt.oneSync(...p) : stmt.oneSync(p);
    }
  }
  column(strings, ...params) {
    const [stmt, p] = this.prepareSync(strings, ...params);
    return Array.isArray(p) ? stmt.arraysSync(...p).map((x) => x[0]) : stmt.arraysSync(p).map((x) => x[0]);
  }
  value(strings, ...params) {
    const [stmt, p, into] = this.prepareSync(strings, ...params);
    const value = Array.isArray(p) ? stmt.valueSync(...p) : stmt.valueSync(p);
    if (into) {
      if (into === Boolean) {
        return !!value;
      }
    }
    return value;
  }
  arrays(strings, ...params) {
    const [stmt, p] = this.prepareSync(strings, ...params);
    return Array.isArray(p) ? stmt.arraysSync(...p) : stmt.arraysSync(p);
  }
  array(strings, ...params) {
    const [stmt, p] = this.prepareSync(strings, ...params);
    return Array.isArray(p) ? stmt.arraySync(...p) : stmt.arraySync(p);
  }
  exec(strings, ...params) {
    const [stmt, p] = this.prepareSync(strings, ...params);
    return Array.isArray(p) ? stmt.execSync(...p) : stmt.execSync(p);
  }
  run(strings, ...params) {
    const [stmt, p] = this.prepareSync(strings, ...params);
    if (Array.isArray(p)) {
      stmt.runSync(...p);
    } else {
      stmt.runSync(p);
    }
  }
}

class ConnectionBase {
  driver;
  $;
  async;
  sync;
  schema;
  dialect;
  constructor(driver) {
    this.driver = driver;
    this.$ = driver.$;
    this.schema = this.$.schema = driver.schema;
    this.dialect = driver.dialect;
    this.async = new DbConnection(this);
    this.sync = new SyncDbConnection(this);
  }
  prepare(sql, ...params) {
    throw new Error(DriverRequired);
  }
  prepareSync(sql, ...params) {
    throw new Error(DriverRequired);
  }
}

class DefaultStrategy {
  tableName(table) {
    return table;
  }
  columnName(column) {
    return column;
  }
  tableFromDef(def) {
    return def.alias ?? def.name;
  }
}

class SnakeCaseStrategy {
  tableName(table) {
    return snakeCase(table);
  }
  columnName(column) {
    return snakeCase(column);
  }
  tableFromDef(def) {
    return snakeCase(def.alias ?? def.name);
  }
}

class FilterConnection {
  db;
  fn;
  $;
  orig;
  constructor(db, fn) {
    this.db = db;
    this.fn = fn;
    this.orig = db.connection;
    db.connection = this;
    this.$ = db.$;
  }
  get driver() {
    return this.db.driver;
  }
  prepareSync(sql, ...params) {
    this.fn(sql, params);
    return this.orig.prepareSync(sql, ...params);
  }
  release() {
    this.db.connection = this.orig;
  }
}
function useFilter(db, filter) {
  return new FilterConnection(db, filter);
}

// src/inspect.ts
function alignLeft(str, len, pad = " ") {
  if (len < 0)
    return "";
  let aLen = len + 1 - str.length;
  if (aLen <= 0)
    return str;
  return pad + str + pad.repeat(len + 1 - str.length);
}
function alignCenter(str, len, pad = " ") {
  if (len < 0)
    return "";
  if (!str)
    str = "";
  let nLen = str.length;
  let half = Math.floor(len / 2 - nLen / 2);
  let odds = Math.abs(nLen % 2 - len % 2);
  return pad.repeat(half + 1) + str + pad.repeat(half + 1 + odds);
}
function alignRight(str, len, pad = " ") {
  if (len < 0)
    return "";
  let aLen = len + 1 - str.length;
  if (aLen <= 0)
    return str;
  return pad.repeat(len + 1 - str.length) + str + pad;
}
function alignAuto(obj, len, pad = " ") {
  let str = `${obj}`;
  if (str.length <= len) {
    return IS.num(obj) ? alignRight(str, len, pad) : alignLeft(str, len, pad);
  }
  return str;
}

class Inspect {
  static dump(obj) {
    if (IS.rec(obj)) {
      if (IS.fn(obj.build)) {
        obj = obj.build();
      }
      if ("sql" in obj && "params" in obj) {
        return [obj.sql, `PARAMS ${Inspect.dump(obj.params).replaceAll('"', "")}`].join("\n") + "\n";
      }
    }
    let to = JSON.stringify(obj, null, 4);
    return to.replace(/\\"/g, "");
  }
  static printDump(obj) {
    console.log(Inspect.dump(obj));
  }
  static dumpTable(rows) {
    let mapRows = rows;
    let keys = uniqueKeys(mapRows);
    let colSizes = {};
    keys.forEach((k) => {
      let max = k.length;
      mapRows.forEach((row) => {
        let col = row[k];
        if (col != null) {
          let valSize = `${col}`.length;
          if (valSize > max) {
            max = valSize;
          }
        }
      });
      colSizes[k] = max;
    });
    let colSizesLength = Object.keys(colSizes).length;
    let rowWidth = Object.keys(colSizes).map((k) => colSizes[k]).reduce((p, c) => p + c, 0) + colSizesLength * 2 + (colSizesLength + 1);
    let sb = [];
    sb.push(`+${"-".repeat(rowWidth - 2)}+`);
    let head = "|";
    keys.forEach((k) => head += alignCenter(k, colSizes[k]) + "|");
    sb.push(head);
    sb.push(`|${"-".repeat(rowWidth - 2)}|`);
    mapRows.forEach((row) => {
      let to = "|";
      keys.forEach((k) => to += "" + alignAuto(row[k], colSizes[k]) + "|");
      sb.push(to);
    });
    sb.push(`+${"-".repeat(rowWidth - 2)}+`);
    return sb.join("\n");
  }
  static printDumpTable(rows) {
    console.log(Inspect.dumpTable(rows));
  }
}
function Watch(fn) {
  try {
    const results = fn();
    if (!results)
      return;
    for (const key in results) {
      console.log(`${key}:`);
      const val = results[key];
      if (IS.arr(val)) {
        console.table(val);
      } else {
        if (!IS.rec(val))
          console.log(toStr(val).trim());
        else
          console.log(Inspect.dump(val));
      }
      console.log();
    }
  } catch (e) {
    console.error(`${e}`);
  }
}

// src/sql.ts
class Sql {
  static ops = {
    equals: "=",
    "=": "=",
    notEquals: "<>",
    "!=": "!=",
    like: "LIKE",
    startsWith: "LIKE",
    endsWith: "LIKE",
    contains: "LIKE",
    notLike: "NOT LIKE",
    in: "IN",
    notIn: "NOT IN",
    isNull: "IS NULL",
    notNull: "IS NOT NULL"
  };
  static opKeys = Object.keys(Sql.ops);
  static create(dialect) {
    function $(strings, ...params) {
      if (IS.tpl(strings)) {
        let sb = "";
        const sqlParams = {};
        for (let i = 0;i < strings.length; i++) {
          sb += strings[i];
          if (i >= params.length)
            continue;
          const value = params[i];
          if (IS.sym(value)) {
            sb += value.description ?? "";
          } else if (IS.arr(value)) {
            let sbIn = "";
            for (const item of value) {
              const paramIndex = Object.keys(sqlParams).length + 1;
              const name = `_${paramIndex}`;
              if (sbIn.length)
                sbIn += ",";
              sbIn += `\$${name}`;
              sqlParams[name] = item;
            }
            sb += sbIn;
          } else if (IS.rec(value) && value.$ref) {
            sb += dialect.quoteTable(Meta.assert(value.$ref.cls).tableName);
          } else if (IS.obj(value) && IS.fn(value.build)) {
            const frag = value.build();
            const replaceParams = ["limit", "offset"];
            if (Object.keys(frag.params).some((x) => replaceParams.includes(x))) {
              let i2 = nextParamVal(sqlParams);
              for (let orig of replaceParams) {
                if (orig in frag.params) {
                  const p = "_" + i2++;
                  frag.params[p] = frag.params[orig];
                  delete frag.params[orig];
                  frag.sql = frag.sql.replaceAll(`\$${orig}`, `\$${p}`);
                }
              }
            }
            sb += mergeParams(sqlParams, frag).replaceAll("\n", "\n      ");
          } else if (IS.obj(value) && IS.str(value.sql)) {
            const frag = value;
            sb += mergeParams(sqlParams, frag).replaceAll("\n", "\n      ");
          } else if (value) {
            const paramIndex = Object.keys(sqlParams).length + 1;
            const name = `_${paramIndex}`;
            sb += `\$${name}`;
            sqlParams[name] = value;
          }
        }
        return { sql: sb, params: sqlParams };
      } else if (IS.str(strings)) {
        return { sql: strings, params: params[0] };
      } else
        throw new Error(`sql(${typeof strings}) is invalid`);
    }
    $.schema = new Schema(dialect);
    $.dialect = dialect;
    $.quote = dialect.quote.bind(dialect);
    $.quoteColumn = dialect.quoteColumn.bind(dialect);
    $.quoteTable = dialect.quoteTable.bind(dialect);
    function quoteProp(meta, prop) {
      const p = meta.props.find((x) => x.name == prop)?.column;
      if (!p)
        throw new Error(`${meta.name} does not have a column property ${prop}`);
      return dialect.quoteColumn(p.name);
    }
    $.ref = function(cls, as) {
      const meta = Meta.assert(cls);
      if (as == null)
        as = dialect.quoteTable(meta.tableName);
      const get = (target, key) => key == "$ref" ? { cls, as } : Symbol(target.prefix + quoteProp(meta, IS.str(key) ? key : key.description));
      const p = new Proxy({ prefix: as ? as + "." : "", meta }, { get });
      return p;
    };
    $.refs = function refs(...classes) {
      return classes.map((cls) => $.ref(cls));
    };
    $.fragment = function(sql, params = {}) {
      return IS.rec(sql) ? { sql: mergeParams(params, sql), params } : { sql, params };
    };
    $.from = function(table, alias) {
      const cls = asType(table);
      const ref = asRef(table) ?? $.ref(table, alias ?? "");
      return new SelectQuery($, [cls], [Meta.assert(cls)], [ref]);
    };
    $.update = function(table) {
      return new UpdateQuery($, [table], [Meta.assert(table)], [$.ref(table, "")]);
    };
    $.deleteFrom = function(table) {
      return new DeleteQuery($, [table], [Meta.assert(table)], [$.ref(table, "")]);
    };
    $.join = function(...tables) {
      return new SqlJoinBuilder($, ...tables);
    };
    $.groupBy = function(...tables) {
      return new SqlGroupByBuilder($, ...tables);
    };
    $.having = function(...tables) {
      return new SqlHavingBuilder($, ...tables);
    };
    $.orderBy = function(...tables) {
      return new SqlOrderByBuilder($, ...tables);
    };
    $.idEquals = function hasId(id) {
      return (x) => $.fragment($`${x.id} = $id`, { id });
    };
    $.log = function(obj) {
      console.log(Inspect.dump(obj));
    };
    $.dump = function(obj) {
      console.log(Inspect.dumpTable(obj));
    };
    return $;
  }
}

class SqlJoinBuilder {
  $;
  get table() {
    return this.tables[0];
  }
  tables;
  refs;
  exprs = [];
  params = {};
  alias = "";
  buildOn;
  constructor($, ...tables) {
    this.$ = $;
    this.tables = tables;
    this.refs = this.tables.map((x) => this.$.ref(x));
  }
  join(expr, ...params) {
    return this.add("JOIN", expr, ...params);
  }
  leftJoin(expr, ...params) {
    return this.add("LEFT JOIN", expr, ...params);
  }
  rightJoin(expr, ...params) {
    return this.add("RIGHT JOIN", expr, ...params);
  }
  fullJoin(expr, ...params) {
    return this.add("FULL JOIN", expr, ...params);
  }
  crossJoin(expr, ...params) {
    return this.add("CROSS JOIN", expr, ...params);
  }
  add(type2, expr, ...params) {
    if (Array.isArray(expr)) {
      this.exprs.push({ type: type2, expr: (_) => this.$(expr, ...params) });
    } else if (typeof expr == "function") {
      this.exprs.push({ type: type2, expr: (refs) => expr.call(this, ...refs) });
    }
    return this;
  }
  as(alias) {
    this.alias = alias;
    return this;
  }
  build(refs) {
    if (this.alias != null) {
      refs[0].$ref.as = this.$.ref(refs[0].$ref.cls, this.alias);
    }
    const params = {};
    const sqls = [];
    for (const join of this.exprs) {
      const result = join.expr(refs);
      const prefix = sqls.length ? `${alignRight(join.type, 5)}` : "";
      sqls.push(`${prefix} ${mergeParams(params, result)}`);
    }
    const on = sqls.join("");
    return { type: this.exprs[0].type, on, params };
  }
}

class SqlBuilderBase {
  $;
  tables;
  params = {};
  exprs = [];
  delimiter = ", ";
  constructor($, ...tables) {
    this.$ = $;
    this.tables = tables;
  }
  add(expr, ...params) {
    if (Array.isArray(expr)) {
      this.exprs.push((_) => this.$(expr, ...params));
    } else if (typeof expr == "function") {
      this.exprs.push((refs) => expr.call(this, ...refs));
    }
    return this;
  }
  build(refs) {
    const params = {};
    const sqls = [];
    for (const expr of this.exprs) {
      const result = expr(refs);
      sqls.push(mergeParams(params, result));
    }
    const sql = sqls.join(this.delimiter);
    return { sql, params };
  }
}

class SqlGroupByBuilder extends SqlBuilderBase {
}

class SqlOrderByBuilder extends SqlBuilderBase {
}

class SqlHavingBuilder extends SqlBuilderBase {
  constructor($, ...tables) {
    super($, ...tables);
    this.delimiter = "\n  AND ";
  }
}

// src/sql.builders.ts
var V = {
  join: (cls) => {
    if (!IS.rec(cls) && !IS.fn(cls))
      throw new Error(`invalid argument: ${typeof cls}`);
  }
};
var EX = {
  arg: (o) => {
    throw new Error(`invalid argument: ${typeof o}`);
  }
};
function joinOptions(type2, cls, options, ref) {
  if (IS.rec(options)) {
    if (options?.sql) {
      const { sql, params } = options;
      return { type: type2, cls, ref, on: sql, params };
    } else {
      options = options;
      return { type: type2, cls, ref, as: options?.as, on: options?.on, params: options?.params };
    }
  } else if (IS.fn(options)) {
    const builder = options;
    const { sql, params } = builder.build();
    return { type: type2, cls, on: sql, params };
  } else
    throw new Error(`Invalid Join Option: ${typeof options}`);
}

class WhereQuery {
  $;
  tables;
  metas;
  refs;
  get [type]() {
    return clsName(`WhereQuery`, ...this.tables);
  }
  constructor($, tables, metas, refs) {
    this.$ = $;
    this.tables = tables;
    this.metas = metas;
    this.refs = refs;
  }
  log(level) {
    console.log(this.toString(level));
    return this;
  }
  _where = [];
  _joins = [];
  params = {};
  get ref() {
    return this.refs[0];
  }
  get meta() {
    return this.metas[0];
  }
  get hasWhere() {
    return this._where.length > 0;
  }
  refOf(cls) {
    for (const ref of this.refs) {
      if (cls == ref.$ref.cls) {
        return ref;
      }
    }
    return null;
  }
  refsOf(...classes) {
    return classes.map((cls) => {
      const ret = this.refOf(cls);
      if (ret == null)
        throw new Error(`Could not find ref for '${cls.name}'`);
      return ret;
    });
  }
  createInstance(table, ref) {
    const meta = Meta.assert(table);
    ref = ref ?? this.$.ref(table);
    return new this.constructor(this.$, [...this.tables, table], [...this.metas, meta], [...this.refs, ref]);
  }
  copyInto(instance) {
    instance.params = Object.assign({}, this.params);
    instance._where = Array.from(this._where);
    instance._joins = Array.from(this._joins);
    return instance;
  }
  clone() {
    const instance = new this.constructor(this.$, [...this.tables], [...this.metas], [...this.refs]);
    this.copyInto(instance);
    return instance;
  }
  addJoin(options) {
    const table = options.cls;
    const ref = options?.ref ?? (options.as ? this.$.ref(table, options.as) : undefined);
    const instance = this.createInstance(table, ref);
    this.copyInto(instance);
    let q = instance;
    if (!q.refs[0].$ref.as) {
      q.refs[0] = q.$.ref(q.meta.cls, q.quoteTable(q.meta.tableName));
    }
    let on = "";
    const qProtected = q;
    if (IS.str(options.on)) {
      on = options.params ? qProtected.mergeParams({ sql: options.on, params: options.params }) : options.on;
    } else if (IS.fn(options.on)) {
      const refs = q.refs.slice(-2).concat([q.ref]);
      const sql = assertSql(options.on.call(q, ...refs));
      on = qProtected.mergeParams(sql);
    }
    qProtected._joins.push({ type: options.type, table, on, params: options.params });
    return instance;
  }
  joinBuilder(builder, typeHint = "JOIN") {
    const cls = builder.tables[0];
    const q = this.createInstance(cls);
    this.copyInto(q);
    const refs = builder.tables.map((cls2) => this.refOf(cls2) ?? this.$.ref(cls2));
    let { type: type2, on, params } = builder.build(refs, typeHint);
    if (on && params) {
      on = this.mergeParams({ sql: on, params });
    }
    const qProtected = q;
    qProtected._joins.push({ type: type2, on, params });
    return q;
  }
  join(cls, options) {
    V.join(cls);
    const JO = "JOIN";
    return !cls?.$ref && cls.tables ? this.joinBuilder(cls, JO) : this.addJoin(joinOptions(JO, asType(cls), options, asRef(cls)));
  }
  leftJoin(cls, options) {
    V.join(cls);
    return this.addJoin(joinOptions("LEFT JOIN", asType(cls), options, asRef(cls)));
  }
  rightJoin(cls, options) {
    V.join(cls);
    return this.addJoin(joinOptions("RIGHT JOIN", asType(cls), options, asRef(cls)));
  }
  fullJoin(cls, options) {
    V.join(cls);
    return this.addJoin(joinOptions("FULL JOIN", asType(cls), options, asRef(cls)));
  }
  crossJoin(cls, options) {
    V.join(cls);
    return this.addJoin(joinOptions("CROSS JOIN", asType(cls), options, asRef(cls)));
  }
  where(options, ...params) {
    return this.and(options, ...params);
  }
  and(options, ...params) {
    if (!options && params.length == 0) {
      this._where.length = 0;
      return this;
    } else if (IS.tpl(options)) {
      return this.condition("AND", this.$(options, ...params));
    } else if (IS.fn(options)) {
      const sql = assertSql(options.call(this, ...this.refs));
      return this.condition("AND", sql);
    } else {
      return this.condition("AND", options);
    }
  }
  or(options, ...params) {
    if (!options && params.length == 0) {
      this._where.length = 0;
      return this;
    } else if (IS.arr(options)) {
      return this.condition("OR", this.$(options, ...params));
    } else if (IS.fn(options)) {
      const sql = assertSql(options.call(this, ...this.refs));
      return this.condition("OR", sql);
    } else {
      return this.condition("OR", options);
    }
  }
  condition(condition, options) {
    if ("sql" in options && "params" in options) {
      this._where.push({ condition, sql: this.mergeParams(options) });
    } else if (options.rawSql) {
      const sql = Array.isArray(options.rawSql) ? options.rawSql : [options.rawSql];
      for (const fragment of sql) {
        this._where.push({ condition, sql: fragment });
      }
      this.addParams(options.params);
    }
    for (const [op, values] of Object.entries(options)) {
      if (Sql.opKeys.includes(op)) {
        this.addWhere(condition, Sql.ops[op], values, op);
      } else if (op === "op" && Array.isArray(values) && values.length >= 2) {
        const [sqlOp, params] = values;
        this.addWhere(condition, sqlOp, params);
      }
    }
    return this;
  }
  quote(symbol) {
    return this.$.quote(symbol);
  }
  quoteTable(table) {
    return this.$.quoteTable(table);
  }
  quoteColumn(column) {
    const as = this.ref.$ref.as;
    const prefix = as ? as + "." : "";
    return prefix + this.$.quoteColumn(column);
  }
  as(alias) {
    this.refs[0] = this.$.ref(this.refs[0].$ref.cls, alias);
    return this;
  }
  addParams(params) {
    if (params && IS.rec(params)) {
      for (const [key, value] of Object.entries(params)) {
        this.params[key] = value;
      }
    }
  }
  mergeParams(f) {
    return mergeParams(this.params, f);
  }
  addWhere(condition, sqlOp, values, op) {
    if (!condition)
      throw new Error("condition is required");
    if (!sqlOp)
      throw new Error("sqlOp is required");
    if (!values)
      throw new Error("values is required");
    if (op === "isNull" || op === "notNull") {
      if (!IS.arr(values))
        throw new Error(`${op} requires an array of property names, but was: ${toStr(values)}`);
      let columnNames = [];
      for (const key of values) {
        const prop = this.meta.props.find((x) => x.name === key);
        if (!prop)
          throw new Error(`Property ${key} not found in ${this.meta.name}`);
        if (!prop.column)
          throw new Error(`Property ${key} is not a column`);
        columnNames.push(prop.column.name);
      }
      const sql = columnNames.map((name) => `${this.$.quoteColumn(name)} ${Sql.ops[op]}`).join(` ${condition} `);
      this._where.push({ condition, sql });
    } else if (IS.rec(values)) {
      for (const [key, value] of Object.entries(values)) {
        const prop = this.meta.props.find((x) => x.name === key);
        if (!prop)
          throw new Error(`Property ${key} not found in ${this.meta.name}`);
        if (!prop.column)
          throw new Error(`Property ${key} is not a column`);
        const sqlLeft = `${this.$.quoteColumn(prop.column.name)} ${sqlOp}`;
        if (IS.arr(value)) {
          let sqlValues = ``;
          for (const v in value) {
            if (sqlValues)
              sqlValues += ",";
            const nextValue = nextParam(this.params);
            sqlValues += `\$${nextValue}`;
            this.params[nextValue] = v;
          }
          this._where.push({ condition, sql: `${sqlLeft} (${sqlValues})` });
        } else {
          this._where.push({ condition, sql: `${sqlLeft} \$${prop.name}` });
          let paramValue = op === "startsWith" ? `${value}%` : op === "endsWith" ? `%${value}` : op === "contains" ? `%${value}%` : value;
          this.params[prop.name] = paramValue;
        }
      }
    } else
      throw new Error(`Unsupported ${condition} value: ${values}`);
  }
  buildWhere() {
    if (this._where.length === 0)
      return "";
    let sb = "\n WHERE ";
    for (const [i, { condition, sql }] of this._where.entries()) {
      if (i > 0)
        sb += `\n${alignRight(condition, 5)}`;
      sb += sql;
    }
    return sb;
  }
  buildJoins() {
    if (this._joins.length == 0)
      return "";
    let sql = "";
    for (let i = 0;i < this._joins.length; i++) {
      const { type: type2, on } = this._joins[i];
      const ref = this.refs[i + 1];
      const meta = this.metas[i + 1];
      const quotedTable = this.$.quoteTable(meta.tableName);
      const refAs = ref.$ref.as;
      const sqlAs = refAs && refAs !== quotedTable ? ` ${refAs}` : "";
      const sqlOn = IS.str(on) ? ` ON ${on}` : "";
      let joinType = type2 ?? "JOIN";
      const spaces = leftPart(joinType, " ").length <= 4 ? "  " : " ";
      sql += `\n${spaces}${type2 ?? "JOIN"} ${quotedTable}${sqlAs}${sqlOn}`;
    }
    return sql;
  }
  into(into) {
    const { sql, params } = this.build();
    return { sql, params, into };
  }
  build() {
    const sql = this.buildWhere();
    const params = this.params;
    return { sql, params };
  }
  toString(level) {
    const ret = this.build();
    if (level != "debug" && level != "verbose")
      return Inspect.dump(ret);
    const { into } = ret;
    const intoName = into && (into.name || into.$type && into.$type.name || into.constructor.name) || "";
    const debug = [
      Inspect.dump(ret).trim(),
      [
        this[type] ?? "",
        intoName && intoName[0] != "[" ? ` => ${intoName}` : ""
      ].join(""),
      ""
    ].join("\n");
    if (level === "verbose") {
      const to = {
        refs: this.refs.map((x) => x.$ref).map((r) => [
          Meta.assert(r.cls).tableName,
          r.as != this.quote(Meta.assert(r.cls).tableName) ? r.as : ""
        ].filter((x) => !!x).join(" "))
      };
      for (const [key, val] of Object.entries(this)) {
        if (key[0] == "_" && IS.arr(val) && val.length) {
          to[key.substring(1)] = val;
        }
      }
      return [debug.trimEnd(), Inspect.dump(to).replaceAll('"', ""), ""].join("\n");
    }
    return debug;
  }
}

class SelectQuery extends WhereQuery {
  get [type]() {
    return clsName(`SelectQuery`, ...this.tables);
  }
  _select = [];
  _groupBy = [];
  _having = [];
  _orderBy = [];
  _skip;
  _take;
  _limit;
  copyInto(instance) {
    super.copyInto(instance);
    instance._select = Array.from(this._select);
    instance._groupBy = Array.from(this._groupBy);
    instance._having = Array.from(this._having);
    instance._skip = this._skip;
    instance._take = this._take;
    return instance;
  }
  clone() {
    return super.clone();
  }
  groupBy(options, ...params) {
    if (!options && params.length == 0) {
      this._groupBy.length = 0;
    } else if (Array.isArray(options)) {
      const frag = this.$(options, ...params);
      this._groupBy.push(this.mergeParams(frag));
    } else if (IS.fn(options)) {
      const frag = assertSql(options.call(this, ...this.refs));
      this._groupBy.push(this.mergeParams(frag));
    } else if (IS.rec(options)) {
      const frag = IS.fn(options.build) ? options.build(this.refs) : assertSql(options);
      this._groupBy.push(this.mergeParams(frag));
    } else
      throw EX.arg(options);
    return this;
  }
  having(options, ...params) {
    if (!options && params.length == 0) {
      this._having.length = 0;
    } else if (Array.isArray(options)) {
      const frag = this.$(options, ...params);
      this._having.push(this.mergeParams(frag));
    } else if (IS.fn(options)) {
      const frag = assertSql(options.call(this, ...this.refs));
      this._having.push(this.mergeParams(frag));
    } else if (IS.rec(options)) {
      const frag = IS.fn(options.build) ? options.build(this.refs) : assertSql(options);
      this._having.push(this.mergeParams(frag));
    } else
      throw EX.arg(options);
    return this;
  }
  orderBy(options, ...params) {
    if (!options && params.length == 0) {
      this._orderBy.length = 0;
    } else if (IS.arr(options)) {
      const frag = this.$(options, ...params);
      this._orderBy.push(this.mergeParams(frag));
    } else if (IS.fn(options)) {
      const frag = assertSql(options.call(this, ...this.refs));
      this._orderBy.push(this.mergeParams(frag));
    } else if (IS.rec(options)) {
      const frag = IS.fn(options.build) ? options.build(this.refs) : assertSql(options);
      this._orderBy.push(this.mergeParams(frag));
    } else
      throw EX.arg(options);
    return this;
  }
  select(options, ...params) {
    if (!options && params.length === 0) {
      this._select.length = 0;
    } else if (IS.str(options)) {
      this._select.push(options);
      if (params.length >= 1) {
        this.addParams(params[0]);
      }
    } else if (Array.isArray(options)) {
      this._select.push(this.mergeParams(this.$(options, ...params)));
    } else if (IS.fn(options)) {
      const sql = assertSql(options.call(this, ...this.refs));
      this._select.push(this.mergeParams(sql));
    } else if (IS.rec(options)) {
      const o = options;
      if (o.sql) {
        const frag = o.sql;
        this._select.push(frag.sql);
        this.addParams(frag.params);
      }
      if (o.props) {
        for (const name of o.props) {
          const column = this.meta.props.find((x) => x.name == name)?.column;
          if (column) {
            this._select.push(this.quoteColumn(column.name));
          }
        }
      }
      if (o.columns) {
        for (const name of o.columns) {
          this._select.push(this.quoteColumn(name));
        }
      }
    } else
      throw new Error(`Invalid select(${typeof options})`);
    return this;
  }
  get hasSelect() {
    return this._select.length > 0;
  }
  skip(rows) {
    return this.limit(this._take, rows);
  }
  take(rows) {
    return this.limit(rows, this._skip);
  }
  limit(take, skip) {
    this._take = take == null ? undefined : take;
    this._skip = skip == null ? undefined : skip;
    if ("limit" in this.params)
      delete this.params["limit"];
    if ("offset" in this.params)
      delete this.params["offset"];
    if (take == null && skip == null) {
      this._limit = undefined;
    } else {
      const frag = this.$.dialect.sqlLimit(this._skip, this._take);
      this._limit = this.mergeParams(frag);
    }
    return this;
  }
  exists() {
    const q = this.clone();
    q._select = ["TRUE"];
    q._limit = "LIMIT 1";
    return q.into(Boolean);
  }
  rowCount() {
    const { sql, params } = this.build();
    return { sql: `SELECT COUNT(*) FROM (${sql}) AS COUNT`, params, into: Number };
  }
  buildSelect() {
    const sqlSelect = this._select.length > 0 ? this._select.join(", ") : this.meta.columns.map((x) => this.quoteColumn(x.name)).join(", ");
    const sql = `SELECT ${sqlSelect}`;
    return sql;
  }
  buildFrom() {
    const quotedTable = this.quoteTable(this.meta.tableName);
    let sql = `\n  FROM ${quotedTable}`;
    const alias = this.refs[0].$ref.as;
    if (alias && alias != quotedTable) {
      sql += ` ${alias}`;
    }
    return sql;
  }
  buildGroupBy() {
    if (this._groupBy.length == 0)
      return "";
    return `\n GROUP BY ${this._groupBy.join(", ")}`;
  }
  buildHaving() {
    if (this._having.length == 0)
      return "";
    return `\n HAVING ${this._having.join("\n   AND ")}`;
  }
  buildOrderBy() {
    if (this._orderBy.length == 0)
      return "";
    return `\n ORDER BY ${this._orderBy.join(", ")}`;
  }
  buildLimit() {
    return this._limit ? `\n ${this._limit}` : "";
  }
  build() {
    let sql = this.buildSelect() + this.buildFrom() + this.buildJoins() + this.buildWhere() + this.buildGroupBy() + this.buildHaving() + this.buildOrderBy() + this.buildLimit();
    const params = this.params;
    const into = this._select.length == 0 ? this.tables[0] : undefined;
    return { sql, params, into };
  }
}

class UpdateQuery extends WhereQuery {
  get name() {
    return clsName(`UpdateQuery`, ...this.tables);
  }
  _set = [];
  set(options, ...params) {
    if (!options) {
      this._set.length = 0;
    }
    if (IS.tpl(options)) {
      const frag = this.$(options, ...params);
      this._set.push(this.mergeParams(frag));
    } else if (IS.fn(options)) {
      const frag = assertSql(options.call(this, ...this.refs));
      this._set.push(this.mergeParams(frag));
    } else if (IS.rec(options)) {
      if ("sql" in options) {
        const frag = options;
        this._set.push(this.mergeParams(frag));
      } else {
        for (const [key, value] of Object.entries(options)) {
          const prop = this.meta.props.find((x) => x.name === key);
          if (!prop)
            throw new Error(`Property ${key} not found in ${this.meta.name}`);
          if (!prop.column)
            throw new Error(`Property ${key} is not a column`);
          this.params[prop.name] = value;
          this._set.push(`${this.$.quote(prop.column.name)} = \$${prop.name}`);
        }
      }
    } else
      throw EX.arg(options);
    return this;
  }
  get hasSet() {
    return this._set.length > 0;
  }
  buildUpdate() {
    const sqlSet = this._set.join(", ");
    const sql = `UPDATE ${this.quoteTable(this.meta.tableName)} SET ${sqlSet}${this.buildWhere()}`;
    return sql;
  }
  build() {
    const sql = this.buildUpdate();
    return { sql, params: this.params };
  }
}

class DeleteQuery extends WhereQuery {
  get [type]() {
    return clsName(`DeleteQuery`, ...this.tables);
  }
  buildDelete() {
    const sql = `DELETE FROM ${this.quoteTable(this.meta.tableName)}${this.buildWhere()}`;
    return sql;
  }
  build() {
    const sql = this.buildDelete();
    return { sql, params: this.params };
  }
}

// src/model.ts
function table(options) {
  return function(target) {
    const table2 = Object.assign({}, options, { name: options?.alias ?? target.name });
    if (!target.$id)
      target.$id = Symbol(target.name);
    target.$type ??= { name: target.name };
    target.$type.table = table2;
  };
}
function column(type2, options) {
  return function(target, propertyKey) {
    const column2 = Object.assign({}, options, { type: type2, name: options?.alias ?? propertyKey });
    if (propertyKey === "id" || options?.autoIncrement)
      column2.primaryKey = true;
    if (!target.constructor.$id)
      target.constructor.$id = Symbol(target.constructor.name);
    const props = target.constructor.$props ?? (target.constructor.$props = []);
    let prop = props.find((x) => x.name === propertyKey);
    if (!prop) {
      prop = { name: propertyKey };
      props.push(prop);
    }
    prop.column = column2;
    if (IS.sym(prop.column.type)) {
      prop.column.type = prop.column.type.description;
    }
  };
}
function Table(cls, definition) {
  if (!definition)
    throw new Error("Table definition is required");
  const meta = cls;
  if (!meta.$id)
    meta.$id = Symbol(cls.name);
  meta.$type ??= { name: cls.name };
  meta.$type.table = definition.table ?? {};
  meta.$type.table.name ??= cls.name;
  const props = meta.$props ?? (meta.$props = []);
  Object.keys(definition.columns ?? {}).forEach((name) => {
    const column2 = definition.columns[name];
    if (!column2)
      throw new Error(`Column definition for ${name} is missing`);
    if (!column2.type)
      throw new Error(`Column type for ${name} is missing`);
    if (name === "id" || column2?.autoIncrement)
      column2.primaryKey = true;
    let prop = props.find((x) => x.name === name);
    if (!prop) {
      prop = { name };
      props.push(prop);
    }
    prop.column = column2;
    prop.column.name ??= column2.alias ?? name;
    if (IS.sym(prop.column.type)) {
      prop.column.type = prop.column.type.description;
    }
  });
  return cls;
}
var DefaultValues = {
  NOW: "{NOW}",
  MAX_TEXT: "{MAX_TEXT}",
  MAX_TEXT_UNICODE: "{MAX_TEXT_UNICODE}",
  TRUE: "{TRUE}",
  FALSE: "{FALSE}"
};

// src/sqlite/dialect.ts
class SqliteDialect {
  $;
  strategy = new DefaultStrategy;
  constructor() {
    this.$ = Sql.create(this);
  }
  quote(name) {
    return isQuoted(name) ? name : `"${name}"`;
  }
  quoteTable(name) {
    return isQuoted(name) ? name : this.quote(this.strategy.tableName(name));
  }
  quoteColumn(name) {
    return isQuoted(name) ? name : this.quote(this.strategy.columnName(name));
  }
  sqlLimit(offset, limit) {
    if (offset == null && limit == null)
      throw new Error(`Invalid argument sqlLimit(${offset}, ${limit})`);
    const frag = offset ? this.$.fragment(`LIMIT \$limit OFFSET \$offset`, { offset, limit: limit ?? -1 }) : this.$.fragment(`LIMIT \$limit`, { limit });
    return frag;
  }
}

// src/sqlite/schema.ts
class SqliteSchema extends Schema {
  driver;
  constructor(driver) {
    super(driver.dialect);
    this.driver = driver;
  }
  sqlTableNames() {
    return "SELECT name FROM sqlite_master WHERE type ='table' AND name NOT LIKE 'sqlite_%'";
  }
  sqlIndexDefinition(table2, column2) {
    const unique = column2.unique ? "UNIQUE INDEX" : "INDEX";
    const name = `idx_${table2.name}_${column2.name}`.toLowerCase();
    return `CREATE ${unique} ${name} ON ${this.dialect.quoteTable(table2.name)} (${this.dialect.quoteColumn(column2.name)})`;
  }
  sqlForeignKeyDefinition(table2, column2) {
    const ref = column2.references;
    if (!ref)
      return "";
    const $ = this.driver.$;
    const refMeta = Array.isArray(ref.table) ? Meta.assert(ref.table[0]) : Meta.assert(ref.table);
    const refKeys = Array.isArray(ref.table) ? Array.isArray(ref.table[1]) ? ref.table[1].map((x) => $.quoteColumn(x)).join(",") : $.quoteColumn(ref.table[1]) : refMeta.columns.filter((x) => x.primaryKey).map((x) => $.quoteColumn(x.name)).join(",");
    let sql = `FOREIGN KEY (${$.quoteColumn(column2.name)}) REFERENCES ${$.quoteTable(refMeta.tableName)}${refKeys ? "(" + refKeys + ")" : ""}`;
    if (ref.on) {
      sql += ` ON ${ref.on[0]} ${ref.on[1]}`;
    }
    return sql;
  }
  sqlColumnDefinition(column2) {
    let dataType = column2.type;
    let type2 = this.driver.types.native.includes(dataType) ? dataType : undefined;
    if (!type2) {
      for (const [sqliteType, typeMapping] of Object.entries(this.driver.types.map)) {
        if (typeMapping.includes(dataType)) {
          type2 = sqliteType;
          break;
        }
      }
    }
    if (!type2)
      type2 = dataType;
    let sb = `${this.dialect.quoteColumn(column2.name)} ${type2}`;
    if (column2.primaryKey) {
      sb += " PRIMARY KEY";
    }
    if (column2.autoIncrement) {
      sb += " AUTOINCREMENT";
    }
    if (column2.required) {
      sb += " NOT NULL";
    }
    if (column2.unique && !column2.index) {
      sb += " UNIQUE";
    }
    if (column2.defaultValue) {
      const val = this.driver.variables[column2.defaultValue] ?? column2.defaultValue;
      sb += ` DEFAULT ${val}`;
    }
    return sb;
  }
  sqlLimit(offset, limit) {
    if (offset == null && limit == null)
      throw new Error(`Invalid argument sqlLimit(${offset}, ${limit})`);
    const frag = offset ? this.driver.$.fragment(`LIMIT \$limit OFFSET \$offset`, { offset, limit: limit ?? -1 }) : this.driver.$.fragment(`LIMIT \$limit`, { limit });
    return frag;
  }
}

// src/sqlite/driver.ts
class SqliteTypes {
  native = [
    "INTEGER",
    "SMALLINT",
    "BIGINT",
    "REAL",
    "DOUBLE",
    "FLOAT",
    "NUMERIC",
    "DECIMAL",
    "BOOLEAN",
    "DATE",
    "DATETIME"
  ];
  map = {
    INTEGER: ["INTERVAL", "MONEY"],
    BLOB: ["BLOB", "BYTES", "BIT"],
    TEXT: [
      "UUID",
      "JSON",
      "JSONB",
      "XML",
      "TIME",
      "TIMEZ",
      "TIMESTAMP",
      "TIMESTAMPZ"
    ]
  };
}

class Sqlite {
  static connection;
  static driver;
  static schema;
  static init() {
    const c = Sqlite.connection = new SqliteConnection(new Sqlite);
    const { driver, schema } = c;
    Object.assign(Sqlite, { driver, schema });
    return c;
  }
  name;
  dialect;
  schema;
  strategy = new DefaultStrategy;
  $;
  variables = {
    [DefaultValues.NOW]: "CURRENT_TIMESTAMP",
    [DefaultValues.MAX_TEXT]: "TEXT",
    [DefaultValues.MAX_TEXT_UNICODE]: "TEXT",
    [DefaultValues.TRUE]: "1",
    [DefaultValues.FALSE]: "0"
  };
  types;
  converters = {
    ...converterFor(DateTimeConverter.instance, "DATE", "DATETIME", "TIMESTAMP", "TIMESTAMPZ")
  };
  constructor() {
    this.name = this.constructor.name;
    this.dialect = new SqliteDialect;
    this.$ = this.dialect.$;
    this.types = new SqliteTypes;
    this.schema = this.$.schema = new SqliteSchema(this);
  }
}

class SqliteConnection extends ConnectionBase {
}

// src/mysql/dialect.ts
class MySqlDialect {
  $;
  strategy = new DefaultStrategy;
  constructor() {
    this.$ = Sql.create(this);
  }
  quote(name) {
    return isQuoted(name) ? name : "`" + name + "`";
  }
  quoteTable(name) {
    return isQuoted(name) ? name : this.quote(this.strategy.tableName(name));
  }
  quoteColumn(name) {
    return isQuoted(name) ? name : this.quote(this.strategy.columnName(name));
  }
  sqlLimit(offset, limit) {
    if (offset == null && limit == null)
      throw new Error(`Invalid argument sqlLimit(${offset}, ${limit})`);
    const frag = offset ? limit ? this.$.fragment(`LIMIT \$offset, \$limit`, { offset, limit }) : this.$.fragment(`LIMIT \$offset, 18446744073709551615`, { offset }) : this.$.fragment(`LIMIT \$limit`, { limit });
    return frag;
  }
}

// src/mysql/schema.ts
class MySqlSchema extends SqliteSchema {
}

// src/mysql/driver.ts
class MySqlTypes {
  native = [
    "INTEGER",
    "SMALLINT",
    "BIGINT",
    "DOUBLE",
    "FLOAT",
    "DECIMAL",
    "NUMERIC",
    "DECIMAL",
    "BOOLEAN",
    "DATE",
    "DATETIME",
    "TIME",
    "TIMESTAMP",
    "UUID",
    "JSON",
    "XML",
    "BLOB"
  ];
  map = {
    DOUBLE: ["REAL"],
    TIME: ["TIMEZ"],
    TIMESTAMP: ["TIMESTAMPZ"],
    INTEGER: ["INTERVAL"],
    JSON: ["JSONB"],
    TEXT: ["XML"],
    BINARY: ["BYTES"],
    "BINARY(1)": ["BIT"],
    "DECIMAL(15,2)": ["MONEY"]
  };
}

class MySql extends Sqlite {
  static connection;
  static driver;
  static schema;
  static init() {
    const c = MySql.connection = new MySqlConnection(new MySql);
    const { driver, schema } = c;
    Object.assign(MySql, { driver, schema });
    return c;
  }
  constructor() {
    super();
    this.dialect = new MySqlDialect;
    this.$ = this.dialect.$;
    this.types = new MySqlTypes;
    this.schema = this.$.schema = new MySqlSchema(this);
  }
}

class MySqlConnection extends ConnectionBase {
}

// src/postgres/dialect.ts
class PostgreSqlDialect {
  $;
  strategy = new DefaultStrategy;
  constructor() {
    this.$ = Sql.create(this);
  }
  quote(name) {
    return isQuoted(name) ? name : `"${name}"`;
  }
  quoteTable(name) {
    return isQuoted(name) ? name : this.quote(this.strategy.tableName(name));
  }
  quoteColumn(name) {
    return isQuoted(name) ? name : this.quote(this.strategy.columnName(name));
  }
  sqlLimit(offset, limit) {
    if (offset == null && limit == null)
      throw new Error(`Invalid argument sqlLimit(${offset}, ${limit})`);
    const frag = offset ? limit ? this.$.fragment(`LIMIT \$limit OFFSET \$offset`, { offset, limit }) : this.$.fragment(`OFFSET \$offset`, { offset }) : this.$.fragment(`LIMIT \$limit`, { limit });
    return frag;
  }
}

// src/postgres/schema.ts
class PostgreSqlSchema extends SqliteSchema {
}

// src/postgres/driver.ts
class PostgreSqlTypes {
  native = [
    "INTEGER",
    "SMALLINT",
    "BIGINT",
    "REAL",
    "DOUBLE",
    "FLOAT",
    "DECIMAL",
    "NUMERIC",
    "DECIMAL",
    "MONEY",
    "BOOLEAN",
    "DATE",
    "DATETIME",
    "TIME",
    "TIMEZ",
    "TIMESTAMP",
    "TIMESTAMPZ",
    "INTERVAL",
    "UUID",
    "JSON",
    "JSONB",
    "XML",
    "BLOB",
    "BYTES",
    "BIT"
  ];
  map = {};
}

class PostgreSql extends Sqlite {
  static connection;
  static driver;
  static schema;
  static init() {
    const c = PostgreSql.connection = new PostgreSqlConnection(new PostgreSql);
    const { driver, schema } = c;
    Object.assign(PostgreSql, { driver, schema });
    return c;
  }
  constructor() {
    super();
    this.dialect = new PostgreSqlDialect;
    this.$ = this.dialect.$;
    this.types = new PostgreSqlTypes;
    this.schema = this.$.schema = new PostgreSqlSchema(this);
  }
}

class PostgreSqlConnection extends ConnectionBase {
}

// src/index.ts
var sqlite = (() => {
  return Sqlite.init().$;
})();
var mysql = (() => {
  return MySql.init().$;
})();
var postgres = (() => {
  return PostgreSql.init().$;
})();
export {
  useFilter,
  toStr,
  table,
  sqlite,
  snakeCase,
  postgres,
  pick,
  omit,
  nextParam,
  mysql,
  mergeParams,
  converterFor,
  column,
  WhereQuery,
  Watch,
  UpdateQuery,
  Table,
  SyncDbConnection,
  SqliteSchema,
  SqliteDialect,
  Sqlite,
  Sql,
  SnakeCaseStrategy,
  SelectQuery,
  Schema,
  PostgreSqlSchema,
  PostgreSqlDialect,
  PostgreSql,
  MySqlSchema,
  MySqlDialect,
  MySql,
  Meta,
  Inspect,
  IS,
  DeleteQuery,
  DefaultValues,
  DefaultStrategy,
  DbConnection,
  DateTimeConverter
};
