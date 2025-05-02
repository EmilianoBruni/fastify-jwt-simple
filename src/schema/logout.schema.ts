// define a ajv schema for logout get request

import { Type } from '@sinclair/typebox';

export default {
    tags: ['auth'],
    response: {
        200: Type.Object({
            message: Type.String()
        })
    }
};
