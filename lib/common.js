
const {FileOperations} = require('extra-file-class')
const {ServeMessageEndpoint} = require("message-relay-services")
const {createHash} = require('crypto')

//$>>	do_hash_buffer
async function do_hash_text(text) {
    let hasher = createHash('sha256')
    hasher.update(text)
    const hash = await hasher.digest(`base64url`);
    return hash
}


class EndpointCommon extends ServeMessageEndpoint {

    //
    constructor (conf) {
        super(conf)
        this.category_directory = conf.category_directory
        this._type_directories = []
        if ( conf.directories && Array.isArray(conf.directories) ) {
            this._type_directories = conf.directories
        }
        this.create_OK = (conf.create_OK !== undefined) ? conf.create_OK : false
        this.remove_OK = false
        if ( conf.remove_OK ) {
            this.remove_OK = true
        }
        this.top_dir = process.cwd()
        if ( conf.top_dir ) {
            this.top_dir = this.top_dir
        }
        console.log(this.top_dir)
        this.fos = new FileOperations(conf)  // initialize file operations
    }


    async object_hash(obj) {
        let text = JSON.stringify(obj)
        return  await do_hash_text(text)
    }

    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

    // ensure_user_directories
    //  ---- a custom for the user directory and down... requires that container directories be present
    async ensure_user_directories(user_id) {
        //
        if ( !(this.create_OK) ) return false
        //
        let upath = this.category_directory + '/' + user_id
        let status =  await this.fos.ensure_directories(user_id,this.category_directory)
        if ( !status ) return false
        for ( let dr of this._type_directories ) {
            let subdr = upath + '/' + dr
            let status =  await this.fos.dir_maker(subdr)
            if ( !status ) return false
        }
        return true
    }

    // remove_directories
    //  ---- custom for the user directory and down... deletees from below container directories down
    async remove_directories(user_id) {
        //
        if ( !(this.remove_OK) ) return
        //
        let upath = this.category_directory + '/' + user_id
        let status = await this.fos.dir_remover(upath,true,true)
        if ( !status ) return false
        //
        for ( let dr of this._type_directories ) {
            let subdr = upath + '/' + dr
            let status = await this.fos.dir_remover(subdr,true,true)
            if ( !status ) return false
        }
        return true
    }

    create_entry_flags() {
        return { 'flag' : 'wx' }
    }

    // data coming from a user dashboard, profile, etc.  (or from a registration process)
    async create_entry_type(msg_obj) {  // to the user's directory
        try {
            msg_obj._tracking = await this.app_generate_tracking(msg_obj)
            let category_path = this.make_path(msg_obj)
            if ( !(category_path) ) return false
            this.user_manage_date('C',msg_obj)
            let ce_flags = this.create_entry_flags()
            await this.fos.output_json(category_path,msg_obj,ce_flags)  // ensures directories object to its own file
            await this.user_action_keyfile('C',msg_obj)     // object to places including enter into table
            return true
        } catch(e) {
            console.log(e)
            return false
        }
    }

    //
    async load_data(msg_obj) {
        try {
            let category_path = this.make_path(msg_obj)
            return await this.fos.load_data_at_path(category_path)
        } catch (e) {
            console.log(">>-------------load_data read------------------------")
            console.log(e)
            console.dir(msg_obj)
            console.log("<<-------------------------------------")
        }
        return false
    }

    //
    async load_json_data(msg_obj) {
        try {
            let category_path = this.make_path(msg_obj)
            return await this.fos.load_json_data_at_path(category_path)
        } catch (e) {
            console.log(">>-------------load_json_data read------------------------")
            console.log(e)
            console.dir(msg_obj)
            console.log("<<-------------------------------------")
        }
        return false
    }

    // 
    async update_entry_type(msg_obj) {
        try {
            let category_path = this.make_path(msg_obj)
            if ( !(category_path) ) return false
            let data = await this.fos.data_reader(category_path)
            try {
                let u_obj = JSON.parse(data.toString())
                for ( let ky in msg_obj ) {
                    if ( ky === '_id' ) continue;
                    u_obj[ky] = msg_obj[ky]
                }
                this.user_manage_date('U',u_obj)
                await this.fos.write_out_string(category_path,JSON.stringify(u_obj),false)
                await this.user_action_keyfile('U',msg_obj)
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


    make_path(msg_obj) {  // descendants have special cases
        return "./" + msg_obj._id
    }
    //
    user_manage_date(op,msg_obj) {
        // do nothing ... the application implements.... the application should know of the kind of date fields that would be used by search services.
    }
    user_action_keyfile(op,msg_obj) {}
    
}


module.exports = EndpointCommon