import { RequestHandler } from "express";
import { CustomRequest } from "../@types/type";
import { prisma } from "../utils/prismaClient";
import { exclude, generateFailureResponse, generateInvitationToken } from "../utils/utils";
import { sendInvitationEmail } from "../utils/setupOrg";
import { Prisma } from "@prisma/client";
import { sendMail } from "../utils/sendMail";

export const getUserDetails: RequestHandler = async (req: CustomRequest, res, next) => {
    try {
        const user = await prisma.user.findUniqueOrThrow({
            where: {
                user_id: req.userId
            },
            include: {
                org: {
                    include: {
                        users: true,
                    }
                }
            }
        })

        if(!user) generateFailureResponse("No such user found")
        
        const processUserData = exclude(user, ['password'])
        
        res.send({
            ...processUserData,
            org: {
                ...processUserData.org,
                users: processUserData.org.users.map(user => exclude(user, ['password']))
            }
        })  
    } catch (err) {
        next(err)
    }
}

export const inviteUser: RequestHandler = async (req: CustomRequest, res, next) => {
    try{

        const { email } = req.body;

        if(!email) generateFailureResponse("Email empty or missing in payload");

        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        })

        if(user) return generateFailureResponse("User Already Exist");

        const org = await prisma.org.findUnique({
            where: {
                id: req.orgId
            }
        })

        const token = generateInvitationToken(email, org.id);

        await sendInvitationEmail(email, org.name, token)

        res.send({
            message: "Invitation sent successfully!"
        })
    }catch(err){
        next(err)
    }
}

export const deleteUser: RequestHandler = async (req: CustomRequest, res, next) => {
    try{
        const { user_id } = req.params
        if(!user_id) generateFailureResponse("User ID is required");
        const userId = parseInt(user_id);

        if(isNaN(userId)) generateFailureResponse("User ID need to be number");

        if(!req.isAdmin) generateFailureResponse("Only admin is allowed to delete a user.")

        const user = await prisma.user.delete({
            where: {
                user_id: userId,
                orgId: req.orgId,
            },
            include: {
                org: true
            }
        })

        sendMail(user.email, 'You account has been deleted', `You have been removed from Org: ${user.org.name}`)
        
        res.send({
            message: "User deleted successfully"
        })
    }catch(err){

        next(err)
    }
}