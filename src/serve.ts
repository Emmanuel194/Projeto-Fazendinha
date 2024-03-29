import express from "express";
import paginate from "express-paginate";
import { Request, Response } from "express";
import userRouter from "./modules/users/routers/user.router";

const app = express();
app.use(express.json());
app.use(paginate.middleware(2, 30));

app.use("/", userRouter);

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ message: "sucesso!" });
});

const port = 3000;
export const initServe = () => {
  app.listen(port, () => {
    console.log(`Servidor iniciando: http://localhost:${port}`);
  });
};
