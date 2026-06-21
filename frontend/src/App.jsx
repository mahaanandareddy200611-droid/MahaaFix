import { useState } from "react"
import api from "./api/api";

function App(){
  const [count,setCount] = useState(0)
  return(
    <div>
      <h1>Hello MahaaFix</h1>
      <p>I started my react</p>
      

      <h2>{count}</h2>
      <button onClick={()=>setCount(prev => prev+1)}>increase button</button>

      {count<=0 && <p>you can't decrease more</p> }

      <h3>{count}</h3>
      <button onClick={()=>{
        if(count>0){
        setCount(prev => prev-1)}}}>decrease button</button>

      <Worker 
      name="ravi" 
      age={35} 
      status="Available"
      /> 
      
    </div>
  )
}
function Worker({ name, age, status }) {
  return (
    <div>
      <p>Name: {name}</p>
      <p>Age: {age}</p>
      <p>Status: {status}</p>
    </div>
  )
}
export default App