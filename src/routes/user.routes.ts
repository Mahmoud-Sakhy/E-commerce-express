import express from "express";
import { getAllUsers, login, logout, register } from "../controllers/user.controller";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/users", getAllUsers); 

export default  router;