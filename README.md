# @nodelith/injection

A flexible and lightweight dependency injection library for JavaScript and TypeScript. Resolve complex dependency graphs using classes, factories, functions, or static values. Manage dependency visibility and lifecycles with ease. Build composable, reusable modules for clean and maintainable architectures.

## 📦 Installation

```bash
npm install @nodelith/injection
```

## 🚀 Quick Example

**Say you have a small program to put together:**

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
    this.logger.info(`Saving user: ${username} to ${this.address}`)
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

**All you need to do to wire everything up is:**

```typescript
// Import the Nodelith Container and set it up
import { Container } from '@nodelith/injection'
const container = Container.create()

// Register your dependencies:
container.register('logger', { constructor: Logger })
container.register('database', { constructor: Database })
container.register('userService', { constructor: Service })
```

**Finally, resolve the wanted root dependency and use it:**

```typescript
// Resolve the desired dependency:
const userService = container.resolve<Service>('userService')

// Use the resolved dependency instance:
const user = userService.create('johndoe')
// Logs: Creating user: johndoe
// Logs: Saving user: johndoe to localhost:3000
```

**Not into classes? Inject dependencies from factories instead!**

```typescript
// Declare your factory so that it returns an object
function userControllerFactory(userService: Service) {
  return {
    create(request: Request) {
      userService.create(request.body.username)
    }
  }
}

// Register it under your container
container.register('userController', { factory: userControllerFactory })
```

**Need to inject static values? Just do it:**

```typescript
// Pass the static value under the registration options
container.register('address', { static: 'localhost:3002' })
```

**Want to make it composable? Make it a Module instead!**

```typescript
// Instead of a Container, set up a Module
import { Module } from '@nodelith/injection'
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
  constructor: Service,
  visibility: 'private'
})
userModule.register('userController', {
  factory: userControllerFactory,
  visibility: 'public'
})

// Import it within other Modules, exposing only the public registrations:
const applicationModule = Module.create()
applicationModule.import(userModule)
```
