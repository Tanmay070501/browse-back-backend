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
import { API_KEY_HEADER, ReplayTypes, SESSION_KEY_HEADER } from "./constants/constants";
import { prisma } from "./utils/prismaClient";
import { sessionRoutes } from "./routes/session";
import { alignDomAndNetworkEvents } from "./utils/eventUtils";
import { retrieveSessionEvent, saveErrorSnapshot, saveSession } from "./utils/saveError";
import { Prisma } from "@prisma/client";
import { SessionBuffer, SingleBufferEvent } from "./@types/type";
import { EventWithTime } from "./@types/event";
import { createServer } from "http";

config()

const app = express();
const port = process.env.PORT || 8000;

// socket on same port
const server = createServer(app)

const io = new Server(server, {
    cors: {
        origin: "*",
    },
    maxHttpBufferSize: 10e8,
})


// const server = http.createServer(app);
// const io = new Server(5000, {
//     cors: {
//         origin: "*",
//     },
//     pingInterval: 60000,
//     pingTimeout: 60000,
// },);


const sessionBuffers: SessionBuffer = {};

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
    const socketSessId = socket.id;
    sessionBuffers[socketSessId] = {};
    const apiKey = socket.handshake.headers[API_KEY_HEADER]
    // const sessionKey = socket.handshake.headers[SESSION_KEY_HEADER]
    
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

    if(!project){
        console.log("Invalid api Key... disconnect")
        socket.emit("invalid", "Invalid API Key")        
        socket.disconnect()
    }

    // Handle disconnection
    socket.on('disconnect', async (s) => {
        console.log('A client disconnected: ', socketSessId, ' Saving its data');

        if(!sessionBuffers?.[socketSessId]?.events?.length){
            console.log("Can't store empty Sessions")
            return;
        }
        saveSession(sessionBuffers[socketSessId], apiKey as string) 
        delete sessionBuffers[socketSessId]       
    });

    socket.once('create_session', async () => {
        const sessionId = uuidv4()
        sessionBuffers[socketSessId].sessionId = sessionId;
        sessionBuffers[socketSessId].events = [];
        sessionBuffers[socketSessId].metadata = {}
        socket.emit("set_session_id", sessionId)
})
    // Handle incoming messages from clients
    socket.on('session', async (data) => {
        const sessionData = retrieveSessionEvent(data)
        if(!sessionData) {
            console.log("Empty Session Data")
            return;
        }
        if(!Object.keys(sessionBuffers[socketSessId]).length){
            return
        }
        sessionBuffers[socketSessId].events.push(...sessionData.events)
        sessionBuffers[socketSessId]["metadata"] = sessionData.metadata
        sessionBuffers[socketSessId]["sessionId"] = sessionData.sessionId
        console.log("saving session data")
    });

    socket.on("error_snapshot", async (data) => {
        console.log(typeof data)
        saveErrorSnapshot(data, apiKey as string)
    })

});

// server.listen

server.listen(port, async () => {
    console.log(`[server]: Server is running at port ${port}`);
});