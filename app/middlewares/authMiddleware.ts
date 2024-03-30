import { RequestHandler } from "express";
import { CodedError, generateFailureResponse } from "../utils/utils";
import jwt, { JsonWebTokenError, JwtPayload, TokenExpiredError } from "jsonwebtoken"
import { JWT_SECRET_KEY } from "../constants/constants";
import { CustomRequest } from "../@types/type";
import { prisma } from "../utils/prismaClient";

export const authMiddleware: RequestHandler = async (req: CustomRequest, _res, next) => {
    try{
        const authHeader = req.headers.authorization
        if(!authHeader) generateFailureResponse("Authorization Header missing")
        
        const splitHeader = authHeader.split(' ')
        
        if(splitHeader.length !== 2){
            generateFailureResponse("Invalid Authorization Header")
        }
        
        if(splitHeader[0] !== 'Bearer'){
            generateFailureResponse("Auth Header is not Bearer")
        }

        const authToken = splitHeader[1]

        const payload = jwt.verify(authToken, JWT_SECRET_KEY) as JwtPayload
        const user = await prisma.user.findUnique({
            where: {
                user_id: payload.user_id
            },
            include: {
                org: true
            }
        })

        if(!user) generateFailureResponse("User not found!")
        if(!user.orgId) generateFailureResponse("User not in an org!");
        
        req.userId = user.user_id
        req.orgId = user.orgId
        req.isAdmin = user.isAdmin

        next()
    }catch(err){
        if(err instanceof JsonWebTokenError){
            next(new CodedError("Invalid auth token", 401))
        }
        if(err instanceof TokenExpiredError){
            next(new CodedError("Auth Token Expired!", 401))
        }
        next(err)
    }
}