import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { clerkMiddleware, requireAuth } from '@clerk/express'
import aiRouter from './routes/airoutes.js';
import connectCloudinary from './configs/cloudinary.js';


const app = express();

await connectCloudinary();

//add middlewares 
app.use(cors());
app.use(express.json());
app.use(clerkMiddleware())


//first route 
app.get('/' , (req, res) =>{
    res.send('Server is running');
})

//clerk middleware 
app.use(requireAuth());
app.use('/api/ai' , aiRouter)

//add port 
const port = process.env.PORT || 3000;

//start express app
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
