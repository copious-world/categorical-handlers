# categorical-handlers

This javascript package exposes three basic classes which are all specialized servers based on the **message-relay-services** ***ServeMessageEndpoint*** class:

1. **UserCategory**	
2. **PersistenceCategory**
3. **CachingProcess** 

The application should override these classes and create instance methods.

### Purpose

The first two classes provide high level operation handling which may be useful for applications that handle the management of meta data files (records) for user/service relationships and for user/sevice management of user owned assets.

Innstances of *UserCategory* and *PersistenceCategory* read the **\_tx\_op** field of incoming messages in order to call the appropriate methods implemented by these classes.

The third class, *CachingProcess*, provides a high level set of operations for starting up the cache (perhaps a RAM Disk) containing the JSON object files. It may be configured to read rom the cache and store on a backup disk attached to the machine on which the endpoints run.

### Operations

The field, **\_tx\_op**, is managed by the classes in **message-relay-services**.

These classes expects that the application will provide another field identifying the user associated with the JSON meta data object.

```
msg_obj._user_dir_key ? msg_obj[msg_obj._user_dir_key] : msg_obj._id
```

That is, the classes look for either **\_user\_dir\_key** or **\_id**. The classes do not have any influence on how the ID is made. However, it does use it as a file path, so IDs should preferably be encoded strings.

There is one more field expected in the class, **\_user\_op**. The classes expect the values of **\_user\_op** to be either *create* or *update*.

The classes add a field **\_tracking**, which is also used in making file names and directories. The classes provide a method, *app_generate_tracking* that the application may overried to provide the **\_tracking** field value. This method, *app_generate_tracking*, should also return an encoded string.

These classes implement the method **app\_message\_handler(msg_obj)** as required by the *ServeMessageEndpoint* class. The two classes differ in details on how they implement this method.

### Install
```
npm install categorical-handlers
```

## Classes

Here is more detail on the classes.


### 1. **UserCategory**

*UserCategory* implements *app\_message\_handler(msg_obj)* handling the basic *\_tx\_op* operations. For this class, the expected values for *\_tx\_op* are the following:

* S - set the user object by either creating or updating (*\_user\_op**)
* G - get the user object - reads the object from the list of all users.
* D - delete the object with the **\_id**. (not implemented)

This class provide a stub for  **app_generate_tracking(msg_obj)**.

This class has a field **create\_OK** set to true, meaning that it is OK to create non-existant directories belonging users. Some application may want to set this field to false.

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

*UserCategory* implements *app\_message\_handler(msg_obj)* handling the basic *\_tx\_op* operations. For this class, the expected values for *\_tx\_op* are the following:

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


### 3. **CachingProcess**

Applications that implement descendents of this class may call ***startup\_sync()*** after the instance object is created. And, when the applcation is done with the process, it may call ***stop\_sync()***

#### Configure CachingProcess

```
{
	"all_users" : <directory for all user meta data objects>
	"cache_dir" : <the backup directory for data checkpoints>,
	"cache_interval" : <time in milliseconds>,
	"user_directory" : <top level directory of use assets>,
	"directories" : <a map of blog types to directory paths>
}
```

