
import jwt from 'jsonwebtoken';
//used for protecting route which means giving access to a particular route only if the user is logged in and has a valid token
export async function verifyJWT(req, res, next) {
    const token = req.headers["authorization"]?.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Access token is missing",
        });
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.user = decoded;

        next();
    } catch (err) {
        return res.status(403).json({
            success: false,
            message: "Invalid or expired access token",
        });
    }
}