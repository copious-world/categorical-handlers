const test = require('ava');
const fsPromises = require('fs/promises')
//
const UserMessageEndpoint = require('../lib/users')
const PersistenceMessageEndpoint = require('../lib/persistence')


test('paths', t => {
    class TestClass extends UserMessageEndpoint {
        constructor(conf) {
            super(conf)
        }

        init() {
            // do nothing... 
        }

        app_message_handler(msg_obj) {
            return msg_obj
        }

        app_subscription_handler(topic,msg_obj) {

        }
    }


    let conf = {
        "port" : 5560,
        "address" : "localhost",
        "app_handles_subscriptions" : true,
        "all_users" : "assets",
        "user_directory" :  "assets/users",
        "directories" : {
            "happy" : "assets/emotable_up",
            "sad" : "assets/emotable_down"
        },
        "_gen_targets" : ["cake", "icecream"],
        "user_file_sep" : '+'
    }

    let inert = new TestClass(conf)
    console.log("----------------------------------")

    let u_obj = {
        "_id" : "ss8fsuwur9wur",
        "_tracking" : "skdnfsoir2bvn123b12v31343vbnv5"
    }
    let path = inert.make_path(u_obj)

console.log(path)

    t.is(path,"assets/ss8fsuwur9wur+skdnfsoir2bvn123b12v31343vbnv5.json")

    t.pass("this is a test")
})



test('users', async t => {
    //
    class TestClass extends UserMessageEndpoint {
        constructor(conf) {
            super(conf)
        }

        init() {
            // do nothing... 
        }


        app_subscription_handler(topic,msg_obj) {

        }

        app_asset_generator(u_obj) {
            console.dir(u_obj)
            return false
        }

        app_generate_tracking(msg_obj) {
            return "skdnfsoir2bvn123b12v31343vbnv5"
        }
    }

    let conf = {
        "port" : 5559,
        "address" : "localhost",
        "app_handles_subscriptions" : true,
        "all_users" : "test/users",
        "user_directory" :  "test/assets/users",
        "directories" : ["happy", "sad"],
        "_gen_targets" : ["cake", "icecream"],
        "create_OK" : true,
        "remove_OK" : true
    }

    let inert = new TestClass(conf)
    console.log("----------------------------------")

    let u_obj = {
        "_id" : "ss8fsuwur9wur"
    }
    let OK = await inert.ensure_user_directories(u_obj._id)
    t.true(OK,"ensure_directories OK")


    OK = await inert.create_entry_type(u_obj)
    t.true(OK,"create_entry_type OK")

    OK = await inert.create_user_assets(u_obj)

    u_obj.interesting_field = "THIS FIELD IS INTERESTING"

    OK = await inert.update_entry_type(u_obj)

    t.true(OK)

    let dat = await inert.load_data(u_obj)
    t.true(dat !== false)

    try {
        let u_loaded = JSON.parse(dat)
        t.is(u_loaded._id,u_obj._id)
        t.is(u_loaded.interesting_field,u_obj.interesting_field)
    } catch (e) {
        t.fail("JSON PARSE USER RECORD")
    }

    class TestClass2 extends PersistenceMessageEndpoint {
        constructor(conf) {
            super(conf)
        }

        init() {
            // do nothing... 
        }


        app_subscription_handler(topic,msg_obj) {

        }

        app_asset_generator(u_obj) {
            console.dir(u_obj)
            return false
        }

        app_generate_tracking(msg_obj) {
            return "skdnfsoir2bvn123b12v31343vbnv5"
        }
    }

    conf = {
        "port" : 5561,
        "address" : "localhost",
        "app_handles_subscriptions" : true,
        "all_users" : "test/users",
        "user_directory" :  "test/assets/users",
        "directories" : ["icing", "fudge"],
        "_gen_targets" : ["cake", "icecream"],
        "create_OK" : true,
        "remove_OK" : true
    }

    let inert2 = new TestClass2(conf)
    console.log("----------------------------------")

    u_obj = {
        "_id" : "ss8fsuwur9wur",
        "asset_type" : "icing",
        "key_field" : "butter",
        "butter" : "avocados"
    }
    OK = await inert2.ensure_user_directories(u_obj._id)
    t.true(OK,"ensure_directories OK")


    OK = await inert2.create_entry_type(u_obj)
    t.true(OK,"create_entry_type OK")

    u_obj.interesting_field = "THIS FIELD IS INTERESTING"

    OK = await inert2.update_entry_type(u_obj)

    t.true(OK)

    dat = await inert2.load_data(u_obj)
    t.true(dat !== false)

    try {
        let u_loaded = JSON.parse(dat)
        t.is(u_loaded._id,u_obj._id)
        t.is(u_loaded.interesting_field,u_obj.interesting_field)
    } catch (e) {
        t.fail("JSON PARSE USER RECORD")
    }


    await fsPromises.rm("test/users/ss8fsuwur9wur+skdnfsoir2bvn123b12v31343vbnv5.json")

    OK = await inert.remove_directories(u_obj._id)
    t.true(OK,"remove_directories OK")

    t.pass("this is a test")

    console.log("CLOSING STUFF")

    inert.closeAll()
    inert2.closeAll()
})


