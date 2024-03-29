import { RequestHandler } from "express";

export const authMiddleware: RequestHandler = (req, res, next) => {
    try{
        console.log(req.headers)
    }catch(err){
        next(err)
    }
}