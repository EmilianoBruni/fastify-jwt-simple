import {
    FastifyJWTSimpleOptions,
    FastifyJWTSimple,
    FastifyJWTSimpleOptionsPostDefaults
} from '@/types.js';
import { FastifyInstance } from 'fastify';
import type { FastifyJWTOptions } from '@fastify/jwt';
import fastifyJwt from '@fastify/jwt';
import { FlatCache, FlatCacheEvents } from 'flat-cache';
import fp from 'fastify-plugin';

const ONE_SECOND_IN_MS = 1000;
const ONE_MINUTE_IN_MS = 60 * ONE_SECOND_IN_MS;

const addDefaultOptions = (
    options: FastifyJWTSimpleOptions
): FastifyJWTSimpleOptionsPostDefaults => {
    // add default options
    options.pathToken = options.pathToken || '/auth/token';
    options.pathRefreshToken =
        options.pathRefreshToken || '/auth/refresh-token';
    options.pathLogout = options.pathLogout || '/auth/logout';
    options.expiationToken = options.expiationToken || 60 * 20; // 20 minutes
    options.expiationRefreshToken =
        options.expiationRefreshToken || 60 * 60 * 24 * 7; // 7 days
    options.cookieConfig = options.cookieConfig || { name: 'jwtToken' };
    options.userData =
        options.userData ||
        (() => Promise.reject(new Error('userData function not implemented')));

    return options as FastifyJWTSimpleOptionsPostDefaults;
};

const plugin = async (
    app: FastifyInstance,
    options: FastifyJWTSimpleOptions
) => {
    const optionsPostDefaults = addDefaultOptions(options);

    // force add secure cookie to jwt options
    optionsPostDefaults.cookie = {
        cookieName: optionsPostDefaults.cookieConfig.name,
        signed: true
    };

    // register  @fastify/jwt plugin
    app.register(fastifyJwt, options as FastifyJWTOptions);

    // configure cache for banned tokens
    const jwtBannedTokenObj = jwtBannedToken(optionsPostDefaults);
    app.decorateRequest('jwtBannedToken', {
        getter() {
            return jwtBannedTokenObj;
        }
    });
    const jwtBannedRefreshObj = jwtBannedRefresh(optionsPostDefaults);
    app.decorateRequest('jwtBannedRefresh', {
        getter() {
            return jwtBannedRefreshObj;
        }
    });

    jwtBannedTokenObj.load();
    jwtBannedRefreshObj.load();

    jwtBannedTokenObj.on(FlatCacheEvents.ERROR, err => {
        app.log.error(err);
    });
    jwtBannedRefreshObj.on(FlatCacheEvents.ERROR, err => {
        app.log.error(err);
    });
    app.addHook('onClose', async () => {
        // to allow the process to exit
        jwtBannedTokenObj.stopAutoPersist();
        jwtBannedRefreshObj.stopAutoPersist();
    });
};

const jwtBannedToken = (options: FastifyJWTSimpleOptionsPostDefaults) =>
    new FlatCache({
        cacheId: 'jwt-banned-token',
        ttl: options.expiationToken * ONE_SECOND_IN_MS,
        persistInterval: 5 * ONE_MINUTE_IN_MS, // save to disk every..
        expirationInterval: ONE_MINUTE_IN_MS // checktime for expired keys
    });

const jwtBannedRefresh = (options: FastifyJWTSimpleOptionsPostDefaults) =>
    new FlatCache({
        cacheId: 'jwt-banned-refresh',
        ttl: options.expiationRefreshToken * ONE_SECOND_IN_MS,
        persistInterval: 5 * ONE_MINUTE_IN_MS, // 5 minute
        expirationInterval: 10 * ONE_MINUTE_IN_MS // 10 minute
    });

export default fp(plugin, {
    name: 'fastify-jwt-simple',
    fastify: '5.x'
});

export type { FastifyJWTSimpleOptions, FastifyJWTSimple };
