import express from "express"
import cors from "cors"
import {config} from "dotenv"
import { authRoutes } from "./routes/auth";
import bodyParser from "body-parser";
import { errorHandler } from "./utils/utils";
import { authMiddleware } from "./middlewares/authMiddleware";
import { userRoutes } from "./routes/user";
import { projectRoutes } from "./routes/project";
import {Server} from"socket.io"
import { v4 as uuidv4 } from 'uuid';
import { API_KEY_HEADER, ReplayTypes } from "./constants/constants";
import { prisma } from "./utils/prismaClient";
import { sessionRoutes } from "./routes/session";

config()

const app = express();
const port = process.env.PORT || 8000;

// const server = http.createServer(app);
const io = new Server(5000, {
    cors: {
        origin: "*"
    }
});

app.use(cors({
    origin: '*'
}))

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/auth', authRoutes)

app.use("/user", authMiddleware, userRoutes)
app.use("/project", authMiddleware, projectRoutes)
app.use("/session", authMiddleware, sessionRoutes)

app.get('/', (req, res) => {
    res.send('Express + TypeScript Server');
});

app.use(errorHandler)

io.on('connection',async (socket) => {
    console.log('A client connected', socket.id);
    const apiKey = socket.handshake.headers[API_KEY_HEADER]
    console.log("api", apiKey)
    if(!apiKey) {
        console.log("No api key... disconnect")        
        socket.emit("invalid", "No api key provided")
        socket.disconnect()
    }
    const project = await prisma.project.findUnique({
        where: {
            apiKey: apiKey as string
        }
    })
    console.log("project", project)

    if(!project){
        console.log("Invalid api Key... disconnect")
        socket.emit("invalid", "Invalid API Key")        
        socket.disconnect()
    }
    socket.on("connected", () => {
        console.log("Connected")
    })
    // Handle incoming messages from clients
    socket.on('session', (data) => {
        console.log(apiKey)
        console.log('Received:');
        console.log(data)
        // You can broadcast the message to all clients or perform other actions here
    });

    socket.on("error_snapshot", async (data) => {
        console.log(typeof data)
        try{
            const events = JSON.parse(data)
            if(!events?.length) return
            if(!events[0]?.timestamp || events[events.length - 1]?.timestamp) return
            await prisma.sessionReplay.create({
                data: {
                    sessionId: uuidv4() as string,
                    started_at: new Date(events[0]?.timestamp),
                    ended_at: new Date(events[events.length - 1]?.timestamp),
                    events: events,
                    type: ReplayTypes.error,
                    Project: {
                        connect: {
                            apiKey: apiKey as string
                        }
                    }
                }
            })
            // console.log(session)
        }catch(err){
            console.log(err)
        }
        
    })

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('A client disconnected', project.apiKey);
    });
});

app.listen(port, () => {
    console.log(`[server]: Server is running at port ${port}`);
});