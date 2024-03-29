import { PrismaClientInitializationError, PrismaClientKnownRequestError, PrismaClientRustPanicError, PrismaClientUnknownRequestError, PrismaClientValidationError } from "@prisma/client/runtime/library";
import { ErrorRequestHandler } from "express";
import { RequestHandler } from "express";

// excludes list of keys from object and return new object
export function exclude(obj: Object,keys: String[]) {
    return Object.fromEntries(
      Object.entries(obj).filter(([key]) => !keys.includes(key))
    )
}

class CodedError extends Error {
    code: number;

    constructor(message: string, code: number) {
        super(message);
        this.code = code;
        this.name = this.constructor.name;
        Object.setPrototypeOf(this, new.target.prototype);
    }
}

export const generateFailureResponse = (message: string, code:number = 500) => {
    throw new CodedError(message, code)
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
    if(
        err instanceof PrismaClientValidationError ||
        err instanceof PrismaClientKnownRequestError || 
        err instanceof PrismaClientInitializationError || 
        err instanceof PrismaClientRustPanicError || 
        err instanceof PrismaClientUnknownRequestError
    ){
        console.log(err)
        return res.status(500).send({message: "Something went wrong in DB while entering data!"})
    }

    console.log(err)
    const statusCode = typeof err?.code == 'string'? 500 : err.code
    return res.status(statusCode).send({message: err.message})
}
