//
const EndpointCommon = require("./common")
//

// Parent class handles publication 

class UserMessageEndpoint extends EndpointCommon {

    constructor(conf) {
        //
        super(conf)
        //
        if ( conf ) {
            this.all_users = conf.all_users
            this._gen_targets = conf._gen_targets
            this.user_file_sep = conf.user_file_sep ? conf.user_file_sep :  '+'    
        }
        //
        this.init_public_directories()
    }

    //
    make_path(u_obj) {
        let user_id = u_obj._id
        // password is a hash of the password, might encrypt it... (also might carry other info to the back..)
        let tracking = u_obj._tracking
        if ( tracking === undefined ) {
            return false
        }
        let au = this.all_users.trim()
        user_id = user_id.trim()
        tracking = tracking.trim()
        let user_path = `${au}/${user_id}${this.user_file_sep}${tracking}.json`
        return(user_path)
    }


    async init_public_directories() {
        let ok = this.ensure_directories(this.user_directory)
        if ( !ok ) {
            console.log(`serious error when creating directories ${this.user_directory}`)
            console.log("exiting...")
            process.abort()
        }
        ok = this.ensure_directories(this.all_users)
        if ( !ok ) {
            console.log(`serious error when creating directories ${this.all_users}`)
            console.log("exiting...")
            process.abort()
        }
    }

    // create_user_assets
    // ---- 
    async create_user_assets(u_obj) {
        let user_id = u_obj._id
        let assets_dir = `${this.user_directory}/${user_id}`
        // assumes that the assets directories have been created
        let dir_paths = {
            "base" : assets_dir
        }
        u_obj.dir_paths = dir_paths
        //
        let assets = await this.app_asset_generator(u_obj,this._gen_targets)
        if ( assets ) {
            for ( let asset_key in assets ) {
                let assest_data = assets[asset_key]
                if ( typeof assest_data === "string" ) {
                    let file_name = `${assets_dir}/${asset_key}.json`
                    this.write_out_string(file_name,assest_data,{ 'flag' : 'wx' })
                }
            }
        }
    }


    //
    async app_message_handler(msg_obj) {
        let op = msg_obj._tx_op
        let result = "OK"
        let user_id = msg_obj._user_dir_key ? msg_obj[msg_obj._user_dir_key] : msg_obj._id
        if ( this.create_OK && !!(user_id) ) {
            await this.ensure_user_directories(user_id)
        }
        msg_obj._id = user_id
        //
        switch ( op ) {
            case 'G' : {        // get user information
                let stat = "OK"
                let data = await this.load_data(msg_obj)
                if ( data === false ) stat = "ERR"
                return({ "status" : stat, "data" : data,  "explain" : "get", "when" : Date.now() })
            }
            case 'D' : {        // delete user from everywhere if all ref counts gones.
                                // don't do this here...
                break
            }
            case 'S' : {  // or send
                let action = msg_obj._user_op
                if ( action === "create" ) {
                    result = await this.create_entry_type(msg_obj)
                    if ( result ) {
                        await this.create_user_assets(msg_obj)
                    }
                    result = result ? "OK" : "ERR"
                } else if ( action === "update" ) {
                    result = await this.update_entry_type(msg_obj)
                    result = result ? "OK" : "ERR"
                }
                break
            }
            default : {
                break
            }
        }
        //
        return({ "status" : result, "explain" : "op performed", "when" : Date.now(), "_tracking" : msg_obj._tracking })
    }

    //
    app_generate_tracking(msg_obj) {
        console.log("the application class should implement app_generate_tracking")
        return uuid4()
    }

    //
    app_asset_generator(u_obj,gen_targets) {
        console.log("the application class should implement app_generate_tracking")
        return false
    }

}


module.exports = UserMessageEndpoint
