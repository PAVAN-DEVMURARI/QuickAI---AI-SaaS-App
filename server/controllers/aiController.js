
import OpenAI from "openai";
import sql from "../configs/db.js";
import { types } from "@neondatabase/serverless";
import { clerkClient } from "@clerk/express";
import axios from "axios";
import {v2 as cloudinary} from 'cloudinary'

const AI = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

export const generateArticle = async (req,res) => {
    try{
        const {userId} = req.auth();
        const {prompt , length} = req.body;
        const plan = req.plan;
        const free_usage = req.free_usage;

        if (plan !== 'premium'&& free_usage >= 10)
        {
            return res.json({success: false, message: 'Free usage limit reached , Upgrade to continue'});
        }

        //generate article
        const response = await AI.chat.completions.create({
            model: "gemini-2.5-flash",
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: length,
        });

        const content = response.choices[0].message.content;

        await sql` INSERT INTO creations(user_id, prompt, type, content) VALUES (${userId}, ${prompt}, 'article' , ${content})`

        if (plan !== 'premium')
        {
            await clerkClient.users.updateUserMetadata(userId, {
                privateMetadata:{free_usage: free_usage + 1}
            });
        }

        res.json({success:true , content})


    }
    catch(error)
    {
        console.log(error.message);
        res.json ({success: false, message: error.message}); 
    }
}


//for blog title generation
export const generateBlogTitle = async (req,res) => {
    try{
        const {userId} = req.auth();
        const {prompt} = req.body;
        const plan = req.plan;
        const free_usage = req.free_usage;

        if (plan !== 'premium'&& free_usage >= 10)
        {
            return res.json({success: false, message: 'Free usage limit reached , Upgrade to continue'});
        }

        //generate blog title
        const response = await AI.chat.completions.create({
            model: "gemini-2.5-flash",
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 100,
        });

        const content = response.choices[0].message.content;

        //update in the database
        await sql` INSERT INTO creations(user_id, prompt, type, content) VALUES (${userId}, ${prompt}, 'blog-title' , ${content})`

        if (plan !== 'premium')
        {
            await clerkClient.users.updateUserMetadata(userId, {
                privateMetadata:{free_usage: free_usage + 1}
            });
        }

        res.json({success:true , content})


    }
    catch(error)
    {
        console.log(error.message);
        res.json ({success: false, message: error.message}); 
    }
}


//generate the image
export const generateImage = async (req,res) => {
    try{
        const {userId} = req.auth();
        const {prompt , publish} = req.body;
        const plan = req.plan;

        if (plan !== 'premium')
        {
            return res.json({success: false, message: 'Upgrade to continue'});
        }

        //generate image
        const formData = new FormData()
        form.append('prompt', prompt);
        const {data} = await axios.post("https://clipdrop-api.co/text-to-image/v1" , formData , {
            headers :{'x-api-key': process.env.CLIPDROP_API_KEY},
            responseType : "arraybuffer",
        })
        
        const base64Image = `data:image/png;base64,${Buffer.from(data , 'binary').toString('base64')}`


        const{secure_url} =  await cloudinary.uploader.upload(base64Image)

        //update in the database
        await sql` INSERT INTO creations(user_id, prompt, type, content , publish) VALUES (${userId}, ${prompt}, 'image', ${secure_url} , ${publish ?? false})`;


        res.json({success:true , secure_url})


    }
    catch(error)
    {
        console.log(error.message);
        res.json ({success: false, message: error.message}); 
    }
}



//remove the background 
export const removeImageBackground = async (req,res) => {
    try{
        const {userId} = req.auth();
        const {image} = req.file;
        const plan = req.plan;

        if (plan !== 'premium')
        {
            return res.json({success: false, message: 'Upgrade to continue'});
        }

        //generate image
        

        const{secure_url} =  await cloudinary.uploader.upload(image.path,{
            transformation: [
                {
                    effect:'background_removal',
                    background_removal: 'remove the background'
                }
            ]
        })

        //update in the database
        await sql` INSERT INTO creations(user_id, prompt, type, content ) VALUES (${userId}, 'Remove background from the image', 'image', ${secure_url} )`;


        res.json({success:true , secure_url})


    }
    catch(error)
    {
        console.log(error.message);
        res.json ({success: false, message: error.message}); 
    }
}



//remove image object 
export const removeImageObject = async (req,res) => {
    try{
        const {userId} = req.auth();
        const {object} = req.body();
        const {image} = req.file;
        const plan = req.plan;

        if (plan !== 'premium')
        {
            return res.json({success: false, message: 'Upgrade to continue'});
        }

        //remove the object
        const{public_id} =  await cloudinary.uploader.upload(image.path)

        const image_url = cloudinary.url(public_id,{
            transformation: [{effect:`gen_remove:${object}`}],
            resource_type:'image'
        })

        //update in the database
        await sql` INSERT INTO creations(user_id, prompt, type, content ) VALUES (${userId}, ${`Removed ${object} from the image`}, 'image', ${image_url} )`;


        res.json({success:true , image_url})


    }
    catch(error)
    {
        console.log(error.message);
        res.json ({success: false, message: error.message}); 
    }
}