import { Request, Response } from "express";
import * as bcrypt from "bcrypt";
import User from "../entities/user.entity";
import { AppDataSource } from "../../../../banco";
import { DeepPartial } from "typeorm";
import jwt from "jsonwebtoken";
import console from "console";
import * as nodemailer from "nodemailer";

const userRepository = AppDataSource.getRepository(User);

export const createUser = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Todos os campos são obrigatórios." });
  }

  const useremailExist = await AppDataSource.getRepository(User).findOneBy({
    email,
  });

  if (useremailExist) {
    return res.status(400).json({ message: "Este e-mail já está em uso." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = userRepository.create({
    name,
    email,
    password: passwordHash,
  } as DeepPartial<User>);

  try {
    await userRepository.save(user);
    return res
      .status(200)
      .json({ ok: true, message: "User Created Successfully" });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ ok: false, error: "Error trying to create user. " });
  }
};
// * Login

export const login = async (request: Request, response: Response) => {
  const { email, password } = request.body;

  try {
    const user = await AppDataSource.getRepository(User).find({
      where: {
        email,
      },
      select: ["email"],
    });

    if (await bcrypt.compare(password, user[0].password)) {
      const data = {
        id: user[0].id,
        name: user[0].name,
        email: user[0].email,
      };
      return response.json({ data });
    } else {
      return response.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    return response.status(422).json({ message: "Error in entities!" });
  }
};

// *  Recuperação de senha

// Função para verificar se o email existe
export const checkEmailExists = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res
      .status(409)
      .json({ type: "not-found", message: "O e-mail é obrigátorio" });
  }
  try {
    const existingUser = await AppDataSource.getRepository(User).find({
      where: {
        email,
      },
    });
    if (existingUser.length > 0) {
      const userEmail = existingUser[0].email;
      sendPasswordResetEmail(userEmail);
      return res.status(200).json({ message: "Email Envied" });
    } else {
      return res.status(404).json({ message: "Email not found" });
    }
  } catch (error) {
    console.error("Error checking email:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

//  Função para enviar email de confirmação
export const sendPasswordResetEmail = async (email: string) => {
  try {
    const secretKey = "KHBDASHD912731237N9S7";
    const token = jwt.sign({ email }, secretKey, { expiresIn: "1h" });

    // Configurações do Nodemailer)
    const transporter = nodemailer.createTransport({
      service: "hotmail",
      auth: {
        user: "suporte.bellitate@hotmail.com",
        pass: "bellitate123",
      },
    });

    const mailOptions = {
      from: "suporte.bellitate@hotmail.com",
      to: email,
      subject: "Redefinição de Senha",
      text: "Clique no link para redefinir sua senha",
      html: `<p>Clique no link para redefinir sua senha!</p>${token}`,
    };

    await transporter.sendMail(mailOptions);

    console.log("Email enviado com sucesso!");
  } catch (error) {
    console.error("Erro ao enviar email de redefinição:", error);
  }
};

// Função para verificar jwt + email 'POST'.

const verifyResetToken = (token: string, email: string): boolean => {
  try {
    const secretKey = "KHBDASHD912731237N9S7";
    const decodedToken = jwt.verify(token, secretKey) as { email: string };

    return decodedToken.email === email;
  } catch (error) {
    console.error("Erro ao verificar token:", error);
    return false;
  }
};

// Rota para redefinir a senha
export const resetPassword = async (req: Request, res: Response) => {
  const { email, token, password } = req.body;

  if (!verifyResetToken(token, email)) {
    return res.status(400).json({ message: "Token inválido ou expirado" });
  }
  // buscar o user com email fornecido

  const user = await AppDataSource.getRepository(User).findOne({
    where: { email },
  });
  if (!user) {
    return res.status(404).json({ message: "Usuário não encontrado" });
  }

  // LOGICA UPDATEUSER PASSWORD BANCO DE DADOS.

  const newPassword = await bcrypt.hash(password, 10);
  user.password = newPassword;
  await AppDataSource.getRepository(User).save(user);

  return res.status(200).json({ message: "Senha atualizada com sucesso" });
};

// // * get all users
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { page, limit } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);
    const users = await userRepository.findAndCount({
      skip,
      take,
    });

    res.status(200).json(users);
  } catch (error) {
    console.log("Erro ao buscar usuários:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }

  try {
    const users = await userRepository.find();
    return res.status(200).json({ ok: true, users });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ ok: false, error: "Error trying to list users. " });
  }
};

// * search user
export const search = async (req: Request, res: Response) => {
  const { name, email } = req.body;

  try {
    const query = userRepository.createQueryBuilder("users");
    if (name) query.andWhere("users.name = :name", { name });
    if (email) query.andWhere("users.email  = :email", { email });
    const user = await query.getOne();
    return res.status(200).json({ ok: true, user });
  } catch (err) {
    console.error(err);
    return res.status(404).json({ ok: false, error: "User not found." });
  }
};

// * update user
export const updateUser = async (req: Request, res: Response) => {
  const { name, password, email } = req.body;

  try {
    const user = await userRepository.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ ok: false, error: "User not found." });
    }

    if (name) user.name = name;
    if (password) user.password = await bcrypt.hash(password, 10);
    if (email) user.email = email;

    await userRepository.save(user);
    return res
      .status(200)
      .json({ ok: true, message: "User Updated Successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "Error updating user" });
  }
};
// * delete user
export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const user = await userRepository.findOne({ where: { id: +id } });
    if (!user)
      return res.status(404).json({
        ok: false,
        type: "not-found",
        error: "Usuário não encontrado",
      });

    await userRepository.softRemove(user);
    return res
      .status(200)
      .json({ ok: true, message: "User  successfully deleted." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "Error deleting user." });
  }
};

export const authenticate = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await AppDataSource.getRepository(User).findOne({
      where: { email: email },
      select: ["id", "name", "email", "password"],
    });

    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ ok: false, error: "Invalid password" });
    }

    // Gera token JWT
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, {
      expiresIn: "1d",
    });

    return res.status(200).json({ ok: true, token });
  } catch (error) {
    console.log(error, "Error in authenticating");
    res.status(500).send({ ok: false, error: "Error authenticating user" });
  }
};
