# Magic Login

Let's Login using the email login link
Remove the burden of remembering the password
No need to trust the password manager

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
