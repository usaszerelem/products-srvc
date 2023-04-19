// ----------------------------------------------------------------
// Authorized operations that can be performed

module.exports = Object.freeze({
    OP_USER_UPSERT: 'UserUpsert',      // User Create, update
    OP_USER_DELETE: 'UserDelete',      // User Delete
    OP_USER_LIST: 'UserList',          // User get, list
    OP_PROD_UPSERT: 'ProdUpsert',      // Product Create, update
    OP_PROD_DELETE: 'ProdDelete',      // Product Delete
    OP_PROD_LIST: 'ProdList',           // Product get, list

    METHOD_LENGTH_MIN: 3,
    METHOD_LENGTH_MAX: 7,
    TIMESTAMP_LENGTH: 24,
    ID_LENGTH: 22,

    AUDIT_OPERATION_LENGTH_MIN: 5,
    AUDIT_OPERATION_LENGTH_MAX: 12,
    AUDIT_DATA_MAX_LENGTH: 4000
});
