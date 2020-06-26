# Applife

♻️ Take back the control of your app lifecycle

## Quickstart


```js
const al = require("applife")
const { MongoDriver, OrmonEngine } = require("ormon")
const Server = require("qpi")

al.setup({
  config: () => ({ mongo: "mongodb://localhost:27017", port: 8080 }),
})

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

Each of those methods takes an object as a parameter, that acts as a hashmap of
tasks to execute.
Once the task (that can be asynchronous) is complete, its value will be stored
in a `context` object that will be passed to subsequent hooks.

E.g.
```js
al.setup({
  config: () => process.env
})

al.exec(console.log) // will display the env
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