import { User } from "@prisma/client"
import * as jwt from "jsonwebtoken"
import { exclude } from "./utils"
import { sendMail } from "./sendMail"
import { JWT_SECRET_KEY, TokenType } from "../constants/constants"

export const generateToken = (user: User , tokenType: TokenType, options: jwt.SignOptions = {}) => {
    const token = jwt.sign({
        ...exclude(user, ['password']),
        tokenType, 
    }, JWT_SECRET_KEY,
    options)

    return token
}

export const sendVerificationEmail = async (user: User, tokenType: TokenType) => {
    const token = generateToken(user, tokenType)
    const setupURL = `${process.env.FRONTEND_URL}/setup_org?token=${token}`
    await sendMail(user.email, 'Verify your email and set up your org.', setupURL)
}

export const sendInvitationEmail = async (email: string, orgName: string,  token: string) => {
    const inviteURL = `${process.env.FRONTEND_URL}/join_org?token=${token}&org_name=${orgName}`
    await sendMail(email, `Invitation from an Organization ${orgName}`, inviteURL)
}

export const sendResetPasswordEmail = async (email: string, token: string) => {
    const resetPasswordURL = `${process.env.FRONTEND_URL}/reset_password?token=${token}`
    await sendMail(email, `Reset Password`, resetPasswordURL)
}