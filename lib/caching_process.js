
const fs = require('fs-extra')

// https://github.com/multiformats/multicodec/blob/master/table.csv
// https://github.com/trezor/trezor-crypto
// https://github.com/bitcoin/libbase58/blob/master/base58.c

function last_char_is(str,c) {
    let lc = str[str.len - 1]
    return ( lc === c)
}

class CachingProcess {

    constructor(conf) {
        super(conf)
        //
        this.cache_dir = conf.cache_dir
        this.interval = conf.cache_interval
        // 
        this.interval_id = null
        //
        if ( !(last_char_is(this.cache_dir,'/')) ) this.cache_dir += '/'
        this.user_directory = conf.user_directory
        if ( !(last_char_is(this.user_directory,'/')) ) this.user_directory += '/'
        this._type_directories = {}
        if ( conf.directories ) {
            this._type_directories = Object.assign({},conf.directories)
        }
        //
        this.init_cache_directories()
    }

    // ----  ----  ----  ----  ----  ---- 

    async init_cache_directories() {
        //
        let cache_path = this.cache_dir + this.user_directory
        try {
            await fs.ensureDir(cache_path)
        } catch(e)  {
            if ( e.code !== 'EEXIST') console.error(e)
        }
        //
        for ( let dr in this._type_directories ) {
            let cache_path = this.cache_dir + this._type_directories[dr]
            try {
                await fs.ensureDir(cache_path)
            } catch(e)  {
                if ( e.code !== 'EEXIST') console.error(e)
            }
        }
    }


    // ----  ----  ----  ----  ----  ---- 


    async dirCopy(src_in,dst_in) {
        //
        let entries = await fs.readdir(src)
        let allPromises = []
        for ( let entry of entries ) {
            let src = src_in + entry
            let dst = dst_in + entry
            let p = fs.copy(src,dst)
            allPromises.push(p)
        }
        //
        await Promise.all(allPromises)
    }


    async copyAll() {

        let src = this.user_directory
        let dst = this.cache_dir + this.user_directory
        await this.dirCopy(src,dst)
        //
        let allPromises = []
        for ( let ky in this._type_directories ) {
            let src = this._type_directories[ky]
            let dst = this.cache_dir + this._type_directories[ky]
            let p = fs.copy(src,dst)
            allPromises.push(p)        
        }

        await Promise.all(allPromises)
    }

    //
    startup_sync() {
        let interval = this.interval
        this.interval_id = setInterval(() => {
            this.copyAll()
        },interval)
    }

    stop_sync() {
        if ( this.interval_id !== null ) {
            clearInterval(this.interval_id)
            this.interval_id = null
        }
    }

}


module.exports = CachingProcess
