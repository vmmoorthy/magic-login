# Magic Login

Let's Login using the email login link<br/>
Remove the burden of remembering the password<br/>
No need to trust the password manager<br/>

# Things to understand
1. we are using nodemailer to send login link 
2. we use express as backend library

# Usage

## Mysql table creation

Before running the backend server you must create this table and provide the mysql connection to the package

	CREATE  TABLE  `_maillogin_logs` (
	`uuid`  varchar(36) NOT  NULL  PRIMARY  KEY,
	`updateAt`  datetime  NOT  NULL  DEFAULT  current_timestamp(),
	`createdAt`  datetime  NOT  NULL  DEFAULT  current_timestamp(),
	`status` enum('in','out','block') NOT  NULL  DEFAULT  'in',
	`email`  varchar(320) NOT  NULL);

## Example code 

    import  express  from  'express'
    import  mysql  from  'mysql'
    import  cors  from  'cors'
    import  cookieParser  from  'cookie-parser'
    import  'dotenv/config'  // to initiate environmental variables
    import { config, authConfirmation, loginRoute, adminRoute } from  'maillogin'

    const  app = express() //initialize express app
    app.use(express.json())//to convert all the params,body into json
    app.use(cors({ origin:  "http://localhost:3000", credentials:  true }))//setup cors to allow origin
    app.use(cookieParser()) //parsesCookie
    
    // initialize mysql connection
    const  mailloginMysqlConnection = mysql.createConnection({
    host:  process.env.DBHOST,
    user:  'process.env.DBUSER,
    password:  process.env.DBPASSWORD,
    database:  process.env.DB
    })
    mailloginMysqlConnection.connect()
    
below you must configure the trasporter as  [nodemailer_trasporter](https://nodemailer.com/smtp/)

    // config magic login
    config({
	    fromEmail:  "Application Login <login@example.com>",
	    transPortOptions: {    
		    host:  process.env._maillogin_host,
		    port:  process.env._maillogin_port || 587,
		    secure:  false,    
		    auth: {    
			    user:  process.env._maillogin_user,
			    pass:  process.env._maillogin_pass
		    },
	    },
	    mysqlConnection:  mailloginMysqlConnection,
	    baseAddress:  "http://localhost:8000", //address backend server will host
	    basePath:  "login", // this path must matchs with the login router path
	    redirect:  "http://localhost:3000" //redirect url on successfull login
    })
    
    //serve secure authenticated application data by using the authConfirmation middleware
    app.use('/data', authConfirmation, (req, res) => {
    res.send("Great! You are logged in.")
    })
    
    //attach login router to the login route (path that provided to the config function)
    app.use('/login', loginRoute)
    
    //optional, it serves the data to admin router 
    app.use('/login/admin', (req, res, next) =>  console.log("admin head",next()), adminRoute)
    
    app.listen(process.env.PORT, err  => { // local dev env to runner
	    if (err)
		    return  console.log(err);
	    console.log(`Server running on port ${process.env.PORT} ...`);
    })

# Acceptable values
## config

|Key|Default value|Description|
|--|--|--|
|secretKey|mailloginDefault|it used to excrypt data and give token|
|fromEmail|Login application <login@example.com>|From email address|
|basePath|-|Path that login router will append|
|baseAddress|-|Domain name or IP address of the backend server
|redirect|-|Domain name or IP address of front end 
|mysqlConnection|-|Before providing this connection you must create a table as directed in the usage section.<br/>Mysql connection where the _maillogin table exists
|transPortOptions|-|nodemailer's create transport option
|companyName|Login Application|Name that will appear in the mail

# Tokens
Tokens are stored in cookie and the browser automatically sends the token to the server 
|Token name|Validity|Description|
|--|--|--|
|clientToken|20 minutes|Used to get the status of client login by calling /statusPing endpoint|
|accessToken|10 minutes|Used to authenticate client in a faster way(without DB validation)|
|refresh|1 day|Used to regenerate accessToken after expiration|

# API

`basepath = < baseAddress >/< basePath >`
eg: `localhost:8000/login`

note: `baseAddress` and `basePath` must be same as that you provided in [config](https://github.com/vmmoorthy/magic-login#config) 

## LoginRoute API

|http Method - path|REQUEST Format|Success Response Format|Description
|--|--|--|--|
|[POST] / |body {<br/>email : user@example.com,<br/>uuid : xxx-xxxx-xxx...}|{ message:  Mail has sent to user@example.com }|clientToken cookie send it expires in 20 minutes. At the same time login link sent to the email|
[GET] /statusPing |-|UserStatus-<br/>&nbsp;&nbsp; Loggedin:<br/>{status:true,,message:"loggedin"}.<br/>&nbsp;&nbsp; Waiting:{status:false,,message:"not loggedin"}.|clientToken automatically sent by the server.With that token validation has conducted.Use this endpoint to get status for every 5 \| 10 seconds.<br/>If client token expired it return 401 http status and error message| 
|[GET] /status|-|onSuccess : { status:  true, message:  "Loged in" }<br/>otherwise 401 http statusCode sent|validation done by authConfirmation method|
|[GET] /logout | - |{ message:  "User loged out successfully" }|it removes all the cookies in browser.|

## AdminRoute API

Note : authentication doesn't exist default for adminRoute. You have to provide it explicitly

|http Method - path|REQUEST Format|Success Response Format|Description
|--|--|--|--|
|[GET] /blockedList |query {<br/>limit(optional) : < no of users >,<br/>offset : < no of users to skip ><br/>search:< search string >}|{ { total:  < total no of rows >, list:  [{uuid,updateAt,createAt,status,email},...] } }|list of blocked user with search and pagination options|
[GET] /activityList |query {<br/>limit(optional) : < no of users >,<br/>offset : < no of users to skip ><br/>search:< search string >}|{ { total:  < total no of rows >, list:  [{uuid,updateAt,createAt,status,email},...] } }| list of activity with search and pagination options | 
|[POST] /blockUsers|body {<br/>emails:[]}|{ status:  true, message:  "Users has blocked" }|TO block users|
|[POST] /unblockUsers|body {<br/>emails:[]}|{ status:  true, message:  "Users has unblocked" }|TO unblock users|
|[GET] /logout | body { uuids:[] } |{ status:  true, message:  "Users has loged out" }|Force logout users|
|[GET] /templates|-|mail tamplate file|`companyName` and `url` are the two ejs parameters that exists in the html file|
|[POST] /saveTemplate |body { text: < html text > }|{ message:  "File has saved successfully" }|It changes the email template string that you can change.<br/> `companyName` and `url` provided as [ejs](https://ejs.co/) render parameter. |

# Login flow

```mermaid
sequenceDiagram
User ->> [POST] / : email , uuid 
[POST] / ->>User: clientToken (cookie)<br/> Fetch on /statusPing<br/> (every 10seconds)
EmailLink ->> /validate: request with authToken<br/>authToken embedded<br/> on login link
/validate ->> User : redirected authentication done to User page
User ->> /statusPing: clientToken
/statusPing ->> User: accessToken,refresh(cookie)<br/> Authentication has done user logged in
```

# authConfirmation - middleware

#### you have to use this function as middle which route you need to protect 
`app.use('/data,authConfirmation,dataRoute)`

here data route means the Router to get data