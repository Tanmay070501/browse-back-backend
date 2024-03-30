import { Router } from "express";
import { createProject, getProjects } from "../controllers/Project";


const router = Router()
router.get('/', getProjects )
router.post('/',  createProject)
// router.get("/verify/:token", verify);

export {router as projectRoutes}