
const EndpointCommon = require("./common")
//

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
        this.init_public_directories()
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
        //
        let op = msg_obj._tx_op
        let result = "OK"
        let user_id = msg_obj._user_dir_key ? msg_obj[msg_obj._user_dir_key] : msg_obj._id
        if ( !user_id ) {
            user_id = "undetermined"
        }
        //
        switch ( op ) {
            case 'G' : {
                let stat = "OK"
                let cmd_op = msg_obj.op
                let parameters = msg_obj.parameters
                let op_hash = this.hash(msg_obj)
                let data = this.application_operation_info_handling(cmd_op,parameters)
                if ( data ) {
                    data._id = user_id
                    if (  data._app_log ) {
                        await this.app_publish_on_path("info-req","logging",data._app_log)
                        delete data._app_log
                    }
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
                    data._id = user_id
                    if (  data._app_log ) {
                        await this.app_publish_on_path("state-trns","logging",data._app_log)
                        delete data._app_log    
                    }
                    data._tx_op_hash = op_hash    
                } else {
                    stat = "ERR"
                }
                return({ "status" : stat, "data" : data,  "explain" : "get", "when" : Date.now() })
            }
            case 'R' : {        // delete asset from everywhere if all ref counts to zero. (unpinned)
                let data = await this.undo(msg_obj._tx_op_hash)   // reverse
                result = data ? "OK" : "ERR"
                if ( data ) {
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
