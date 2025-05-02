import { t } from 'tap';
import Fastify, { FastifyRequest } from 'fastify';
import plugin from '@/index.js';
import { AddressInfo } from 'net';
import ajs from 'axios-jwt-simple';
import type { AjsRequestConfig } from 'axios-jwt-simple';

const userBody = 'test';
const passBody = 'test';
const ret = { id: '123' };

const userData = async <T, J>(request: FastifyRequest<{ Body: J }>) => {
    const { user, pass } = request.body as {
        user: string;
        pass: string;
    };
    if (user === user && pass === pass) {
        return ret as T;
    } else {
        throw new Error('Invalid credentials');
    }
};

t.test('Run fastify in random port with small expiration', async t => {
    const app = Fastify();
    await app.register(plugin, {
        secret: 'mysecret',
        userData,
        expirationToken: 12, // axios-jwt-simple consider invalid token if expiration is less than 10
        expirationRefreshToken: 14
    });

    // add a route to test
    app.get('/', async () => {
        return { test: true };
    });

    await app.listen({ host: '127.0.0.1', port: 0 });
    const address = app.server.address() as AddressInfo;
    const port = address?.port;
    t.equal(typeof address, 'object', 'address is an object');
    t.equal(typeof port, 'number', 'address.port is a number');
    t.equal(port > 1024, true, 'address.port is greater than 1024');
    t.equal(port < 65536, true, 'address.port is less than 65536');
    const baseUrl = `http://127.0.0.1:${port}`;
    // use axios.jwt.simple to test the route
    ajs.jwtInit(baseUrl, (cfg: AjsRequestConfig) => {
        cfg.data = {
            user: userBody,
            pass: passBody
        };
        return cfg;
    });

    await t.test('Call generic endpoint with authentication', async t => {
        const res = await ajs.get('/');
        t.equal(res.status, 200, 'status code is 200');
        t.has(res.data, { test: true }, 'data is { test: true }');
    });

    await t.test('Call generic endpoint with refresh', async t => {
        // wait 2 seconds to make the token invalid
        await new Promise(resolve => setTimeout(resolve, 2000));
        const res = await ajs.get('/');
        t.equal(res.status, 200, 'status code is 200');
        t.has(res.data, { test: true }, 'data is { test: true }');
    });
    await t.test('Call generic endpoint with new login', async t => {
        // wait 2 seconds to make the refreshToken invalid too
        await new Promise(resolve => setTimeout(resolve, 2000));
        const res = await ajs.get('/');
        t.equal(res.status, 200, 'status code is 200');
        t.has(res.data, { test: true }, 'data is { test: true }');
    });

    await app.close();
});
