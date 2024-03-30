export const FRONTEND_URL = process.env.FRONTEND_URL
export const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY

export enum TokenType {
    ORG_INVITE = "ORG_INVITE",
    SETUP_ORG = "SETUP_ORG",
    LOGIN = "LOGIN"
}