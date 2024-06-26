import { ReplayTypes } from "../constants/constants"
import { v4 as uuidv4} from "uuid"
import { alignDomAndNetworkEvents } from "./eventUtils"
import { prisma } from "./prismaClient"
import { EventWithTime } from "../@types/event"
import { SessionBuffer, SingleBufferEvent } from "../@types/type"
import { createDummyEndEvent } from "./utils"
import { logger } from "./logger"

export const saveErrorSnapshot = async (data: string, apiKey: string, ) => {
    try{
        let {events, metadata} = JSON.parse(data)
        if(!events?.length) return
        events = alignDomAndNetworkEvents(events)
        const startTime = events[0]?.timestamp
        const endTime = events[events.length - 1]?.timestamp
        logger.info(`startTime: ${startTime}, endTime: ${endTime}`)
        if(!startTime || !endTime) return
        logger.info(`storing data for apiKey: ${apiKey}`);
        await prisma.sessionReplay.create({
            data: {
                sessionId: uuidv4() as string,
                started_at: new Date(events[0]?.timestamp),
                ended_at: new Date(events[events.length - 1]?.timestamp),
                events: events,
                type: ReplayTypes.error,
                metadata: metadata,
                Project: {
                    connect: {
                        apiKey: apiKey as string
                    }
                }
            }
        })
    }catch(err){
        logger.error(err)
    }
}

export const saveSession = async (data: SingleBufferEvent, apiKey: string, ) => {
    try{
        let {events, metadata, sessionId} = data;

        if(!sessionId){
            logger.info("Can't save, session Id missing");
            return;
        }
        if(!events?.length) return
        
        events = alignDomAndNetworkEvents(events)
        const startTime = events[0]?.timestamp
        logger.info(`startTime: ${startTime}`);
        
        if(!startTime) return
        
        const endTime = new Date().getTime();
        const dummyEndEvent =  createDummyEndEvent(startTime, endTime)
        events.push(dummyEndEvent as EventWithTime);
        
        await prisma.sessionReplay.create({
            data: {
                sessionId:sessionId,
                started_at: new Date(startTime),
                ended_at: new Date(endTime),
                events: events as any,
                type: ReplayTypes.whole_session,
                metadata: metadata,
                Project: {
                    connect: {
                        apiKey: apiKey as string
                    }
                }
            }
        })
        logger.info(`Successfully saved ${sessionId}`);
    }catch(err){
        logger.error(err);
    }
}

export const retrieveSessionEvent = (data: string) => {
    try{
        let {events, metadata, sessionId}: SingleBufferEvent = JSON.parse(data)
        if(!events?.length) return
        if(!sessionId) return null;
        return {events, sessionId: sessionId, metadata: metadata}
    }catch(err){
        logger.error(err);
        return null
    }
}