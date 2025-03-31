
const EndpointCommon = require("./common")
//
const DEFAULT_ORIGIN_PUBLIC_PATH = "copious"

// Parent class handles publication 
//
// Handles data operations which are logged but don't handle data directly.
//
//
class OperationsMessageEndpoint extends EndpointCommon { // the general class forwards publication...

    constructor(conf) {
        super(conf)
        this.app_subscriptions_ok = false
        this.app_meta_universe = false
        this.logging_directories = conf.logging_directories
        this.ensure_user_directories('admin')
        this.init_public_directories()
    }

    async init_public_directories() {
        //
        for ( let dr in this.logging_directories ) {
            let pub_path = this.logging_directories[dr]
            await this.fos.ensure_directories(pub_path)
        }
    }


    async application_operation_cmd_handling(cmd_op,parameters) {
        console.log("The application should implement the application_operation_cmd_handling method ")
        return { "action" : "noop" }
    }

    async application_operation_info_handling(cmd_op,parameters) {
        console.log("The application should implement the application_operation_cmd_handling method ")
        return { "action" : "noop" }
    }

    async application_operation_cmd_reversal(was_cmd_op) {
        console.log("The application should implement the application_operation_cmd_handling method ")
        return { "action" : "noop" }
    }

    async undo(op_hash) {
        if ( this._op_history[op_hash] ) {
            let performed_op = this._op_history[op_hash]
            return await this.application_operation_cmd_reversal(performed_op)
        }
        return false
    }


    async app_message_handler(msg_obj) {
        let op = msg_obj._tx_op
        let result = "OK"
        if ( this.create_OK && !!(user_id) && (msg_obj._tx_directory_ensurance) ) {
            await this.ensure_user_directories(user_id)
        }
        switch ( op ) {
            case 'G' : {
                let stat = "OK"
                let cmd_op = msg_obj.op
                let parameters = msg_obj.parameters
                let op_hash = this.hash(msg_obj)
                let data = this.application_operation_info_handling(cmd_op,parameters)
                if ( data ) {
                    await this.app_publish_on_path("info-req","logging",data._app_log)
                    delete data._app_log
                    data._tx_op_hash = op_hash    
                } else {
                    stat = "ERR"
                }
                return({ "status" : stat, "data" : data,  "explain" : "get", "when" : Date.now() })
            }
            case 'S' : {
                let stat = "OK"
                let cmd_op = msg_obj.op
                let parameters = msg_obj.parameters
                let op_hash = this.hash(msg_obj)
                let data = this.application_operation_cmd_handling(cmd_op,parameters)
                if ( data ) {
                    await this.app_publish_on_path("state-trns","logging",data._app_log)
                    delete data._app_log
                    data._tx_op_hash = op_hash    
                } else {
                    stat = "ERR"
                }
                return({ "status" : stat, "data" : data,  "explain" : "get", "when" : Date.now() })
            }
            case 'R' : {        // delete asset from everywhere if all ref counts to zero. (unpinned)
                result = await this.undo(msg_obj._tx_op_hash)   // reverse
                result = result ? "OK" : "ERR"
                if ( result ) {
                    let data = result.data
                    await this.app_publish_on_path("undo-trns","logging",data._app_log)
                }
                break
            }
            default: {
                result = "NOOP"
            }
        }
        //
        return({ "status" : result, "explain" : `${op} performed`, "when" : Date.now(), "_tracking" : msg_obj._tx_op_hash })
    }

}



module.exports = OperationsMessageEndpoint
