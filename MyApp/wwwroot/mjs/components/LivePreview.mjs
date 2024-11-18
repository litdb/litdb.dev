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
        <div class="not-prose relative" style="width:900px">
            <div title="try me">
                <svg @click="focus()" class="z-10 w-6 h-6 cursor-pointer absolute -right-6 text-slate-500" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 1200 1200"><path fill="currentColor" d="M1200 972.138V556.629c-2.192-43.973-37.788-75.725-76.898-76.253H936.995c-53.196-40.854-90.897-97.553-142.165-138.61q-27.141-21.648-42.003-48.142c-32.214-63.281-12.695-136.954-58.481-187.399c-92.008-39.482-202.231 15.751-233.279 102.423c-24.404 70.78-8.051 141.366 22.294 203.877c-109.856-.182-219.71.708-329.564 1.292C64.363 420.495.594 480.709 0 566.321c.244 86.275 74.623 149.017 153.796 150.565h129.241q6.462 38.126 25.202 69.144c-7.239 53.145 9.327 105.247 41.357 142.812c17.576 306.75 419.443 124.761 569.951 120.193h203.555c44.282-2.096 76.37-37.59 76.898-76.897m-277.222 0c-120.425 2.591-531.908 184.658-492.406-76.253c-43.545-23.47-60.301-86.285-33.603-126.009c-40.566-40.005-52.119-90.265-12.924-129.887q-58.158 0-115.024-.646c-56.866-.646-76.252-.646-115.024-.646c-44.371-.933-75.122-33.487-75.606-72.375c1.014-45.975 35.914-75.136 75.606-75.605c150.384-.008 298.632-1.276 438.126-1.292c-12.555-100.763-132.769-237.585-10.017-316.963c19.652-9.652 35.367-13.749 55.896-10.017q5.17 2.585 5.816 5.17t1.938 8.4c13.044 79.87 25.221 159.73 87.237 212.601c68.263 52.343 108.514 134.749 186.752 168.014h3.231v415.508z"/></svg>
            </div>
            <div class="">
                <div ref="refInput" class="border border-gray-300"></div>
                <div v-if="error" class="bg-red-50 text-red-700 border-2 border-red-500 p-2" style="width:896px">{{error}}</div>
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
        
        function focus() {
            cm.focus()
        }
        
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
        
        return { refInput, refPreview, code, sql, error, focus }
    }
}
