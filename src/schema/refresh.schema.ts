// define a ajv schema for refresh get request

import { Type } from '@sinclair/typebox';

export default {
    tags: ['auth'],
    response: {
        200: Type.Object({
            token: Type.String()
        }),
        401: Type.Object({
            statusCode: Type.Number(),
            code: Type.String(),
            error: Type.String(),
            message: Type.String()
        }),
        501: Type.Object({
            statusCode: Type.Number(),
            code: Type.String(),
            error: Type.String(),
            message: Type.String()
        })
    }
};
