# categorical-handlers

[![npm](https://img.shields.io/badge/npm-v7.20.3-brightgreen)](https://www.npmjs.com/package/categorical-handlers)

This javascript package exposes three basic classes which are all specialized servers based on the **message-relay-services** ***ServeMessageEndpoint*** class:

1. **UserCategory**	
2. **PersistenceCategory**
3. **PersistenceCachingCategory** 
4. **PersistenceCachingIPCCategory**
5. **OperationsCategory**

The application should override these classes and create instance methods.

### Purpose

The first two classes provide high level operation handling which may be useful for applications that handle the management of meta data files (records) for user/service relationships and for user/sevice management of user owned assets.

Innstances of ***UserCategory*** and ***PersistenceCategory*** read the **\_tx\_op** field of incoming messages in order to call the appropriate methods implemented by these classes.

The third class, ***PersistenceCachingCategory***, provides a high level set of operations for starting up the cache (perhaps a RAM Disk) containing the JSON object files. It may be configured to read from the cache and store on a backup disk attached to the machine on which the endpoints run.

The fourth class is provided, ***PersistenceCachingIPCCategory***, which allows a client application to spawn a child persistence endpoint and be guaranteed IPC communication with the child process.

Both *PersistenceCachingCategory* and *PersistenceCachingIPCCategory* provide the same functionality as *PersistenceCategory* but extend other internal classes derived from the caching class of the npm module, [extra-file-class](https://www.npmjs.com/package/extra-file-class)

The fifth class, ***OperationsCategory***, is fairly minimalist, but provides a framework for requesting data operations.


### Operations

The field, **\_tx\_op**, is managed by the classes in [**message-relay-services**](https://www.npmjs.com/package/message-relay-services).

These classes expects that the application will provide another field identifying the user associated with the JSON meta data object.

```
msg_obj._user_dir_key ? msg_obj[msg_obj._user_dir_key] : msg_obj._id
```

That is, the classes look for either **\_user\_dir\_key** or **\_id**. The classes do not have any influence on how the ID is made. However, it does use it as a file path, so IDs should preferably be encoded strings.

There is one more field expected in the class, **\_user\_op**. The classes expect the values of **\_user\_op** to be either *create* or *update*.

The classes add a field **\_tracking**, which is also used in making file names and directories. The classes provide a method, *app_generate_tracking* that the application may overried to provide the **\_tracking** field value. This method, *app_generate_tracking*, should also return an encoded string.

These classes implement the method **app\_message\_handler(msg_obj)** as required by the *ServeMessageEndpoint* class from [**message-relay-services**](https://www.npmjs.com/package/message-relay-services). The two classes differ in details on how they implement this method.

The operation class is more apt to use the user id in order to identify the local LAN server that is making requests to move data. Usually, in the case of its use, some arrangement with ssh has been made between the servers. Also, it is more likely that the endpoint implementations will make use of TLS.

### Install
```
npm install -s categorical-handlers
```

## Classes

Here is more detail on the classes.


### 1. **UserCategory**

***UserCategory*** implements *app\_message\_handler(msg_obj)* handling the basic *\_tx\_op* operations. For this class, the expected values for *\_tx\_op* are the following:

* S - set the user object by either creating or updating (*\_user\_op**)
* G - get the user object - reads the object from the list of all users.
* D - delete the object with the **\_id**. (not implemented)

This class provide a stub for  **app\_generate\_tracking(msg_obj)** and also for **app\_asset\_generator(template\_dir,user\_obj,gen\_targets)**

> **app\_asset\_generator** should return a map of asset keys to string representations of assets. The assets will be directly written to files. The keys will be from *gen\_targets*.

This class has a field **create\_OK** set to true, meaning that it is OK to create non-existant directories belonging users. Some applications may want to set this field to false in the descendent classes.

#### Configure UserCategory

```
{
	"all_users" : <directory for all user meta data objects>
	"user_directory" : <top level directory of user assets>,
	"directories" : <a map of blog types to directory paths>,
	"asset_template_dir" : <a prepared directoy of meta data templates>
	"_gen_targets" : <types asset lists that will be initialized for users>
}
```

### 2. **PersistenceCategory**

***PersistenceCategory*** implements *`app_message_handler(msg_obj)`* handling the basic operations. For this class, the expected values for *`_tx_op`* are the following:

* S - set the asset object by either creating or updating (*\_user\_op**)
* G - get the asset object - reads the object from the list of all users.
* D - delete the object with the **\_id** from the user asset directories.
* P - publish the asset object (not a pub/sub operation) by moving it to a public directory.
* U - unpublish ... remove the asset object from the public directory.

This class provide a stub for **app_generate_tracking(msg_obj)**.

Besides this stub, this class provide three more.

* **app\_subscription\_handler(topic,msg_obj)**
> Provided as a default method. This sets the **\_tx\_op** to 'P' and calls **app_generate_tracking(msg_obj)**.

* **application\_data\_update(msg_obj,data)**
> Called by the *get* branch. This allows an application to make changes to the stored meta data object prior to sending them back to the requester.

* **user\_manage\_date(op,msg_obj)**
> This is called by methods that create or object JSON meta data objects. It provides the application a means of setting up the date fields. If the application does not implement this, it does nothing.

#### Configure PersistenceCategory

```
{
	"user_directory" : <top level directory of user assets>,
	"directories" : <a map of blog types to directory paths>
}
```

### 2. **OperationsCategory**

***OperationsCategory*** assumes it will receive messages with `_tx_op` set to G,S or R. These are *get*, *set*, and *reverse* - also known as *undo*.  It will publish to a "logging" path with topics "info-req" and "state-trns". It will call upon application to handle custom operations. It unpacks "op" and "parameters". It sends back a data object as part of its transaction response object. The data will have a field `_tx_op_hash` which is the application may use for identifying the operation. This class is used in the module [`repository-bridge`](https://www.npmjs.com/package/repository-bridge) in the LAN node implementation.

For this class, the expected values for *\_tx\_op* are the following:

* S - Sends a q request for an operation which may return desired information as well.
* G - Sends a q request for an operation which should return desired information. For example, it may request an upload directory.
* R - Reverse an operation if its hash is known and it can be reversed.



