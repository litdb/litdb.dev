import { onMounted, ref, nextTick } from "vue"
import * as litdb from "litdb"
import * as models from "../models.mjs"

const { Sqlite, DbConnection, SyncDbConnection, IS, Inspect } = litdb

class SqlCaptureStatement {
    constructor(sql, params, log) {
        this.sql = sql
        this.params = params
        this.log = log ?? []
    }
    
    as(cls) {
        this._cls = cls
        return this
    }
    allSync(...params) {
        this.log.push({ sql: this.sql, params })
        return []
    }
    oneSync(...params) {
        this.log.push({ sql: this.sql, params })
        return null
    }
    valueSync(...params) {
        this.log.push({ sql: this.sql, params })
        return null
    }
    arraysSync(...params) {
        this.log.push({ sql: this.sql, params })
        return []
    }
    arraySync(...params) {
        this.log.push({ sql: this.sql, params })
        return null
    }
    execSync(...params) {
        this.log.push({ sql: this.sql, params })
        return { changes:0, lastInsertRowid: 0 }
    }
    runSync(...params) {
        //console.log(this.sql, this.params, params)
        this.log.push({ sql: this.sql, params })
    }
}
class SqlCaptureConnection {
    constructor(driver) {
        this.log = []
        this.driver = driver
        this.$ = driver.$
        this.schema = this.$.schema = driver.schema
        this.dialect = driver.dialect
        this.async = new DbConnection(this)
        this.sync = new SyncDbConnection(this)
    }
    prepare(sql, ...params) { throw new Error("Not implemented") }
    
    prepareSync(sql, ...params) {
        if (IS.tpl(sql)) {
            let sb = ''
            for (let i = 0; i < sql.length; i++) {
                sb += sql[i]
                if (i < params.length) {
                    sb += `?`
                }
            }
            return new SqlCaptureStatement(sb, [], this.log)
        } else {
            return new SqlCaptureStatement(sql, params, this.log)
        }
    }
    close() { return Promise.resolve() }
    closeSync() { }
}

function scopedExpr(src, ctx, expr) {
    const invalidTokens = ['function','Function','eval']
    if (invalidTokens.some(x => src.includes(x))) {
        throw new Error(`Unsafe script: '${src}'`)
    }

    const scope = Object.assign(Object.keys(globalThis).reduce((acc,k) => {
        acc[k] = undefined; return acc
    }, {}) , ctx)
    return expr
        ? (new Function( "with(this) { return (" + src + ") }")).call(scope)
        : (new Function( "with(this) { " + src + " }")).call(scope)
}

export default {
    template:`
        <div class="not-prose" style="width:860px">
            
            <div class="">
                <div ref="refInput" class="border border-gray-300"></div>
                <div v-if="error" class="bg-red-50 text-red-700 border-2 border-red-500 p-2">{{error}}</div>
                <pre v-if="sql" class="mt-1"><code ref="refPreview" class="language-sql">{{sql}}</code></pre>
            </div>
            
        </div>
    `,
    props:['src','expr'],
    setup(props, { slots }) {
        const refInput = ref()
        const refPreview = ref()
        const code = ref('')
        const sql = ref('')
        const error = ref('')
        let cm
        const connection = new SqlCaptureConnection(new Sqlite())
        const db = connection.sync
        const $ = db.$
        
        onMounted(async () => {
            if (props.src) {
                code.value = await (await fetch(props.src)).text()
            } else {
                const getSlotChildrenText = children => children.map(node => {
                    if (!node.children || typeof node.children === 'string') return node.children || ''
                    else if (Array.isArray(node.children)) return getSlotChildrenText(node.children)
                    else if (node.children.default) return getSlotChildrenText(node.children.default())
                }).join('')
                code.value = getSlotChildrenText(slots.default()).trim()
            }

            //console.log('value', code.value)
            cm = CodeMirror(refInput.value, {
                lineNumbers: true,
                styleActiveLine : true,
                matchBrackets: true,
                mode: "text/typescript",
                theme: 'ctp-mocha',
                value: code.value,
            })
            cm.on('change', () => {
                code.value = cm.getValue()
                connection.log.length = 0
                const ctx = { ...models, ...litdb, $, db  }
                try {
                    error.value = ''
                    const isExpr = props.expr || !code.value.includes('db.')
                    const ret = scopedExpr(code.value, ctx, isExpr)
                    console.log(connection.log)
                    sql.value = connection.log.map(x => x.sql.trim()).join('\n\n')
                    if (ret) {
                        const str = `${ret}` 
                        sql.value += (str !== '[object Object]' ? str : Inspect.dump(ret))
                    }
                    nextTick(() => globalThis.hljs.highlightElement(refPreview.value))
                } catch(e) {
                    error.value = e.message ?? `${e}`
                    console.error(e)
                }
            })
            cm.setValue(cm.getValue() + '\n')
            cm.setSize(null,'auto')
        })
        
        return { refInput, refPreview, code, sql, error }
    }
}
