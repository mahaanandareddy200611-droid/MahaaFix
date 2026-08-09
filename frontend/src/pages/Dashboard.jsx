import { useNavigate } from "react-router-dom";

function Dashboard(){
    const navigate=useNavigate()
    localStorage.getItem("token")

    const HandleLogout = ()=>{
        localStorage.removeItem("token")
        navigate("/login")
    }
    return(
    <div>
        <h>Hai User! </h>
        <p>Welcome to home page </p>
        <p>you completed your login !</p>

        <button onClick={HandleLogout}>Logout</button>

    </div>
    )

    
}
export default Dashboard