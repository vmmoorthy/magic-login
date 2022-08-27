import { Connection } from "mysql";
import { Router } from 'express-serve-static-core';
import SMTPTransport from "nodemailer/lib/smtp-transport";
import SMTPPool from "nodemailer/lib/smtp-pool";
import SendmailTransport from "nodemailer/lib/sendmail-transport";
import StreamTransport from "nodemailer/lib/stream-transport";
import JSONTransport from "nodemailer/lib/json-transport";
import SESTransport from "nodemailer/lib/ses-transport";
import { NextFunction, Request, Response, Router } from "express";
import QueryString from "qs";

interface configOptions {
    /**
     * it used to encrypt data in JSON WEB TOKEN
     * Default : mailloginDefault
     */
    secretKey?: string;
    /**
     * It will shown in Email template
     * Default : Login Application
     */
    companyName?: string;
    /**Email that used to send login mail
     * Format : [Name of the User]<[Email address]>
     * Default : Login Application < login@example.com >
     */
    fromEmail?: string;
    /**Domain name or IP address where Backend server host
     * Used to send correct email verification link (Refer documentation [See Doc](https://github.com/vmmoorthy/magic-login#config)) */
    basePath: string;
    /**
     * Attached router path Ex: "/login" or "/api/login"
     */
    baseAddress?: string;
    /**URL on successful verification
     * This is optional
     * if not exist a success message will displayed
     */
    redirect?: string;
    /**Mysql connection where _maillogin table exists */
    mysqlConnection: Connection;
    /**Nodemailer Transport option to connection email client */
    transPortOptions: {
        transport: SMTPTransport | SMTPTransport.Options | SMTPPool | SMTPPool.Options | SendmailTransport | SendmailTransport.Options | StreamTransport | StreamTransport.Options | JSONTransport | JSONTransport.Options | SESTransport | SESTransport.Options,
        defaults?: SMTPTransport.Options | SMTPPool.Options | SendmailTransport.Options | StreamTransport.Options | JSONTransport.Options | SESTransport.Options
    };
}
/**
 * Setup configuration for Magic-Login
 * @param configOptions
 */
export declare function config({ }: configOptions): void;
/**
 * (Optional) Put this in admin router handler
 * It will provide the routers like listActivity,listBlocked
 */
export declare const adminRoute:readonly Router = {};

/**
 * Put this in login route like "/login" | "/api/login"
 * 
 * it provides the api for login,loginStatus,logout...
 */

export declare const loginRoute:readonly Router = {};



/**
 * Middleware to check the authentication
 *
 * It returns 401 http response when
 *  
 * 1. when request object doesn't contain accessToken and Refresh token in cookies object(it can parsed by cookie-parser middle-ware) 
 * 2. when invalid or expired token provided
 * 3. when user loggedout or force logged out by admin 
 * 
 * 
 * @param req Express Request Object
 * @param res Express Response Object
 * @param next Express "next" function 
 * 
 * [see Docs](https://github.com/vmmoorthy/magic-login#authConfirmation---middleware)
 * */
export declare function authConfirmation(req: Request<{}, any, any, QueryString.ParsedQs, Record<string, any>>, res: Response<any, Record<string, any>, number>, next: NextFunction): void | undefined
