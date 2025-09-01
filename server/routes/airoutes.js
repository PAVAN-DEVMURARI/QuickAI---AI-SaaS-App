import express from "express"
// Fix path: folder name is "middlewares" (plural)
import { auth } from "../middlewares/auth.js"  
import { generateArticle, generateBlogTitle, generateImage } from "../controllers/aiController.js";

const aiRouter = express.Router();

aiRouter.post('/generate-article', auth , generateArticle);
aiRouter.post('/generate-blog-title', auth , generateBlogTitle);
aiRouter.post('/generate-image', auth , generateImage);
export default aiRouter;