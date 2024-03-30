import { RequestHandler } from "express";
import { CustomRequest } from "../@types/type";
import { prisma } from "../utils/prismaClient";
import { generateAPIKey, generateFailureResponse } from "../utils/utils";

export const getProjects: RequestHandler = async (req: CustomRequest, res, next) => {
    try{
        // const userOrg = await prisma.org.findFirst({
        //     where: {
        //         users: {
        //             some: {
        //                 user_id: {
        //                     equals: req.userId as number
        //                 }
        //             }
        //         }
        //     },
        //     include: {
        //         projects: {
        //             where: {
        //                 Org: 
        //             }
        //         }
        //     }
        // })
        const user = await prisma.user.findUnique({
            where: {user_id: req.userId},
            include: { org: { include: { projects: true } } }
        })

        if(!user) generateFailureResponse("User not found!")
        if(!user.org) generateFailureResponse("User is not in any org...")

        const userOrg = user.org
        console.log(userOrg)
        
        res.send({
            projects: userOrg.projects
        })
    }catch(err){
        next(err)
    }
}


export const createProject: RequestHandler = async (req: CustomRequest, res, next) => {
    try {
        const {projectName} = req.body
        
        if(!projectName) generateFailureResponse("Project name missing!")

        const project = await prisma.project.create({
            data: {
                name: projectName,
                apiKey: generateAPIKey(),
                Org: {
                    connect: {
                        id: req.orgId
                    }
                } 
            },
        })

        res.send({
            message: "Project created successfully!",
            project: project
        })
    } catch (err) {
        next(err)
    }
}