import jwt from "jsonwebtoken";
import ejs from 'ejs';
import path from 'path';
import { fileURLToPath } from "url";


export const variables = { transporter: {},companyName:"", baseAddress: "", basePath: "", redirect: "", secretKey: "mailloginDefault", connection: {}, fromEmail: "" }

export const confirmationToken = (data, expiresIn = "10m") => jwt.sign(data, variables.secretKey, { expiresIn })

export const extractData = (token) => {
    try {
        return jwt.verify(token, variables.secretKey)
    } catch (error) {
        if (error.name === "TokenExpiredError")
            return { message: "TokenExpiredError" }
        return { message: "Token has broken" }
    }
}
export const isUserLogedIn = (uuid, email) => new Promise((res, rej) => {
    variables.connection.query(`SELECT * FROM _maillogin_logs where uuid='${uuid}' && email='${email}'  && status='in';`, (err, rows, fields) => {
        console.log(err, rows);
        if (err)
            return rej(err)
        return res(rows.length)
    })
})

export const makeUserLogout = (uuid, email) => new Promise((res, rej) => {
    variables.connection.query(`UPDATE _maillogin_logs set status='out',updateAt=now() where email='${email}' && uuid='${uuid}';`, (err, result) => {
        console.log(err, result);
        if (err)
            return rej(err)
        return res(result.affectedRows)
    })
})

export const makeUserBlocked = (emails) => new Promise((res, rej) => {
    variables.connection.query(`UPDATE _maillogin_logs set status='block',updateAt=now() where email in (${emails.reduce((pv, cv) => pv += `'${cv}',`, "").slice(0, -1)});`, (err, result) => {
        console.log(err, result);
        if (err)
            return rej(err)
        return res(result.affectedRows)
    })
})

export const makeUserlogout = (uuids) => new Promise((res, rej) => {
    variables.connection.query(`UPDATE _maillogin_logs set status='out',updateAt=now() where uuid in (${uuids.reduce((pv, cv) => pv += `'${cv}',`, "").slice(0, -1)});`, (err, result) => {
        console.log(err, result);
        if (err)
            return rej(err)
        return res(result.affectedRows)
    })
})


// get used status (blocked || unblocked) from database
export const getIsUserBlocked = (email) => new Promise((res, rej) => {
    variables.connection.query(`SELECT email,status FROM _maillogin_logs where email='${email}' && status='block';`, (err, rows, fields) => {
        console.log(err, rows);
        if (err)
            return rej(err)
        return res(rows.length)
    })
})

// get blocked user list
export const getBlockedUserList = (limit, page, search = "") => new Promise((res, rej) => {
    variables.connection.query(`select * from _maillogin_logs WHERE status='block' and email LIKE '%${search}%' and  updateAt in (SELECT max(updateAt) from _maillogin_logs GROUP by email) GROUP by email ORDER by updateAt desc ${limit ? `LIMIT ${limit} OFFSET ${limit * page}` : ""};`, (err, rows, fields) => {
        variables.connection.query(`select email from _maillogin_logs WHERE status='block' and email LIKE '%${search}%' and  updateAt in (SELECT max(updateAt) from _maillogin_logs GROUP by email) GROUP by email;`, (lenerr, lenrows) => {
            console.log(err, rows);
            if (err || lenerr)
                return rej(err)
            return res({ total: lenrows.length, list: rows })
        })
    })
})

export const getActiveUserList = (limit, offset, search = "") => new Promise((res, rej) => {
    variables.connection.query(`SELECT * FROM _maillogin_logs where status!='block' and email LIKE '%${search}%' order by updateAt desc ${limit ? `LIMIT ${limit} OFFSET ${limit * offset}` : ""};`, (err, rows, fields, some) => {
        variables.connection.query(`SELECT count(uuid) as total FROM _maillogin_logs where status!='block';`, (lenerr, lenrows) => {
            console.log(lenrows);
            console.log(err, rows, fields, some);
            if (err || lenerr)
                return rej(err)
            return res({ total: lenrows[0].total, list: rows })
        })
    })
})

export const makeUserUnblock = (emails) => new Promise((res, rej) => {
    variables.connection.query(`UPDATE _maillogin_logs set status='out',updateAt=now() where email in (${emails.reduce((pv, cv) => pv += `'${cv}',`, "").slice(0, -1)}) ;`, (err, rows, fields) => {
        console.log(err, rows);
        if (err)
            return rej(err)
        return res(rows)
    })
})



// confirm login
export const confirmLogin = (email, uuid) => new Promise((res, rej) => {
    variables.connection.query(`INSERT INTO _maillogin_logs(uuid,updateAt,status,email) VALUES('${uuid}', now(), 'in', '${email}');`, (err, result) => {
        console.log(err, result);
        if (err)
            return rej(err)
        return res(result.insertId)
    })
})


export async function sendMail({ email, subject = "MailLogin - Login link", url }) {
    const str = await ejs.renderFile(path.join(path.dirname(fileURLToPath(import.meta.url)) + '/template/default.html'), { url,companyName:variables.companyName })
    return await variables.transporter.sendMail({
        from: variables.fromEmail,
        to: email,
        subject,
        html: str
    })
}