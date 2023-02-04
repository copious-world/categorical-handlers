
const {ServeMessageEndpoint} = require("message-relay-services")
const fsPromises = require('fs/promises')


//
// FileOperations provides a class with override capability that wraps standard node.js file calls from fs/Promises
// Includes the capability of an endpoint server. Provides a bridge of inclusion for application calls for an enpoint
// that uses file operations.
// Most wrappers catch fs/Promises exceptions except where noted. Methods return false if data cannot be obtained.
// 

class FileOperations extends ServeMessageEndpoint {

    constructor (conf) {
        super(conf)
    }

    // ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ---- ----
   
    // dir_maker -- create a directory -- assume parent directory exists
    //           -- guards against THROW
    //  -- parameter :: path -- a path to the directory to be created
    //
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

    // dir_remover -- remove a directory -- assume parent directory exists
    //           -- guards against THROW
    //  -- parameter :: upath -- a path to the directory to be removed
    //                  recursive -- from fsPromises 'rm' -- will remove subdirectories if true
    //                  force     -- from fsPromises 'rm' -- will remove directories and override stoppage conditions if true
    //
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

    // file_remover -- remove a directory -- assume a valid path
    //           -- guards against THROW
    //  -- parameter :: path -- a path to the file to be removed
    //
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

    // write_out_string -- write string to file -- assume a valid path
    //           -- guards against THROW
    //  -- parameter :: path -- a path to the file that will contain the string
    //                  str -- a string to be written
    //                  ce_flags  -- options -- refer to the flags for node.js writeFile having to do with permissions, format, etc.
    //
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


    // write_append_string -- append string to the end of a file -- assume a valid path
    //           -- guards against THROW
    //  -- parameter :: path -- a path to the file that will contain the string
    //                  str -- a string to be written
    //                  ce_flags  -- options -- refer to the flags for node.js writeFile having to do with permissions, format, etc.
    //
    async write_append_string(path,str,ce_flags) {
        try {
            if ( ce_flags ) {
                await fsPromises.appendFile(path,str,ce_flags)
            } else {
                await fsPromises.appendFile(path,str)
            }    
        } catch (e) {
            console.log(path)
            console.log(e)
            return false
        }
        return true
    }
    


    // data_reader -- read a file from disk --- any format 
    //           -- will THROW
    //  -- parameter :: a_path -- a path to the file that contains the string to be read
    //             
    async data_reader(a_path) {             // possible THROW
        return await fsPromises.readFile(a_path)
    }

    // json data_reader -- read a JSON formatted file from disk
    //           -- will THROW
    //  -- parameter :: a_path -- a path to the file that contains the string to be read
    //             
    async json_data_reader(a_path) {             // possible THROW
        let str_buff = await fsPromises.readFile(a_path)
        let str = str_buff.toString()
        let obj = JSON.parse(str)
        return obj
    }


    // file_copier -- copy a file from path_1 to path_2 -- assume valid paths
    //           -- guards against THROW
    //  -- parameter :: path_1 -- source path
    //                  path_2 -- destination path
    //

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


    // ensure_directories -- attempts to construct or verify all directories along the path 
    //           -- guards against THROW
    //  -- parameter :: path -- a path to the file to be removed
    //                  top_dir -- an optional top level directy path under which directories will be created 

    async ensure_directories(path,top_dir) {
        let p_array = path.split('/')
        if ( p_array.length ) {
            let c_path = top_dir ? top_dir : ''
            for ( let dir of p_array ) {
                c_path += '/' + dir
                let status = await this.dir_maker(c_path)
                if ( !status ) return false
            }
            return c_path
        }
        return ''
    }
    
    // exists -- wraps the access method -- assumes the path is a valid path
    //           -- guards against THROW
    //  -- parameter :: path -- a path to the file under test
    //                  
    async exists(path,app_flags) {
        try {
            let flags = fsPromises.constants.R_OK | fsPromises.constants.W_OK
            if ( app_flags ) {
                flags = app_flags
            }
            await fsPromises.access(path, flags);
            return true
          } catch {
            return false
          }
    }


    // write_out_json -- write string to file -- assume a valid path
    //           -- guards against THROW
    //  -- parameter :: path -- a path to the file that will contain the string
    //                  obj -- a JSON stringifiable object
    //                  ce_flags  -- options -- refer to the flags for node.js writeFile having to do with permissions, format, etc.
    //  -- returns false on failing either stringify or writing
    //
    async write_out_json(path,obj,ce_flags) {
        try {
            let str = JSON.stringify(obj)
            return await this.write_out_string(path,str,ce_flags)
        } catch (e) {
            console.log(path)
            console.log(e)
            return false
        }
    }


    // load_data_at_path -- read a file from disk --- any format 
    //           -- guards against THROW
    //  -- parameter :: a_path -- a path to the file that contains the string to be read
    //             
    async load_data_at_path(path) {
        try {
            if ( !(path) ) return false
            let data = await this.data_reader(path)
            return(data.toString())
        } catch (e) {
            console.log(">>-------------load_data read------------------------")
            console.log(e)
            console.dir(msg_obj)
            console.log("<<-------------------------------------")
        }
        return false
    }

    // load_json_data_at_path -- read a JSON formatted file from disk
    //           -- guards against THROW
    //  -- parameter :: a_path -- a path to the file that contains the string to be read
    //             
    async load_json_data_at_path(path) {
        try {
            if ( !(path) ) return false
            return await this.json_data_reader(path)
        } catch (e) {
            console.log(">>-------------load_json_data read------------------------")
            console.log(e)
            console.dir(msg_obj)
            console.log("<<-------------------------------------")
        }
        return false
    }



    // output_string -- write string to file -- ensures path
    //           -- guards against THROW
    //  -- parameter :: path -- a path to the file that will contain the string
    //                  str -- a string to be written
    //                  ce_flags  -- options -- refer to the flags for node.js writeFile having to do with permissions, format, etc.
    //                  top_dir -- optional as starting point for the directory
    //
    async output_string(path,str,ce_flags,top_dir) {
        try {
            let final_dir = await this.ensure_directories(path,top_dir)
            if ( final_dir === false ) return false
            return this.write_out_string(final_dir,str,ce_flags)
        } catch (e) {
            console.log(path)
            console.log(e)
            return false
        }
    }


    // output_append_string -- append string to the end of a file -- assume a valid path
    //           -- guards against THROW
    //  -- parameter :: path -- a path to the file that will contain the string
    //                  str -- a string to be written
    //                  ce_flags  -- options -- refer to the flags for node.js writeFile having to do with permissions, format, etc.
    //                  top_dir -- optional as starting point for the directory
    //
    async output_append_string(path,str,ce_flags,top_dir) {
        try {
            let final_dir = await this.ensure_directories(path,top_dir)
            if ( final_dir === false ) return false
            return this.write_append_string(final_dir,str,ce_flags)
        } catch (e) {
            console.log(path)
            console.log(e)
            return false
        }
    }
    
    // output_json -- write string to file -- assume a valid path
    //           -- guards against THROW
    //  -- parameter :: path -- a path to the file that will contain the string
    //                  obj -- a JSON stringifiable object
    //                  ce_flags  -- options -- refer to the flags for node.js writeFile having to do with permissions, format, etc.
    //                  top_dir -- optional as starting point for the directory
    //  -- returns false on failing either stringify or writing
    //
    async output_json(path,obj,ce_flags,top_dir) {
        try {
            let final_dir = await this.ensure_directories(path,top_dir)
            if ( final_dir === false ) return false
            return await this.write_out_json(final_dir,obj,ce_flags)
        } catch (e) {
            console.log(path)
            console.log(e)
            return false
        }
    }

}


module.exports = FileOperations