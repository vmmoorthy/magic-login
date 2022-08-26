import { Router } from "express";
import { fstat, writeFileSync } from "fs";
import path from 'path'
import { fileURLToPath } from 'url'
import { getActiveUserList, getBlockedUserList, makeUserBlocked, makeUserlogout, makeUserUnblock } from "./action.js";

export const adminRoute = Router()

adminRoute.get('/templates', (req, res) => {
    res.sendFile(path.join(path.dirname(fileURLToPath(import.meta.url)) + "/template/default.html"));
})

adminRoute.get('/blockedList', async (req, res) => {
    try {
        res.json(await getBlockedUserList(req.query.limit, req.query.offset, req.query.search));
    } catch (error) {
        res.status(500).json({ message: "Something went wrong" });
    }
})
adminRoute.get('/activityList', async (req, res) => {
    try {
        res.json(await getActiveUserList(req.query.limit, req.query.offset, req.query.search));
    } catch (error) {
        res.status(500).json({ message: "Something went wrong" });
    }
})

adminRoute.post('/blockUsers', async (req, res) => {
    if (!req.body.emails || !Array.isArray(req.body.emails) || req.body.emails.length < 1) return res.status(404).json({ message: "List of emails not found" })
    try {
        if (await makeUserBlocked(req.body.emails))
            res.json({ status: true, message: "Users has blocked" })
        else
            res.status(512).json({ message: "Details not found" })
    } catch (error) {
        res.status(500).json({ status: false, message: "Something went wrong while unblock users" })
    }
})

adminRoute.post('/logout', async (req, res) => {
    if (!req.body.uuids || !Array.isArray(req.body.uuids) || req.body.uuids.length < 1) return res.status(404).json({ message: "List of uuids not found" })
    try {
        if (await makeUserlogout(req.body.uuids))
            res.json({ status: true, message: "Users has loged out" })
        else
            res.status(512).json({ message: "Details not found" })
    } catch (error) {
        res.status(500).json({ status: false, message: "Something went wrong while logout users" })
    }
})

adminRoute.post('/unblockUsers', async (req, res) => {
    if (!req.body.emails || !Array.isArray(req.body.emails) || req.body.emails.length < 1) return res.status(404).json({ message: "List of emails not found" })
    try {
        await makeUserUnblock(req.body.emails)
        res.json({ status: true, message: "Users has unblocked" })
    } catch (error) {
        res.status(500).json({ status: false, message: "Something went wrong while unblocking users" })
    }
})

adminRoute.post("/saveTemplate", (req, res) => {
    if (!req.body.text) return res.status(404).json({ message: "Text not provided" })
    try {
        writeFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)) + "/template/default.html"), req.body.text)
        return res.json({ message: "File has saved successfully" })
    } catch (error) {
        if (error) console.log(error);
        return res.status(500).json({ message: "Something went wrong" });
    }

})