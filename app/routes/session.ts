import { Router } from "express";
import { getSessions, getSingleSession } from "../controllers/Session";


const router = Router()
router.get('/:projectId', getSessions)
router.get('/single_session/:sessionId', getSingleSession)
// router.get("/verify/:token", verify);

export {router as sessionRoutes}