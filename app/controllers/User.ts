import { RequestHandler } from "express";
import { CustomRequest } from "../@types/type";
import { prisma } from "../utils/prismaClient";
import { exclude, generateFailureResponse } from "../utils/utils";

export const getUserDetails: RequestHandler = async (req: CustomRequest, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                user_id: req.userId
            },
            include: {
                org: {
                    where:{
                        users: {
                            some: {
                               user_id: req.userId
                            }
                        }
                    }
                }
            }
        })

        if(!user) generateFailureResponse("No such user found")
        
        res.send(exclude(user, ['password']))  
    } catch (err) {
        next(err)
    }
}