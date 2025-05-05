import { t } from 'tap';
import Fastify from 'fastify';
import plugin from '@/index.js';

t.test('Fastify plugin loading', async t => {
    const app = Fastify();

    await app.register(plugin, {
        secret: 'mysecret'
    });

    // exists fastify.jwt from @fastify/jwt
    t.ok(app.jwt, 'fastify.jwt exists');
    t.ok(app.fjs, 'app.fjs exists');
    t.ok(app.fjs.jwtBannedToken, 'app.fjs.jwtBannedToken exists');
    t.ok(app.fjs.jwtBannedRefresh, 'app.fjs.jwtBannedRefresh exists');
    t.ok(app.fjs.isRestricted, 'app.fjs.isToAuthenticate exists');
    t.ok(app.fjs.authUser, 'app.fjs.userData exists');
    t.equal(
        typeof app.fjs.isRestricted,
        'function',
        'app.fjs.isToAuthenticate is a function'
    );
    t.equal(
        typeof app.fjs.authUser,
        'function',
        'app.fjs.userData is a function'
    );

    await app.close();
});

t.test('@fastify/jwt loaded before fastify-jwt-simple', async () => {
    const app = Fastify();

    await app.register(import('@fastify/jwt'), {
        secret: 'mysecret'
    });

    await app.register(plugin, {
        secret: 'anothersecret'
    });
    await app.close();
});

t.test('isAuthenticate function', async t => {
    const app = Fastify();
    await app.register(plugin, {
        secret: 'mysecret'
    });

    app.get('/', async () => {
        return { test: true };
    });

    // by default all routes require authentication so 403
    const response = await app.inject('/');
    t.equal(response.statusCode, 403, 'response status code is 403');
    const payload = JSON.parse(response.payload);
    t.equal(payload.error, 'Forbidden', 'response payload is correct');

    // test isToAuthenticate to bypass authentication
    app.fjs.isRestricted = async () => {
        return false;
    };

    // now the route should return 200
    const response2 = await app.inject('/');
    t.equal(response2.statusCode, 200, 'response status code is 200');
    const payload2 = JSON.parse(response2.payload);
    t.equal(payload2.test, true, 'response payload is correct');

    await app.close();
});
