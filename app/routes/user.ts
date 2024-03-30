import { Router } from "express";
import { getUserDetails } from "../controllers/User";


const router = Router()
router.get('/', getUserDetails )
// router.get("/verify/:token", verify);

export {router as userRoutes}