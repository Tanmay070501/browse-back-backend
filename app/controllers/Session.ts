import { RequestHandler } from "express";
import { CustomRequest } from "../@types/type";
import { prisma } from "../utils/prismaClient";
import { generateFailureResponse } from "../utils/utils";
import { logger } from "../utils/logger";

export const getSessions: RequestHandler = async (req: CustomRequest, res, next) => {
    try{
        const { projectId } = req.params
        if(!projectId) generateFailureResponse("Project id missing")
        const project = await prisma.project.findUnique({
            where: {
                id: +projectId,
                AND: {
                    orgId: req.orgId
                }
            },
            include: {
                SessionReplays: true
            }
        })
        if(!project) return generateFailureResponse("Invalid Project id")

        res.send({
            sessions: project.SessionReplays ?? []
        })

    }catch(err){
        next(err)
    }
}

export const getSingleSession: RequestHandler = async (req: CustomRequest, res, next) => {
    try{
        const { sessionId } = req.params
        if(!sessionId) generateFailureResponse("session id missing")
        const session = await prisma.sessionReplay.findUnique({
            where: {
                sessionId: sessionId,
                Project: {
                    orgId: req.orgId
                }
            }
        })

        if(!session) {
            generateFailureResponse("Invalid session id")
        }

        res.send({
            ...session
        })

    }catch(err){
        next(err)
    }
}

export const getSessionsPaginated: RequestHandler = async (req: CustomRequest, res, next) => {
    try{
        const { projectId } = req.params
        let offset = parseInt(req.query?.offset as any);
        let count = parseInt(req.query?.count as any);
        if(isNaN(offset)){
            generateFailureResponse("offset invalid");
        }

        if(isNaN(count)){
            generateFailureResponse("count invalid");
        }

        const skip = offset * count;
        logger.info(`skip: ${skip}, count: ${count}`) 

        if(!projectId) generateFailureResponse("Project id missing")


        const totalCount = await prisma.sessionReplay.count({
            where:{
                Project:{
                    id: +projectId,
                    orgId: req.orgId
                },
            }
        })

        const sessions = await prisma.sessionReplay.findMany({
            where: {
                Project:{
                    id: +projectId,
                    orgId: req.orgId
                }
            },
            orderBy:{
                ended_at: 'desc'
            },
            take: count,
            skip: skip
        })

        res.send({
            sessions: sessions ?? [],
            totalPage: Math.ceil(totalCount / count),
            totalRows: totalCount
        })

    }catch(err){
        next(err)
    }
}