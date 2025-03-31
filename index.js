let UserCategory = require('./lib/users')
let PersistenceCategory = require('./lib/persistence')
let PersistenceCachingCategory = require('./lib/persistence_caching')
let PersistenceCachingIPCCategory = require('./lib/persistence_caching_IPC')
let {ExtendedMessageRelayer,ExtendedMultiPathRelayClient} = require('./lib/extended_relay')
let OperationsCategory = require('./lib/operations')
//

module.exports = {
    "UserCategory" : UserCategory,
    "PersistenceCategory" : PersistenceCategory,
    "PersistenceCachingCategory" : PersistenceCachingCategory,
    "PersistenceCachingIPCCategory" : PersistenceCachingIPCCategory,
    "MessageRelayer" : ExtendedMessageRelayer,
    "MultiPathRelayClient" : ExtendedMultiPathRelayClient,
    "OperationsCategory" : OperationsCategory
}
