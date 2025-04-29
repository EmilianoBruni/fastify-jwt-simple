import { t } from 'tap';
import Fastify from 'fastify';
import plugin from '@/index.js';

t.test('Fastify plugin loading', async t => {
    const fastify = Fastify();

    await fastify.register(plugin, {
        secret: 'mysecret'
    });

    // exists fastify.jwt from @fastify/jwt
    t.ok(fastify.jwt, 'fastify.jwt exists');

    fastify.get('/', async (req, rep) => {
        // check if fastify.jwtBannedToken exists
        t.ok(req.jwtBannedToken, 'req.jwtBannedToken exists');
        // check if fastify.jwtBannedRefresh exists
        t.ok(req.jwtBannedRefresh, 'req.jwtBannedRefresh exists');
        return { test: true };
    });

    const response = await fastify.inject('/');
    t.equal(response.statusCode, 200, 'response status code is 200');
    const payload = JSON.parse(response.payload);
    t.equal(payload.test, true, 'response payload is correct');

    await fastify.close();
});
