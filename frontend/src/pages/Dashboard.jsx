import { useState } from "react";

import { useNavigate } from "react-router-dom";

function Dashboard(){
    const navigate=useNavigate()

    const HandleWorkRecord = () => {
      
                alert("you are adding work")
                navigate("/createWorkRecord")
    }
    const handleallWorkRecords=()=>{
        navigate("/WorkRecords")
    }
    const HandleLogout = ()=>{
        localStorage.removeItem("token")
        navigate("/login")
    }
    return(
    <div>
        <h>Hai User! </h>
        <p>Welcome to home page </p>
        <p>Record work ++</p>
        <button onClick={HandleWorkRecord}>Add work</button>

        <p>All Work Records</p>
        <button onClick={handleallWorkRecords}>get All Work Records</button>



        <p>you completed your login !</p>

        <button onClick={HandleLogout}>Logout</button>

    </div>
    )

    
}
export default Dashboard