import { Router } from "express";
import { deleteUser, getUserDetails, inviteUser } from "../controllers/User";


const router = Router()
router.get('/', getUserDetails )
router.delete("/:user_id", deleteUser)
router.post('/invite', inviteUser)
// router.get("/verify/:token", verify);

export {router as userRoutes}