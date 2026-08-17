import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setCredentials, logOut } from "./authSlice";
import axios from "axios"; 
import Loader from "../components/ui/Loader"; // 👈 IMPORT LOADER

function AuthInitializer({ children }) {
    const dispatch = useDispatch();
    const [isChecking, setIsChecking] = useState(true);

    useEffect(() => {
        const checkLogin = async () => {
            try {
                const res = await axios.post(
                    "http://localhost:8000/api/users/refreshtoken", 
                    {}, 
                    { withCredentials: true }
                );
                if (!res.data.user) throw new Error("Missing user data");

                dispatch(setCredentials({ 
                    accessToken: res.data.accessToken, 
                    user: res.data.user 
                }));
            } catch (error) {
                dispatch(logOut());
            } finally {
                setIsChecking(false);
            }
        };
        
        checkLogin();   
    }, [dispatch]);

    // 🟢 SHOW LOADER WHILE VERIFYING COOKIES
    if (isChecking) {
        return <Loader fullScreen text="Verifying Session" />;
    }

    return children;
}

export default AuthInitializer;