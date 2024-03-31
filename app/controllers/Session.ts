import { RequestHandler } from "express";
import { CustomRequest } from "../@types/type";
import { prisma } from "../utils/prismaClient";
import { generateFailureResponse } from "../utils/utils";

export const getSessions: RequestHandler = async (req: CustomRequest, res, next) => {
    try{
        const {projectId} = req.params
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