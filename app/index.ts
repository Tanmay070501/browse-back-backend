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
import { API_KEY_HEADER, RECORD_ERROR_KEY_HEADER } from "./constants/constants";
import { prisma } from "./utils/prismaClient";
import { sessionRoutes } from "./routes/session";
import { retrieveSessionEvent, saveErrorSnapshot, saveSession } from "./utils/saveError";
import { SessionBuffer } from "./@types/type";
import { createServer } from "http";
import morgan from "morgan"
import { logger } from "./utils/logger";
config()

const app = express();
const port = process.env.PORT || 8000;

// socket on same port
const server = createServer(app)

const io = new Server(server, {
    cors: {
        origin: "*",
    },
    maxHttpBufferSize: 5e8, // 500MB
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
app.use(morgan(':method :url :status :res[content-length] - :response-time ms'))

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
    res.send('Hi');
});

app.use(errorHandler)


io.on('connection',async (socket) => {
    const socketSessId = socket.id;
    sessionBuffers[socketSessId] = {};
    const apiKey = socket.handshake.headers[API_KEY_HEADER]
    const recordError = socket.handshake.headers[RECORD_ERROR_KEY_HEADER]
    logger.info(`A client connected, Socket ID: ${socket.id}, API Key: ${apiKey}, recordError: ${recordError}`);

    if(!apiKey) {
        logger.info("No api key... disconnect")        
        socket.emit("invalid", "No api key provided")
        socket.disconnect()
    }
    const project = await prisma.project.findUnique({
        where: {
            apiKey: apiKey as string
        }
    })

    if(!project){
        logger.info("Invalid api Key... disconnect")
        socket.emit("invalid", "Invalid API Key")        
        socket.disconnect()
    }

    socket.emit("start", "");

    // Handle disconnection
    socket.on('disconnect', async (s) => {
        if(recordError === 'true'){
            logger.info(`A client disconnected:  ${socketSessId}`);
            return;
        }
        logger.info(`A client disconnected: ${socketSessId} Saving its data`);

        if(!sessionBuffers?.[socketSessId]?.events?.length){
            logger.info(`Can't store empty Sessions, ${socketSessId}`)
            return;
        }
        saveSession(sessionBuffers[socketSessId], apiKey as string) 
        delete sessionBuffers[socketSessId]       
    });

    socket.on('create_session', async () => {
        const sessionId = uuidv4()
        sessionBuffers[socketSessId].sessionId = sessionId;
        sessionBuffers[socketSessId].events = [];
        sessionBuffers[socketSessId].metadata = {}
        logger.info(`creating session for ${socketSessId}, uuid: ${sessionId}`);
        socket.emit("set_session_id", sessionId)
})
    // Handle incoming messages from clients
    socket.on('session', async (data) => {
        const sessionData = retrieveSessionEvent(data)
        if(!sessionData) {
            logger.info("Empty Session Data")
            return;
        }
        if(!Object.keys(sessionBuffers[socketSessId]).length){
            return
        }
        sessionBuffers[socketSessId].events.push(...sessionData.events)
        sessionBuffers[socketSessId]["metadata"] = sessionData.metadata
        sessionBuffers[socketSessId]["sessionId"] = sessionData.sessionId
        logger.info(`saving session data ${socketSessId}, sessionId: ${sessionData.sessionId}`)
    });

    socket.on("error_snapshot", async (data) => {
        saveErrorSnapshot(data, apiKey as string)
    })

});


server.listen(port, async () => {
    logger.info(`Server is running at port ${port}`);
});