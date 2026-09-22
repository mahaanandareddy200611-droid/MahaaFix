import { useNavigate } from "react-router-dom";
import { Forgotpassword as passwordChange } from "../services/auth.service";
import { VerifyOTP } from "../services/auth.service";
import { ChangePassword } from "../services/auth.service"
import { useState } from "react";

function Forgotpassword(){
    const navigate = useNavigate()
    const [Emailloading,setEmailLoading]=useState(false)
    const [Otploading,setOtpLoading]=useState(false)
    const [Passwordloading,setPasswordLoading]=useState(false)
    const [email,setEmail]=useState({email:""})
    const [otp ,setotp] = useState({otp:""})
    const [password,setpassword] = useState({password:""})

    // ================================== Email=======================
    const handleEmailChange =(e)=>{  
        setEmail({
            ...email,
            [e.target.name]:e.target.value
        })}
    
    const handleEmailSubmit =async(e)=>{
        e.preventDefault();
        try {
            setEmailLoading(true)
            await passwordChange(email)
            
        } catch (error) {
            console.log(error)
            alert("failed to get otp! request")
        }finally{setEmailLoading(false)}
    } 
    // ==============================OTP =============================
    const handleOtpChange =(e)=>{  
        setotp({
            ...otp,
            [e.target.name]:e.target.value
        })}
    const handleOTPsubmit =async(e)=>{
        e.preventDefault();
        try {
            setOtpLoading(true)
            await VerifyOTP({email:email.email,otp:otp.otp})
            
        } catch (error) {
            console.log(error)
            alert(
            error.response?.data?.message ||
            "OTP verification failed"
        );  
        }finally{setOtpLoading(false)}
    } 
    // ============================password ===============================
    const handlePasswordChange =(e)=>{  
        setpassword({
            ...password,
            [e.target.name]:e.target.value
        })}
    
    const handlePasswordsubmit =async(e)=>{
        e.preventDefault();
        try {
            setPasswordLoading(true)
            await ChangePassword({email:email.email,password:password.password})
            
        } catch (error) {
            console.log(error)
            alert("failed to reset otp")
        }finally{setPasswordLoading(false)
            navigate("/login")
        }
    } 
    return(
       
        <div>
             {/* ===================== EMAIL ===================== */}
        <div>
            <h1>To Reset Password</h1>
            <p>enter email for otp</p>
            <form onSubmit={handleEmailSubmit}>
                <div>
                    <label>Email</label>
                    <input
                    type="text"
                    name="email"
                    value={email.email}
                    onChange={handleEmailChange}
                    />
                </div>
            

            <button
            type="submit"
            disabled={Emailloading}
            >
                {Emailloading? "Sending otp...." :"Send OTP"}
            </button>
            </form>
        </div>
{/* ===================== OTP ===================== */}
        <div>
            <label>enter OTP </label>
            <p>After getting otp</p>
            <form onSubmit={handleOTPsubmit}>
                <div>
                    <label>OTP</label>
                    <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    name="otp"
                    value={otp.otp}
                    onChange={handleOtpChange}
                    placeholder="Enter 6-digit OTP"
                />
                </div>
                <button
            type="submit"
            disabled={Otploading}
            >
                {Otploading? "checking OTP" :"Submit OTP"}
            </button>
            </form>
        </div>
        <div>
                  {/* ==================== NEW PASSWORD ==================== */}
            <label>enter new password </label>
            <p>remember the password</p>
            <form onSubmit={handlePasswordsubmit}>
                <div>
                    <label>New Password</label>
                    <input
                    type="password"
                    name="password"
                    value={password.password}
                    onChange={handlePasswordChange}
                    placeholder="New Password"
                />
                </div>
                <button
            type="submit"
            disabled={Passwordloading}
            >
                {Passwordloading? "password changing":"change password"}
            </button>
            </form>
        </div>

        </div>
        
    )
}



export default Forgotpassword