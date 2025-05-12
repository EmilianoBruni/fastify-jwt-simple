# fastify-jwt-simple - A simple JWT manager 

_A simple JWT manager with automatic access and refresh token support (over cookies too)_

[![npm package](https://img.shields.io/npm/v/fastify-jwt-simple.svg)](http://npmjs.org/package/fastify-jwt-simple)
[![Build workflow](https://github.com/EmilianoBruni/fastify-jwt-simple/actions/workflows/build.yml/badge.svg)](https://github.com/EmilianoBruni/fastify-jwt-simple/actions/workflows/build.yml)
[![Coverage Status](https://coveralls.io/repos/github/EmilianoBruni/fastify-jwt-simple/badge.svg?branch=master)](https://coveralls.io/github/EmilianoBruni/fastify-jwt-simple?branch=master)
![Last Commit](https://img.shields.io/github/last-commit/EmilianoBruni/fastify-jwt-simple)
[![Dependencies](https://img.shields.io/librariesio/github/EmilianoBruni/fastify-jwt-simple)](https://libraries.io/npm/fastify-jwt-simple)
![Downloads](https://img.shields.io/npm/dt/fastify-jwt-simple)

## Features

- ✅ **Automatic management of access and refresh tokens.**
- 🔒 **Secure cookie support for token storage.**
- ⚙️ **Configurable token expiration and paths.**
- 🚫 **Built-in support for banning tokens.**
- 🤝 **Easy integration with Fastify.**

## Installation

Install the plugin using your package manager:

```bash
npm install fastify-jwt-simple
```

## Usage

### Registering the Plugin

To use the plugin, register it with your Fastify instance. You need to provide a `secret` and an `authUser` function to handle user authentication.

```ts
import Fastify from 'fastify';
import plugin from 'fastify-jwt-simple';

const app = Fastify();

await app.register(plugin, {
    secret: 'your-secret-key',
    authUser: async (request) => {
        const { user, pass } = request.body;
        if (user === 'test' && pass === 'test') {
            return { id: '123' }; // Return user data
        }
        throw new Error('Invalid credentials');
    }
});
```

### Routes

The plugin automatically registers the following routes:

- **`/auth/token`**: Obtain an access token.
- **`/auth/refresh`**: Refresh an access token using a refresh token.
- **`/auth/logout`**: Logout and ban the current tokens.

### Example

Here is an example of how to use the plugin:

```ts
import Fastify from 'fastify';
import plugin from 'fastify-jwt-simple';

const app = Fastify();

await app.register(plugin, {
    secret: 'mysecret',
    authUser: async (request) => {
        const { user, pass } = request.body;
        if (user === 'test' && pass === 'test') {
            return { id: '123' };
        }
        throw new Error('Invalid credentials');
    }
});

app.get('/', async () => {
    return { message: 'Hello, world!' };
});

await app.listen({ port: 3000 });
```

### Testing

You can find usage examples in the [tests](test/) directory. Below are some key scenarios covered:

- **Login and Token Retrieval**: See [`test/020-login.test.ts`](test/020-login.test.ts).
- **Token Refresh**: See [`test/030-access.test.ts`](test/030-access.test.ts).
- **Logout**: See [`test/040-logout.test.ts`](test/040-logout.test.ts).
- **Plugin Loading**: See [`test/010-load.test.ts`](test/010-load.test.ts).

### Configuration Options

The plugin accepts following options:

- **`secret`**: The secret key used for signing tokens (Required).
- **`authUser`**: A function to authenticate users (not required but default is deny access to all restricted endproints).
- **`path`**: Customizable paths for token, refresh, and logout routes.
- **`expiration`**: Token expiration times (in seconds).
- **`cookieConfig`**: Configuration for secure cookies.
- **`isRestricted`**: A function to filter which endpoints are protected or not (by default, all endproints are protected excluding the login page `path.token`)

#### Default Configuration

```ts
{
    path: {
        token: '/auth/token',
        refreshToken: '/auth/refresh',
        logout: '/auth/logout'
    },
    expiration: {
        token: 1200, // 20 minutes
        refreshToken: 604800 // 7 days
    },
    cookieConfig: {
        name: 'jwtToken'
    },
    isRestricted: async () => true,
    authUser: () => Promise.reject(...)
}
```

This plugin extends `@fastify/jwt` so all other configurations will be passed to this plugin too.

This plugin automatically loads these other plugins

* `@fastify/jwt`
* `@fastify/cookie`
* `@fastify/sensible`

Avoid to manually register these plugins.

## TypeScript Support

`fastify-jwt-simple` is written in Typescript and so is fully typed and works seamlessly with TypeScript. 

## Links

- **Report Bugs**: [GitHub Issues](https://github.com/your-repo/fastify-jwt-simple/issues)
- **Feature Requests**: [GitHub Issues](https://github.com/your-repo/fastify-jwt-simple/issues)
- **Help and Support**: [GitHub Discussions](https://github.com/your-repo/fastify-jwt-simple/discussions)
- **Contributing**: [Contributing Guidelines](https://github.com/your-repo/fastify-jwt-simple/blob/main/CONTRIBUTING.md)

## Contributing

We welcome contributions! 

## Author

[Emiliano Bruni](info@ebruni.it)

## License

This project is licensed under the [MIT License](LICENSE).