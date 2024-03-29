import { User } from "@prisma/client"
import * as jwt from "jsonwebtoken"
import { exclude } from "./utils"
import { sendMail } from "./sendMail"
import { JWT_SECRET_KEY, TokenType } from "../constants/constants"

export const generateToken = (user: User, tokenType: TokenType) => {
    const token = jwt.sign({
        ...exclude(user, ['password']),
        tokenType, 
    }, JWT_SECRET_KEY)

    return token
}

export const sendVerificationEmail = async (user: User, tokenType: TokenType) => {
    const token = generateToken(user, tokenType)
    const setupURL = `${process.env.BACKEND_URL}/auth/verify/${token}`
    await sendMail(user.email, 'Verify your email and set up your org.', setupURL)
}