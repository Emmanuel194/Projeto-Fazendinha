import express from "express";
const router = express.Router();

import {
  createUser,
  login,
  getAllUsers,
  search,
  updateUser,
  deleteUser,
  authenticate,
  checkEmailExists,
  resetPassword,
  sendPasswordResetEmail,
} from "../controllers/user.controller";

router.post("/sendPasswordResetEmail", sendPasswordResetEmail);
router.post("/resetPassword", resetPassword);
router.post("/checkEmailExists", checkEmailExists);
router.post("/users", createUser);
router.post("/session", login);
router.get("/users", getAllUsers);
router.get("/search", search);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.post("/authenticate", authenticate);

export default router;
