import { Router } from "express";
import { getSessions } from "../controllers/Session";


const router = Router()
router.get('/:projectId', getSessions)
// router.get("/verify/:token", verify);

export {router as sessionRoutes}