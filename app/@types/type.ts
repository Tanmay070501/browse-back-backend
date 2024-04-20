import { Request } from "express";
import { EventWithTime } from "./event";

export interface CustomRequest extends Request {
    userId: number,
    orgId: number,
    isAdmin: boolean
}

export interface SingleBufferEvent {
    sessionId?: string,
    metadata?: any,
    events?: EventWithTime[]
}
export interface SessionBuffer {
    [key: string] : SingleBufferEvent
}