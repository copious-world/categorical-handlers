
const {ServeMessageEndpoint} = require("message-relay-services")
const fsPromises = require('fs/promises')


class EndpointCommon extends ServeMessageEndpoint {
    //
    constructor (conf) {
        super(conf)
        this.user_directory = conf.user_directory
        this._type_directories = []
        if ( conf.directories && Array.isArray(conf.directories) ) {
            this._type_directories = conf.directories
        }
        this.create_OK = (conf.create_OK !== undefined) ? conf.create_OK : false
        this.remove_OK = false
        if ( conf.remove_OK ) {
            this.remove_OK = true
        }
        console.log(process.cwd())
    }

    //

    // ensure_directories
    //  ---- a custom for the user directory and down... requires that container directories be present
    async ensure_directories(user_id) {
        //
        if ( !(this.create_OK) ) return false
        //
        let upath = this.user_directory + '/' + user_id
        try {
            await fsPromises.mkdir(upath)
        } catch(e) {
            if ( e.code !== 'EEXIST') {
                console.error(e)
                return false
            }
        }
        for ( let dr of this._type_directories ) {
            let subdr = upath + '/' + dr
            try {
                await fsPromises.mkdir(subdr)
            } catch(e)  {
                if ( e.code !== 'EEXIST') {
                    console.error(e)
                    return false
                }
            }
        }
        return true
    }

    // remove_directories
    //  ---- custom for the user directory and down... deletees from below container directories down
    async remove_directories(user_id) {
        //
        if ( !(this.remove_OK) ) return
        //
        let upath = this.user_directory + '/' + user_id
        try {
            await fsPromises.rm(upath,{ recursive: true, force: true })
        } catch(e) {
            if ( e.code !== 'ENOENT') {
                console.error(e)
                return false
            }
        }
        for ( let dr of this._type_directories ) {
            let subdr = upath + '/' + dr
            try {
                await fsPromises.rm(subdr,{ recursive: true, force: true })
            } catch(e)  {
                if ( e.code !== 'ENOENT') {
                    console.error(e)
                    return false
                }
            }
        }
        return true
    }

    create_entry_flags() {
        return { 'flag' : 'wx' }
    }

    // data coming from a user dashboard, profile, etc.  (or from a registration process)
    async create_entry_type(msg_obj) {  // to the user's directory
        try {
            msg_obj._tracking = this.app_generate_tracking(msg_obj)
            let user_path = this.make_path(msg_obj)
            if ( !(user_path) ) return false
            this.user_manage_date('C',msg_obj)
            let ce_flags = this.create_entry_flags()
            await fsPromises.writeFile(user_path,JSON.stringify(msg_obj),ce_flags)
            this.user_action_keyfile('C',msg_obj)
            return true
        } catch(e) {
            console.log(e)
            return false
        }
    }

    async load_data(msg_obj) {
        try {
            let user_path = this.make_path(msg_obj)
            if ( !(user_path) ) return false
            let data = await fsPromises.readFile(user_path)
            return(data.toString())
        } catch (e) {
            console.log(">>-------------load_data read------------------------")
            console.log(e)
            console.dir(msg_obj)
            console.log("<<-------------------------------------")
        }
        return false
    }

    // 
    async update_entry_type(msg_obj) {
        try {
            let user_path = this.make_path(msg_obj)
            if ( !(user_path) ) return false
            let data = await fsPromises.readFile(user_path)
            try {
                let u_obj = JSON.parse(data.toString())
                for ( let ky in msg_obj ) {
                    if ( ky === '_id' ) continue;
                    u_obj[ky] = msg_obj[ky]
                }
                this.user_manage_date('U',msg_obj)
                await fsPromises.writeFile(user_path,JSON.stringify(u_obj))
                this.user_action_keyfile('U',msg_obj)
                return true
            } catch (e) {
                console.log(">>-------------update parse data------------------------")
                console.log(data.toString())
                console.error(e)
                console.dir(msg_obj)
                console.log("<<-------------------------------------")
                return false
            }
        } catch (e) {
            console.log(">>-------------update read------------------------")
            console.log(e)
            console.dir(msg_obj)
            console.log("<<-------------------------------------")
            return false
        }
    }


    make_path(msg_obj) {
        return "./" + msg_obj._id
    }
    //
    user_manage_date(op,msg_obj) {
        // do nothing ... the application implements.... the application should know of the kind of date fields that would be used by search services.
    }
    user_action_keyfile(op,msg_obj) {}
    
}


module.exports = EndpointCommon