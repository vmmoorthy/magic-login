import mailer from 'nodemailer';
import { variables } from "./action.js";
export { loginRoute } from "./loginRouter.js";
export { authConfirmation } from "./loginRouter.js";
export { adminRoute } from './adminRouter.js';


export const config = ({ secretKey = "mailloginDefault",companyName="Login Application", fromEmail="Login Application <login@example.com>", basePath, baseAddress="", redirect = "", mysqlConnection, transPortOptions }) => {
    if (!transPortOptions)
        throw new Error("Transport config is not provided")
    variables.transporter = mailer.createTransport(transPortOptions);
    variables.fromEmail = fromEmail;
    variables.secretKey = secretKey;
    variables.connection = mysqlConnection;
    variables.baseAddress = baseAddress;
    variables.redirect = redirect;
    variables.basePath = basePath;
    variables.companyName = companyName;
};

