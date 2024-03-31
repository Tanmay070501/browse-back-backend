import { RequestHandler } from "express";
import { CustomRequest } from "../@types/type";
import { generateFailureResponse } from "../utils/utils";
import { prisma } from "../utils/prismaClient";
import { API_KEY_HEADER } from "../constants/constants";

export const authMiddleware: RequestHandler = async (req: CustomRequest, _res, next) => {
    try {
        const apiKey = req.headers[API_KEY_HEADER]
        if(!apiKey) return generateFailureResponse("Api Key Header Missing")
        const project = await prisma.project.findUnique({
            where: {
                apiKey: apiKey as string
            }
        })
        if(!project) return generateFailureResponse("Invalid API Key")

        next()
    } catch(err){
        next(err)
    }
}