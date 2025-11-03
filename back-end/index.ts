import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import initRoutes from "./src/routes";
import dotenv from 'dotenv';

dotenv.config();
const app: express.Application = express();
// middleware
app.use(express.json()); // it converts json body to req.body
app.use(morgan('dev')); // it shows log for http requests

const port: number = 3001;

const corsOptions = {
    origin: 'http://localhost:5173',
    optionsSuccessStatus: 200,
    credentials: true,
};
app.use(cors(corsOptions));
initRoutes(app)

if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        console.log(`Server listening at http://localhost:${port}`);
    });
    //initWebSocket(app, port);
}

export { app }




