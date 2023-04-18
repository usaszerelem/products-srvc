// ----------------------------------------------------------------
// Authorized operations that can be performed
/*
const USER_UPSERT = "UserUpsert";   // Add/Update
const USER_DELETE = "UserDelete";
const USER_LIST   = "UserList";
const PROD_UPSERT = "ProdUpsert";   // Add/Update
const PROD_DELETE = "ProdDelete";
const PROD_LIST   = "ProdList";
*/

module.exports = Object.freeze({
    USER_UPSERT: 'UserUpsert',      // User Create, update
    USER_DELETE: 'UserDelete',      // User Delete
    USER_LIST: 'UserList',          // User get, list
    PROD_UPSERT: 'ProdUpsert',      // Product Create, update
    PROD_DELETE: 'ProdDelete',      // Product Delete
    PROD_LIST: 'ProdList'           // Product get, list
});
