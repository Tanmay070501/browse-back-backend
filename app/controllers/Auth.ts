import { RequestHandler } from "express"
import { prisma } from "../utils/prismaClient"
import { exclude, generateFailureResponse } from "../utils/utils"
import * as bcrypt from "bcrypt"
import { generateToken, sendVerificationEmail } from "../utils/setupOrg"
import { FRONTEND_URL, JWT_SECRET_KEY, TokenType } from "../constants/constants"
import jwt, { JwtPayload } from "jsonwebtoken"

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
            console.log("No Orgs")
            res.send({
                "type": TokenType.SETUP_ORG,
                token: generateToken(user, TokenType.SETUP_ORG)
            })
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

// export const verify: RequestHandler = (req, res, next) => {
//     try{
//         const {token} = req.params
//         try {
//             const payload = jwt.verify(token, JWT_SECRET_KEY)  
//             console.log(payload)
//         }catch(err){
//             if(err instanceof JsonWebTokenError){
//                 generateFailureResponse(err.message)
//             }
//         }
//         if(FRONTEND_URL){
//             res.redirect(`${FRONTEND_URL}/login?message=success`)
//         }else{
//             generateFailureResponse('Something went wrong!')
//         }
//     }catch(err){
//         next(err)
//     }
// }

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
        
        console.log(org)
        res.send({
            type: TokenType.LOGIN,
            token: generateToken(user, TokenType.LOGIN)
        })
    }catch(err){
        next(err)
    }
}