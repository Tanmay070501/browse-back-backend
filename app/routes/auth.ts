import { Router } from "express";
import { login, setupOrg, signup } from "../controllers/Auth"


const router = Router()
router.post('/setup_org', setupOrg )
router.post("/signup",signup);
router.post("/login",login);
// router.get("/verify/:token", verify);

export {router as authRoutes}