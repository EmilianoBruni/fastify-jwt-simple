import {
    FastifyJWTSimpleOptions,
    FastifyJWTSimple,
    FastifyJWTSimpleOptionsPostDefaults,
    FastifyJWTSimpleDecorator
} from '@/types.js';
import { FastifyInstance, FastifyReply } from 'fastify';
import type { FastifyJWTOptions } from '@fastify/jwt';
import fastifyJwt from '@fastify/jwt';
import { FlatCache, FlatCacheEvents } from 'flat-cache';
import fp from 'fastify-plugin';
import authorize from '@/lib/authenticate.js';
import { FST_USER_DATA_NOT_IMPLEMENTED } from '@/lib/errors.js';

import pluginCookie from '@fastify/cookie';

const ONE_SECOND_IN_MS = 1000;
const ONE_MINUTE_IN_MS = 60 * ONE_SECOND_IN_MS;

const addDefaultOptions = (
    options: FastifyJWTSimpleOptions
): FastifyJWTSimpleOptionsPostDefaults => {
    // add default options
    options.pathToken = options.pathToken || '/auth/token';
    options.pathRefreshToken = options.pathRefreshToken || '/auth/refresh';
    options.pathLogout = options.pathLogout || '/auth/logout';
    options.expirationToken = options.expirationToken || 60 * 20; // 20 minutes
    options.expirationRefreshToken =
        options.expirationRefreshToken || 60 * 60 * 24 * 7; // 7 days
    options.cookieConfig = options.cookieConfig || { name: 'jwtToken' };
    options.userData =
        options.userData ||
        (() => Promise.reject(new FST_USER_DATA_NOT_IMPLEMENTED()));
    options.isToAuthenticate = options.isToAuthenticate || (async () => true);

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

    if (!app.hasPlugin('@fastify/sensible')) {
        app.register(import('@fastify/sensible'));
    }

    if (!app.hasPlugin('@fastify/cookie')) {
        app.register(pluginCookie, {
            secret: optionsPostDefaults.secret.toString()
        }).after(() => {
            app.decorateReply('setSCookie', setSCookie);
        });
    } else {
        app.decorateReply('setSCookie', setSCookie);
    }

    // register  @fastify/jwt plugin
    if (!app.hasPlugin('@fastify/jwt')) {
        app.register(fastifyJwt, options as FastifyJWTOptions);
    } else {
        app.log.error(
            "!!! Don't manually register @fastify/jwt. Disable @fastify/jtw registration and move all options to fastify-jwt-simple !!!"
        );
    }

    // configure cache for banned tokens
    const jwtBannedTokenObj = jwtBannedToken(optionsPostDefaults);
    const jwtBannedRefreshObj = jwtBannedRefresh(optionsPostDefaults);

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

    const decorator: FastifyJWTSimpleDecorator = {
        jwtBannedToken: jwtBannedTokenObj,
        jwtBannedRefresh: jwtBannedRefreshObj,
        isToAuthenticate: optionsPostDefaults.isToAuthenticate,
        userData: optionsPostDefaults.userData,
        pathToken: optionsPostDefaults.pathToken,
        pathRefreshToken: optionsPostDefaults.pathRefreshToken,
        pathLogout: optionsPostDefaults.pathLogout,
        expirationToken: optionsPostDefaults.expirationToken,
        expirationRefreshToken: optionsPostDefaults.expirationRefreshToken
    };

    app.decorate('fjs', decorator);
    app.addHook('onRequest', authorize);

    // add routes
    app.register(import('@/routes/token.js'), {
        prefix: optionsPostDefaults.pathToken
    });
    app.register(import('@/routes/refresh.js'), {
        prefix: optionsPostDefaults.pathRefreshToken
    });
    app.register(import('@/routes/logout.js'), {
        prefix: optionsPostDefaults.pathLogout
    });
};

const jwtBannedToken = (options: FastifyJWTSimpleOptionsPostDefaults) =>
    new FlatCache({
        cacheId: 'jwt-banned-token',
        ttl: options.expirationToken * ONE_SECOND_IN_MS,
        persistInterval: 5 * ONE_MINUTE_IN_MS, // save to disk every..
        expirationInterval: ONE_MINUTE_IN_MS // checktime for expired keys
    });

const jwtBannedRefresh = (options: FastifyJWTSimpleOptionsPostDefaults) =>
    new FlatCache({
        cacheId: 'jwt-banned-refresh',
        ttl: options.expirationRefreshToken * ONE_SECOND_IN_MS,
        persistInterval: 5 * ONE_MINUTE_IN_MS, // 5 minute
        expirationInterval: 10 * ONE_MINUTE_IN_MS // 10 minute
    });

// Set cookie with secure, httpOnly, sameSite, signed and expires
function setSCookie(
    this: FastifyReply,
    cookieName: string,
    cookieValue: string,
    expires: Date,
    path: string = '/'
) {
    const hostname = this.request.hostname;
    return this.setCookie(cookieName, cookieValue, {
        domain: hostname,
        path,
        secure: true, // send cookie over HTTPS only
        httpOnly: true,
        sameSite: true, // alternative CSRF protection
        signed: true,
        expires: expires
    });
}

export default fp(plugin, {
    name: 'fastify-jwt-simple',
    fastify: '5.x'
});

export type { FastifyJWTSimpleOptions, FastifyJWTSimple };
