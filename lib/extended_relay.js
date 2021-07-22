const {MessageRelayer,MultiPathRelayClient} = require("message-relay-services")


class ExtendedMessageRelayer extends MessageRelayer {
    constructor(conf,wrapper) {
        super(conf,wrapper)
    }

    create_on_path(message,path) {
        message._user_op = 'create'
        return this.set_on_path(message,path)
    }


    update_on_path(message,path) {
        message._user_op = 'update'
        return this.set_on_path(message,path)
    }

}


class ExtendedMultiPathRelayClient extends MultiPathRelayClient {
    constructor(conf,wrapper) {
        super(conf,wrapper)
    }

    create_on_path(message,path) {
        message._user_op = 'create'
        return this.set_on_path(message,path)
    }


    update_on_path(message,path) {
        message._user_op = 'update'
        return this.set_on_path(message,path)
    }

}

module.exports.ExtendedMessageRelayer = ExtendedMessageRelayer
module.exports.ExtendedMultiPathRelayClient = ExtendedMultiPathRelayClient