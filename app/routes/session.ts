import { Router } from "express";
import { getSessions, getSessionsPaginated, getSingleSession } from "../controllers/Session";


const router = Router()
router.get('/:projectId', getSessions)
router.get('/paginated/:projectId', getSessionsPaginated)
router.get('/single_session/:sessionId', getSingleSession)
// router.get("/verify/:token", verify);

export {router as sessionRoutes}