import express from "express";
import "express-async-errors";
import { json } from "body-parser";
import { errorHandler, NotFoundError } from "@ebazdev/core";
import cookieSession from "cookie-session";
import { getRouter } from "./routes/get";
import { listRouter } from "./routes/list";
import * as dotenv from "dotenv";
dotenv.config();

const apiPrefix = "/api/v1/inventory";

const app = express();
app.set("trust proxy", true);
app.use(json());
app.use(
  cookieSession({
    signed: false,
    secure: process.env.NODE_ENV !== "test",
    keys: [process.env.JWT_KEY!],
  })
);

app.use(apiPrefix, getRouter);
app.use(apiPrefix, listRouter);

app.all("*", async () => {
  throw new NotFoundError();
});

app.use(errorHandler);

export { app };
