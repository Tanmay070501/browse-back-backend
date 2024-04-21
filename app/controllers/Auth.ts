import { RequestHandler } from "express"
import { prisma } from "../utils/prismaClient"
import { exclude, generateFailureResponse } from "../utils/utils"
import * as bcrypt from "bcrypt"
import { generateToken, sendResetPasswordEmail, sendVerificationEmail } from "../utils/setupOrg"
import { FRONTEND_URL, JWT_SECRET_KEY, TokenType } from "../constants/constants"
import jwt, { JwtPayload } from "jsonwebtoken"
import { logger } from "../utils/logger"

export const login: RequestHandler = async (req, res, next) => {
    try{
        const {email, password} = req.body

        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        })

        if(!user) generateFailureResponse(`No user with email ${email} found. First sign up`)
        
        const passwordMatch = await bcrypt.compare(password, user.password)

        if(!passwordMatch){
            generateFailureResponse("Invalid Password", 404)
        }

        if(!user.isAdmin && !user.orgId){
            logger.info("No Orgs")
            res.send({
                "type": TokenType.SETUP_ORG,
                token: generateToken(user, TokenType.SETUP_ORG)
            })
        }

        if(!user.emailVerified){
            generateFailureResponse("Email not verified");
        }
        
        res.send({
           type: TokenType.LOGIN,
           token: generateToken(user, TokenType.LOGIN)
        })

    }catch(err){
        next(err)
    }
}

export const signup: RequestHandler = async (req, res, next) => {
    try {

        const {email, password} = req.body
        if(!email) generateFailureResponse('Email field is required')
        if(!password) generateFailureResponse('Password field is required')

        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        })

        if(!user){
            const encryptedPassword = await bcrypt.hash(password, 13)

            const newUser = await prisma.user.create({
                data: {
                    email,
                    password: encryptedPassword,
                }
            })
            sendVerificationEmail(newUser, TokenType.SETUP_ORG)

            return res.send({
                message: "User successfully signed up! Check up your email for verification!"
            })
        }
        
        if(user.orgId){
            generateFailureResponse("User already signed up. Login!")
        }

        if(!user.orgId){
            sendVerificationEmail(user, TokenType.SETUP_ORG)
            generateFailureResponse("User already signed up. Check your email to get verified!")
        }
        
    } catch(err){
        next(err)
    }
}

export const setupOrg: RequestHandler = async (req, res, next) => {
    try{
        const {name, orgName, token} = req.body
        const missingKeys = []
        if(!name) missingKeys.push('name')
        if(!orgName) missingKeys.push('orgName')
        if(!token) missingKeys.push('token')
        if(missingKeys.length){
            generateFailureResponse(`Missing fields: ${missingKeys.join(', ')}`)
        }

        const payload = jwt.verify(token, JWT_SECRET_KEY)  
        const { user_id, tokenType } = payload as JwtPayload
        
        if(!user_id) generateFailureResponse("User id missing from verification token")
        
        if(!tokenType) generateFailureResponse("Token Type missing")
        
        if(tokenType !== TokenType.SETUP_ORG){
            generateFailureResponse("Invalid actions!")
        }

        const user = await prisma.user.findUnique({
            where:{
                user_id: parseInt(user_id)
            }
        })

        if(!user){
            generateFailureResponse("User missing")
        }

        if(user.orgId){
            generateFailureResponse("User already in an Org.")
        }
        
        const updateUser = await prisma.user.update({
            where:{
                user_id: user.user_id
            },
            data:{
                emailVerified: true,
                name,
                isAdmin: true
            }
        })
        const org = await prisma.org.create({
            data: {
                name: orgName,
                users: {
                    connect: {
                        user_id: updateUser.user_id
                    }
                }   
            },
        })
        
        res.send({
            type: TokenType.LOGIN,
            token: generateToken(user, TokenType.LOGIN)
        })
    }catch(err){
        next(err)
    }
}

export const joinOrg: RequestHandler = async (req, res, next) => {
    try{
        const { token , name, password} = req.body;
        if(!token) generateFailureResponse("Token missing")
        if(!name) generateFailureResponse("Name missing");
        if(!password) generateFailureResponse("Password either empty or missing");

        const payload = jwt.verify(token, JWT_SECRET_KEY)  
        const { orgId, email, tokenType } = payload as JwtPayload
        
        if(tokenType !== TokenType.ORG_INVITE) generateFailureResponse("Invalid Token Type", 403);

        const existingUser = await prisma.user.findUnique({
            where: {
                email: email
            }
        })

        if(existingUser) generateFailureResponse("User already exist");

        const encryptedPassword = await bcrypt.hash(password, 13)

        const user = await prisma.user.create({
            data: {
                email: email,
                emailVerified: true,
                name: name,
                password: encryptedPassword,
                org: {
                    connect: {
                        id: orgId
                    }
                },
            },
        })

        res.send({
            type: TokenType.LOGIN,
            token: generateToken(user, TokenType.LOGIN)
        })
        
    }catch(err){
        next(err)
    }
}

export const resetPassword: RequestHandler = async (req, res, next) => {
    try{
        const { email } = req.body;

        if(!email) generateFailureResponse("Email is required!");

        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        })

        if(!user) generateFailureResponse("User with this email does not exist")

        await sendResetPasswordEmail(user.email, generateToken(user, TokenType.RESET_PASSWORD, {
            expiresIn: '1d'
        }))

        res.send({message: "Mail sent successfully for reset password."})
    }catch(err){
        next(err)
    }
}

export const updatePassword: RequestHandler = async (req, res, next) => {
    try{
        const { token, password } = req.body
        
        if(!token) generateFailureResponse("Token required.");
        if(!password) generateFailureResponse("Password required")
        
        const payload = jwt.verify(token, JWT_SECRET_KEY)  
        const { user_id, tokenType } = payload as JwtPayload
        
        if(!tokenType) generateFailureResponse("Token Missing");
        if(tokenType !== TokenType.RESET_PASSWORD) generateFailureResponse("Invalid token type");
        
        if(!user_id) generateFailureResponse("User Id missing from token");
        
        const encryptedPassword = await bcrypt.hash(password, 13)

        await prisma.user.update({
            data: {
                password: encryptedPassword,
            },
            where: {
                user_id: user_id
            }
        })

        res.send({
            message: "Password Updated Successfully!"
        })

    }catch(err){
        next(err)
    }
}