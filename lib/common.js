
const {ServeMessageEndpoint} = require("message-relay-services")
const fsPromises = require('fs/promises')


class FileOperations  extends ServeMessageEndpoint {

    constructor (conf) {
        super(conf)
    }

    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
   
    async dir_maker(path) {
        try {
            await fsPromises.mkdir(path)
        } catch(e) {
            if ( e.code !== 'EEXIST') {
                console.error(e)
                return false
            }
        }
        return true
    }

    async dir_remover(upath,recursive,force) {
        try {
            await fsPromises.rm(upath,{ 'recursive': recursive, 'force': force })
        } catch(e) {
            if ( e.code !== 'ENOENT') {
                console.error(e)
                return false
            }
        }
        return true
    }

    async file_remover(path) {
        try {
            await fsPromises.rm(path)
            return true
        } catch(e) {
            console.log(path)
            console.log(e)
            return false
        }
    }

    async write_out_string(path,str,ce_flags) {
        try {
            if ( ce_flags ) {
                await fsPromises.writeFile(path,str,ce_flags)
            } else {
                await fsPromises.writeFile(path,str)
            }    
        } catch (e) {
            console.log(path)
            console.log(e)
            return false
        }
        return true
    }

    async data_reader(a_path) {
        return await fsPromises.readFile(a_path)
    }

    async file_copier(path_1,path_2) {
        try {
            await fsPromises.copyFile(path_1,path_2)
            return true
        } catch(e) {
            console.log(path_1)
            console.log(e)
            return false
        }
    }

}


class EndpointCommon extends FileOperations {

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
    
    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----

    //
    async ensure_directories(path) {
        let p_array = path.split('/')
        if ( p_array.length ) {
            let c_path = process.cwd()
            for ( let dir of p_array ) {
                c_path += '/' + dir
                let status = await this.dir_maker(path)
                if ( !status ) return false
            }
        }
        return true
    }

    // ensure_user_directories
    //  ---- a custom for the user directory and down... requires that container directories be present
    async ensure_user_directories(user_id) {
        //
        if ( !(this.create_OK) ) return false
        //
        let upath = this.user_directory + '/' + user_id
        let status =  await this.dir_maker(upath)
        if ( !status ) return false
        for ( let dr of this._type_directories ) {
            let subdr = upath + '/' + dr
            let status =  await this.dir_maker(subdr)
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
        let upath = this.user_directory + '/' + user_id
        let status = await this.dir_remover(upath,true,true)
        if ( !status ) return false
        //
        for ( let dr of this._type_directories ) {
            let subdr = upath + '/' + dr
            let status = await this.dir_remover(subdr,true,true)
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
            msg_obj._tracking = this.app_generate_tracking(msg_obj)
            let user_path = this.make_path(msg_obj)
            if ( !(user_path) ) return false
            this.user_manage_date('C',msg_obj)
            let ce_flags = this.create_entry_flags()
            await this.write_out_string(user_path,JSON.stringify(msg_obj),ce_flags)
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
            let data = await this.data_reader(user_path)
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
            let data = await this.data_reader(user_path)
            try {
                let u_obj = JSON.parse(data.toString())
                for ( let ky in msg_obj ) {
                    if ( ky === '_id' ) continue;
                    u_obj[ky] = msg_obj[ky]
                }
                this.user_manage_date('U',msg_obj)
                await this.write_out_string(user_path,JSON.stringify(u_obj),false)
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