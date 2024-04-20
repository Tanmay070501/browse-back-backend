import { RequestHandler } from "express";
import { CustomRequest } from "../@types/type";
import { prisma } from "../utils/prismaClient";
import { generateFailureResponse } from "../utils/utils";

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
        console.log(session)

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