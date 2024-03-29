import express from "express"
import cors from "cors"
import {config} from "dotenv"
import { authRoutes } from "./routes/auth";
import bodyParser from "body-parser";
import { errorHandler } from "./utils/utils";
config()

const app = express();
const port = process.env.PORT || 8000;

app.use(cors({
    origin: '*'
}))

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/auth', authRoutes)

app.get('/', (req, res) => {
    res.send('Express + TypeScript Server');
});

app.use(errorHandler)

app.listen(port, () => {
    console.log(`[server]: Server is running at port ${port}`);
});