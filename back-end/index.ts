import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import initRoutes from "./src/routes";
import { SERVER_CONFIG } from "./src/config";
import dotenv from 'dotenv';

dotenv.config();
const app: express.Application = express();

// middleware
app.use(morgan("dev")) // Log requests to the console

// These global declarations have been commented since they create issues for the multer file uploading (report route)
// app.use(express.json({ limit: "25mb" }))
// app.use(express.urlencoded({ limit: '25mb', extended: true }))

const port: number = 3001;

const corsOptions = {
    origin: 'http://localhost:5173',
    optionsSuccessStatus: 200,
    credentials: true,
};
app.use(cors(corsOptions));
initRoutes(app)

if (process.env.NODE_ENV !== 'test') {// allow development and test_ui
    app.listen(port, () => {
        console.log(`Server listening at http://localhost:${port}`);
    });
    //initWebSocket(app, port);
}

export { app, SERVER_CONFIG }




