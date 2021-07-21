
const EndpointCommon = require("./common")
const fsPromises = require('fs/promises')
//

const DEFAULT_ORIGIN_PUBLIC_PATH = "copious"

// Parent class handles publication 
//
class PersistenceMessageEndpoint extends EndpointCommon { // the general class forwards publication...

    constructor(conf) {
        super(conf)
        this.app_subscriptions_ok = false
        this.ensure_user_directories('admin')
        this.init_public_directories()
    }

    make_path(u_obj) {
        let entry_type = u_obj.asset_type
        let user_id = u_obj._id
        let user_path = this.user_directory + '/' + user_id + '/'
        user_path += entry_type + '/' + u_obj[u_obj.key_field] + ".json"
        return(user_path)
    }

    make_public_path(msg_obj) {
        let entry_type = msg_obj.asset_type
        //
        let public_path = this._type_directories[entry_type]
        if ( typeof public_path !== 'string' ) {
            if ( public_path === undefined ) {
                origin = DEFAULT_ORIGIN_PUBLIC_PATH
            } else {
                let origin = msg_obj._origin
                if ( origin === undefined ) {
                    origin = DEFAULT_ORIGIN_PUBLIC_PATH
                }
                public_path = public_path[origin]    
            }
        }
        public_path += '/' + msg_obj[msg_obj.key_field] + ".json"    
        return public_path
    }

    async init_public_directories() {
        //
        for ( let dr in this._type_directories ) {
            let pub_path = this._type_directories[dr]
            try {
                await fsPromises.mkdir(pub_path)
            } catch(e)  {
                if ( e.code !== 'EEXIST') console.error(e)
            }
        }
    }

    async publish(msg_obj) {        // actual pulication... this file becomes available to the general public...
        let user_path = ""
        try {
            //
            user_path = this.make_path(msg_obj)
            if ( !(user_path) ) return false
            let public_path = this.make_public_path(msg_obj)
            ///
            await fsPromises.copyFile(user_path,public_path)
            return true
        } catch(e) {
            console.log(user_path)
            console.log(e)
            return false
        }
    }

    async unpublish(msg_obj) {        // remove from publication directory... this file becomes unavailable to the general public...
        let user_path = ""
        try {
            //
            let public_path = this.make_public_path(msg_obj)
            await fsPromises.rm(public_path)
            //
            return true
        } catch(e) {
            console.log(user_path)
            console.log(e)
            return false
        }
    }

    //    
    create_entry_flags() {
        return { 'flag' : 'w' }
    }

    //
    async delete(msg_obj) {
        // check for some criteria... a sys admin token, a ref count ... replicated, etc.
        let user_path = ""
        try {
            user_path = this.make_path(msg_obj)
            if ( !(user_path) ) return false
            await fsPromises.rm(user_path)
            //
            let public_path = this.make_public_path(msg_obj)
            await fsPromises.rm(public_path)
            //
            this.user_action_keyfile('D',msg_obj)
            return true
        } catch (e) {
            console.log(">>-------------update read------------------------")
            console.log(data.toString())
            console.log(e)
            console.dir(msg_obj)
            console.log("<<-------------------------------------")
        }
        return false
    }

    async app_message_handler(msg_obj) {
        let op = msg_obj._tx_op
        let result = "OK"
        let user_id = msg_obj._user_dir_key ? msg_obj[msg_obj._user_dir_key] : msg_obj._id
        if ( (user_id === undefined) && (msg_obj._id !== undefined) ) {
            user_id = msg_obj._id
        }
        msg_obj._id = user_id
        if ( this.create_OK && !!(user_id) && (msg_obj._tx_directory_ensurance) ) {
            await this.ensure_user_directories(user_id)
        }
        switch ( op ) {
            case 'P' : {
                result = await this.publish(msg_obj)
                result = result ? "OK" : "ERR"
                break
            }
            case 'U' : {
                result = await this.unpublish(msg_obj)
                result = result ? "OK" : "ERR"
                break
            }
            case 'G' : {        // get user information
                let stat = "OK"
                let data = await this.load_data(msg_obj)
                if ( data === false ) { stat = "ERR"; data = "" }
                else {
                    data = this.application_data_update(msg_obj,data)
                }
                return({ "status" : stat, "data" : data,  "explain" : "get", "when" : Date.now() })
            }
            case 'D' : {        // delete asset from everywhere if all ref counts to zero. (unpinned)
                result = await this.delete(msg_obj)
                result = result ? "OK" : "ERR"
                break
            }
            default: {  // or send 'S'
                let action = msg_obj._user_op
                if ( action === "create" ) {
                    result = await this.create_entry_type(msg_obj)
                } else if ( action === "update" ) {
                    result = await this.update_entry_type(msg_obj)
                }
                result = result ? "OK" : "ERR"
            }
        }
        //
        return({ "status" : result, "explain" : `${op} performed`, "when" : Date.now() })
    }

    //
    app_generate_tracking(msg_obj) {
        console.log("the application class should implement app_generate_tracking")
        return uuid4()
    }
    

    app_subscription_handler(topic,msg_obj) {
        msg_obj._tx_op = 'P'
        this.app_message_handler(msg_obj)
    }

    application_data_update(msg_obj,data) {
        return(data)
    }

}



module.exports = PersistenceMessageEndpoint
