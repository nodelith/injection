# @nodelith/injection

A flexible and lightweight dependency injection library for JavaScript and TypeScripResolve complex dependency graphs using classes, factory functions, or static valueManage dependency visibility and lifecycles with easBuild composable, reusable modules for clean and maintainable architectures.

## 📦 Installation

```bash
npm install @nodelith/injection
```

## 🚀 Quick Example

**Say you have a small program to put togheter:**

```typescript
class Logger {
  public info(message: string) {
    console.info(message)
  }
}

class Database {
  public constructor(
    private address: string = 'localhost:3000',
    private logger: Logger,
  ) {}

  public async save(username: string) {
    this.serverLogger.info(`Saving user: ${username} to ${address}`)
  }
}

class Service {
  public constructor(
    private logger: Logger,
    private database: Database,
  ) {}
  
  public async create(username: string) {
    this.logger.info(`Creating user: ${username}`)
    return await this.database.save(username)
  }
}
```

**All you need to do to wire eerything up is:**

```typescript
// Set up a Container:
const containerModule = Container.create()

// Register your dependencies:
containerModule.register('logger', { constructor: Logger })
containerModule.register('database', { constructor: Database })
containerModule.register('userService', { constructor: Service })
```

**Finaly, resolve the wanted root dependency and use it:**

```typescript
// Resolve the desired dependency:
const userService = containerModule.resolve('userService')

// Use the resolved dependency instance:
const user = userService.create('johndoe')
// Logs: Creating user: johndoe
// Logs: Saving user: johndoe
```

**Not into classes? Inject dependencies from factories instead!**
```typescript
// Declare your factory so that it returns an object
function userControlerFactory(userService: UserService) {
  return {
    create(request: Request) {
      userService.create(request.body.username)
    }
  }
}

// Register it under your container
containerModule.register('userController', { factory: userControlerFactory })
```

**Needs to inject static values? Just do it**

```typescript
// Pass the static value under the registration options
containerModule.register('address', { static: 'localhost:3002' })
```

**Wanna make it composable? Make it a Module instead!**

```typescript
// Instead of a Container, set up a Module
const userModule = Module.create()

// Register your dependencies:
userModule.register('user', { 
  static: 'myself', 
  visibility: 'private'
})
userModule.register('address', {
  static: 'localhost:3002',
  visibility: 'private'
})
userModule.register('password', { 
  static: 'mysafepassword',
  visibility: 'private'
})
userModule.register('logger', {
  constructor: Logger,
  visibility: 'private'
})
userModule.register('database', {
  constructor: Database,
  visibility: 'private'
})
userModule.register('userService', {
  constructor: UserService,
  visibility: 'private'
})
containerModule.register('userController', { 
  factory: userController, 
  visibilty:'public'
})

// Import it within other Modules, exposing only the public registrations: 
applicationModule.import(userModule)
```

