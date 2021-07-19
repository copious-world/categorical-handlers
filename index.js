let UserCategory = require('./lib/users')
let PersistenceCategory = require('./lib/persistence')
let CachingProcess = require('./lib/caching_process')
let ExtendedMessageRelayer = require('./lib/extended_relay')



module.exports = {
    "UserCategory" : UserCategory,
    "PersistenceCategory" : PersistenceCategory,
    "CachingProcess" : CachingProcess,
    "MessageRelayer" : ExtendedMessageRelayer
}
