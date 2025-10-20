import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import router from "./routes/user.routes";
import { connectDB } from "./config/connect.db";
import errorHandler from "./utils/statusCode";


dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(errorHandler);

connectDB();

app.get("/", (req, res) => {
res.json({ message: "🚀 Welcome Mahmoud Sakhy! API is working successfully. 👨‍💻 Software Engineer at your service!" });
});

app.use("/auth", router);


const port = Number(process.env.PORT) || 5000;
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
});

export default app;
