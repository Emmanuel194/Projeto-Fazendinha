import { NextFunction, Request, Response } from "express";

export const validateUserCreationMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { name, email, password } = req.body;

  if (!name) {
    return res.status(400).json({ ok: false, message: "O nome é obrigatório" });
  }

  if (!email) {
    return res
      .status(400)
      .json({ ok: false, message: "O email é obrigatório" });
  }

  if (!password) {
    return res
      .status(400)
      .json({ ok: false, message: "A senha é Obrigatória" });
  }

  next();
};
