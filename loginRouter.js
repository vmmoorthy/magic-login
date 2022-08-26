import { Router } from "express";
import { confirmationToken, isUserLogedIn, confirmLogin, extractData, getIsUserBlocked, makeUserLogout, sendMail, variables } from "./action.js";


export const loginRoute = Router()

loginRoute.get('/', (req, res) => {
    console.log(req.body)
    res.json({ stauts: "yes" })
})

export const authConfirmation = async (req, res, next) => {
    if (!req.cookies.accessToken || !req.cookies.refresh) return res.status(401).json({ message: "Authorization token not provided" })
    try {
        const { message, type } = extractData(req.cookies.accessToken) //extraceting accessToken
        console.log(type, message);
        if (type !== "accessToken" && !message)
            return res.status(401).json({ message: "Invalid Token provided" })
        else if (message === "TokenExpiredError") {
            const { email, uuid, message, type } = extractData(req.cookies.refresh)
            if (message) {
                res.cookie("accessToken", "", { maxAge: 1 })
                res.cookie("refresh", "", { maxAge: 1, httpOnly: true })
                return res.status(401).json({ message: "Token expired. Please login again" })
            }
            if (await isUserLogedIn(uuid, email)) {
                //genarate new accessToken
                res.cookie("accessToken", confirmationToken({ email, uuid, type: "accessToken" }, "10m"))
            }
            else {
                res.cookie("accessToken", "", { maxAge: 1 })
                res.cookie("refresh", "", { maxAge: 1, httpOnly: true })
                return res.status(401).json({ message: "User not loggedin" })
            }
        }
        else if (message)
            return res.status(401).json({ message: "Not authorized" })
        next()
    } catch (error) {
        return res.status(500).json({ message: "Interal server error" })
    }
}

// to get mail sent conformation token
loginRoute.post('/', async (req, res) => {
    const { email, uuid } = req.body;

    if (!email || !email.match(/[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/i) || !uuid)
        return res.status(400).json({ message: "email|uuid is not provided" })

    try {
        const isBlocked = await getIsUserBlocked(email);
        if (isBlocked)//if blocked
            return res.status(403).json({
                status: "userBlocked",
                message: "User is blocked Please contact admin for more information"
            })
        const token = confirmationToken({ email, uuid, type: "clientToken" }, "20m")
        console.log(await sendMail({ email, url: `${variables.baseAddress}/${variables.basePath}/validate/?${variables.redirect ? `redirect=${variables.redirect}&` : ""}token=${confirmationToken({ email, uuid, type: "loginLink" }, "20m")}`.replace(/([^:]\/)\/+/g, "$1") }))
        res.cookie("clientToken", token, { httpOnly: true, maxAge: 20 * 60 * 1000 })
        res.json({ message: `Mail has sent to ${email}` })
    } catch (error) {
        console.log(error);
        res.status(500).json({ "message": "Something went wrong" })
    }
})

loginRoute.get('/logout', async (req, res) => {
    res.cookie("refresh", "", { httpOnly: true, maxAge: 1 })
    res.cookie("clientToken", "", { httpOnly: true, maxAge: 1 })
    res.cookie("accessToken", "", { maxAge: 1 })
    if (!req.cookies.refresh) return res.json({ message: "Token is not provided" })
    try {
        const { email, uuid, message, type } = extractData(req.cookies.refresh)
        if (message || type !== "refresh")
            return res.status(401).json({ message: "Token has invalid" })
        await makeUserLogout(uuid, email)
        return res.json({ message: "User loged out successfully" })
    } catch (error) {
        console.log(error);
        res.status(500).json({ "message": "something went wrong" })
    }
})

loginRoute.get('/validate', async (req, res) => {
    if (!req.query.token) return res.status(400).json({ message: "Bad request" })
    try {
        const { email, uuid, message, type } = extractData(req.query.token);
        if (message)
            return res.status(401).json({ message })
        if (type !== "loginLink")
            return res.status(400).json({ message: "Invalid token" })
        await confirmLogin(email, uuid)
        if (req.query.redirect)
            return res.redirect(req.query.redirect)
        return res.json({ "message": "see login screen" })
    } catch (err) {
        if (err.code === "ER_DUP_ENTRY" && req.query.redirect)
            return res.redirect(req.query.redirect)
        console.log(err)
        return res.status(500).json({ "message": "something went wrong" })
    }
})

// status of login using uuid
loginRoute.get('/statusPing', async (req, res) => {
    console.log(req.cookies);
    if (!req.cookies.clientToken) return res.status(400).json({ message: "Bad request" })
    try {
        const { email, uuid, message } = extractData(req.cookies.clientToken);
        if (message)
            return res.status(401).json({ message })
        if (await isUserLogedIn(uuid, email)) {
            res.cookie("refresh", confirmationToken({ email, uuid, type: "refresh" }, "1d"), { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 })
            res.cookie("accessToken", confirmationToken({ email, uuid, type: "accessToken" }, "10m"))
            return res.json({ status: true, message: "logedin" })
        }
        return res.json({ status: false, message: "not logedin" })
    } catch (error) {
        // we have to set 401 when times up and users declines by unsubscribe / ignore
        console.log(error);
        res.status(500).json({ "message": "Something went wrong" })
    }
})

loginRoute.get('/status', authConfirmation, (req, res) => res.json({ status: true, message: "Loged in" }))