// import decodeToken from '@/utils/decodeToken';
// import { RequestHandler } from 'express';

// const authMiddleware : RequestHandler = (req,res,next)=>{
//     try {
//         const authHeader = req.headers.authorization;
//         if(!authHeader || !authHeader.startsWith("Bearer ")){
//             return res.status(401).json({
//                 success:false,
//                 message: "Access token missing or invalid format"
//             })
//         }

//         // Extracting Token
//         const token = authHeader.split(" ")[1];
//         //  verify token
//         const decodedData= decodeToken(token,"Access_Token");

//         // Attaching User details
//         req.user=decodeToken;

//         next()
//     } catch (error) {
//             console.log(error)
//     }
// }
