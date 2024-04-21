export const FRONTEND_URL = process.env.FRONTEND_URL
export const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY

export enum TokenType {
    ORG_INVITE = "ORG_INVITE",
    SETUP_ORG = "SETUP_ORG",
    LOGIN = "LOGIN",
    RESET_PASSWORD = "RESET_PASSWORD"
}

export const API_KEY_HEADER = "browse-back-key"
export const RECORD_ERROR_KEY_HEADER = "browse-back-record-error"
export const SESSION_KEY_HEADER = "session-id"

export enum ReplayTypes {
    error = "error",
    whole_session = "whole_session"
}

export const NETWORK_PLUGIN_NAME = 'rrweb/network@1';