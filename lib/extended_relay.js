const {MessageRelayer} = require("message-relay-services")



class ExtendedMessageRelayer extends MessageRelayer {
    constructor(conf,wrapper) {
        super((conf,wrapper))
    }

    create_on_path(message,path) {
        _user_op._user_op = 'create'
        return this.set_on_path(message,path)
    }


    update_on_path(message,path) {
        _user_op._user_op = 'update'
        return this.set_on_path(message,path)
    }

}


module.exports = ExtendedMessageRelayer