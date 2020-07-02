# Applife

♻️ Take back the control of your app lifecycle

## Quickstart


```js
const al = require("applife")
const { MongoDriver, OrmonEngine } = require("ormon")
const logger = require("someLogger")
const Server = require("qpi")

al.setup([
  { config: () => process.env },
  { logger: ({ config }) => someLogger({ logLevel: config.logLevel })}
])

al.boot({
  ormon: ({ config }) => {
    OrmonEngine.init(new MongoDriver(config.mongo))
    return OrmonEngine.driver.connect()
  },
  server: () => {
    const server = new Server({ body: true, query: true })
    server.get("/", Q => Q.send("Hello, World!"))
    return server
  },
})

al.shutdown({
  ormon: () => OrmonEngine.driver.close(),
  server: ({ server }) => server._server.close(),
})

al.up(({config, server}) => server.listen(config.port))
```

But, what looks best (imho) is to have something like this:

```js
const al = require("applife")
require("./preset/config")(al)
require("./preset/ormon")(al)
require("./preset/server")(al)
al.up()

--- preset/config.js ---
module.exports = al => al.setup({ config: process.env })

--- preset/ormon.js ---
module.exports = al => {
  al.boot({
    ormon: ({ config }) => {
      OrmonEngine.init(new MongoDriver(config.mongo))
      return OrmonEngine.connect()
    }
  })

  al.shutdown({
    ormon: () => OrmonEngine.close()
  })
}

--- preset/server.js ---
module.exports = al => {
  al.setup([ // run this step AFTER the previous one has completed
    {
      server: ({ logger }) => {
        const srv = new Server()
        srv.after(ctx => {
          logger.info({
            url:    ctx.url,
            status: ctx.statusCode,
            ...
          })
        })
        return srv
      }
    }
  ]),

  al.boot({
    server: ({ server, config }) => server.listen(config.port)
  })

  all.shutdown({
    server: ({ server }) => server.close()
  })
}
```

If you have micro services, your presets could be shared across all your infra

## App lifecycle

- Setup: Load everything you need to (e.g. env)
- Boot: Startup your dependencies (e.g. DB connection)
- Up/Exec: Up your service / Exec your code
- Failure: React unexcepted events (pm2 restart / docker restart / crash)
- Shutdown: Clean everything before exiting

```
o => setup => boot => up/exec => shutdown => x
       v       v         v          ^
    exit(1)  exit(2)  failure ------'
```

### Setup / Boot / Shutdown

Each of these methods takes tasks as paramter.
A tasks can be run either concurently if within an object and sequencially if
within an array.
Regardless, the task is an object where the keys will hold the value of the
function to resolve (which can be asynchronous).
The object will be passed to subsequent calls.


E.g.
```js
al.setup([                        // notice the array
  { config: () => process.env },  // loads your env and put it in `config`
  {                               // 2nd step
    logger: ({ config }) =>       // the context is passed, thus config is available
      logger.logLevel(config.lvl),// set the log level to `process.env.lvl`)
  }
])
```

You can absoluetely go crazy with nested arrays and such:
```js
al.boot([
  // 1st: load env
  { config: () => process.env },
  [
    // 2nd: load the logger AND redis CONCURENTLY
    {
      logger: ({ config }) => logger.logLevel(config.lvl),
      redis: ({ config }) => redis.createClient(config.redis_port, config.redis_url)
    },
    // 3rd: setup redlock (after logger & redis have done starting)
    {
      redlock: ({config, redis }) => redlock(redis, { retryCount: config.redlock_retry })
    }
  ]
])
```

#### Advanced configuration

Stages can be split:

```js
al.setup({
  foo: () => 42,
  bar: () => 1337
})

// ^-- is equivalent to --v

al.setup({ foo: () => 42 })
al.setup({ bar: () => 1337 })
```

Serial stages can also be split:

```js
al.setup([
  { foo: () => 42 },
  { bar: () => 1337 },
])

// ^-- is equivalent to --v

al.setup({ foo: () => 42 }) // or al.setup([{foo: () => 42 }])
al.setup([{ bar: () => 1337 }])
```

Basically, if you pass an array to a stage, it will run AFTER stage,
if you pass an object it will run at the same time as the previous stage:

```js
al.setup([
  { foo: () => 42 },            // step 1
  {
    bar: ({ foo }) => foo * 2,  // step 2
    baz: ({ foo }) => foo + 2   // step 2
  },
  { total: ({ foo, bar, baz }) => foo + bar + baz } // step 3
])

// ^-- is equivalent to --v

al.setup({ foo: () => 42 })     // step 1
al.setup([{ bar: ({ foo }) => foo * 2 }]) // in an array, so after previous
al.setup({ baz: ({ foo }) => foo + 2 })   // not in an array, so at the same time than previous
al.setup([{ total: ({ foo, bar, baz }) => foo + bar + baz }]) // in an array so after previous
```

### Exec & Up

To start your app you have the choice between two functions:
- exec: to run it as a single function that one MUST await
- up: to run it in the background (e.g. webserver)

Those two method only take one function as a parameter which is the "starter"


### Handle failure

After it has stated, the shutdown hook will be called.

Failure hook is mostly here for log & debug.

You can either pass a "catchAll" function or an object that has:
- fallback: if any of the following handler does not have a hook, call this one
- multipleResolves
- rejectionHandled
- uncaughtException
- uncaughtExceptionMonitor
- unhandledRejection
- SIGTERM
- SIGINT
- SIGBREAK

The shutdown method will be called after a failure.

The prototype of the handler is `data, context, kind`