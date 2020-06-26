/* eslint-disable no-process-exit */
/* eslint-disable no-console */
/* eslint-disable no-underscore-dangle */
/** Defines the lifecycle of an app
 */
class LifeCycle {
  /** */
  constructor() {
    this._context = {}
    this._setup = {}
    this._boot = {}
    this._failure = { fallback: console.error }
    this._shutdown = {}
  }

  /** First stage of the lifecyle: setup
   *
   *  Here do anything that needs to load before anything else.
   *  Unlike boot, this stage won't be unloaded on shutdown
   *
   *  For each task run, its return value will be stored in the task object key
   *
   *  If any task fails, the app will exit with status code 1
   *
   *  @param {Object} tasks Each tasks to execute
   *
   *  @example
   *  lf.setup({
   *    env: () => ({ env: process.env.NODE_ENV, mongoUri: process.env.MONGO })
   *  })
   */
  setup(tasks) {
    this._setup = { ...tasks }
  }

  /** @private */
  async _runSetup() {
    try {
      const tasks = Object.keys(this._setup)
      const results = await Promise.all(tasks.map(task => this._setup[task]()))
      results.forEach((result, idx) => {
        this._context[tasks[idx]] = result
      })
    }
    catch (e) {
      console.error(e)
      process.exit(1)
    }
  }

  /** Second stage of the lifecycle: boot
   *
   *  Do anything that does need to be done before executing the app
   *  Each data loaded here should be shutdown (otherwise use setup)
   *
   *  For each task run, its return value will be stored in the task object key
   *
   *  If any tasks fails, the app will exit with status code 2
   *
   *  @param {Object} tasks Which tasks to execute
   *
   *  @example
   *  lf.boot({
   *    mongo: async (ctx) => MongoClient.connect(ctx.env.mongoUri)
   *  })
   */
  boot(tasks) {
    this._boot = { ...tasks }
  }

  /** @private */
  async _runBoot() {
    try {
      const tasks = Object.keys(this._boot)
      const results = await Promise.all(
        tasks.map(task => this._boot[task](this._context)),
      )
      results.forEach((result, idx) => {
        this._context[tasks[idx]] = result
      })
    }
    catch (e) {
      console.error(e)
      process.exit(2)
    }
  }

  /** Third stage of the lifecycle: exec
   *
   *  Does run your app, that is, once your app is done, it will gracefully shutdown
   *  @warning If your app is a service, use {@see #up}
   *
   *  @param {Function} [task=_=>_] The app to run
   */
  async exec(task = _ => _) {
    await this._runSetup()
    await this._runBoot()
    this._runFailure()
    try {
      await task(this._context)
    }
    catch (e) {
      if (this._failure.error) this._failure.error(e)
      else if (this._failure.fallback) this._failure.fallback(e)
      else console.error(e)
    }
    finally {
      await this._runShutdown()
    }
  }

  /** Third stage of the lifecycle: up
   *
   *  Does up your service. That is, once your app has return, it will be
   *  considered started and will wait to be killed before gracefully shutting
   *  down.
   *  If you want to shutdown after your app has returned, used {@see #exec}
   *
   *  @param {Function} [task=_=>_] The app to run
   */
  async up(task = _ => _) {
    await this._runSetup()
    await this._runBoot()
    this._runFailure()
    await task(this._context)
  }

  /** Fourth stage of the lifecyle: failures and interuption
   *
   *  If anything goes wrong, this will catch it.
   *  Note: shutdown will still be executed
   *
   *  @param {Object|Function} handle Either a catch all function or an object
   *
   *  @param {Function} handle.fallback If the error is not mapped, call this
   *  @param {Function} handle.error An error has been thrown by the app
   *  @param {Function} handle.kill T
   */
  failure(handle = console.error) {
    if (typeof handle === "function")
      this._failure = { fallback: handle }
    else
      this._failure = { ...handle }
  }

  /** @private */
  _runFailure() {
    const self = this
    // eslint-disable-next-line require-jsdoc,max-len
    const handle = evt => (...data) => self._runShutdown((self._failure[evt] || self._failure.fallback || console.error)(...data))

    ;[
      "multipleResolves",
      "rejectionHandled",
      "uncaughtException",
      "uncaughtExceptionMonitor",
      "unhandledRejection",
      "SIGTERM",
      "SIGINT",
      "SIGBREAK",
    ]
      .forEach(evt => process.on(evt, handle(evt)))
  }

  /** Last stage of the lifecyle: shutdown
   *
   *  Regardless of what caused your app to stop, be it an uncaught exception
   *  or graceful stop, this stage allows you to do some cleanup
   *
   *  If one of the cleanup processes fails, it will exit the app with status code 3
   *
   *  @param {Object} tasks Which task to execute
   */
  shutdown(tasks) {
    this._shutdown = { ...tasks }
  }

  /** @private */
  async _runShutdown() {
    try {
      const tasks = Object.keys(this._shutdown)
      const results = await Promise.all(
        tasks.map(task => this._shutdown[task](this._context)),
      )
      results.forEach((result, idx) => {
        this._context[tasks[idx]] = result
      })
    }
    catch (e) {
      console.error(e)
      process.exit(3)
    }
  }
}

module.exports = new LifeCycle()
