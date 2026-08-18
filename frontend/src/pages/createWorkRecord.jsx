import { useState } from "react";

import {createWorkRecord as createRecord} from "../services/workrecord.service"
import { useNavigate } from "react-router-dom";

function CreateWorkRecord(){
    const Navigate= useNavigate()
    const [value,setValue]=useState({
        title:"",
        type: "",
        category: "",
        amount: "",
        visibility : "public",
        description : "",
        city : "",
        customerWhatsappNumber:"",
        engagementType:""

    })
    const [loading,setLoading]=useState(false)

    const handleChange =(e)=>{  
        setValue({
            ...value,
            [e.target.name]:e.target.value
        })
    }
    const HandleSubmit = async(e)=>{
        e.preventDefault();
        console.log("sending data", value )
        console.log("TOKEN:", localStorage.getItem("token"));

        try{

            setLoading(true);
            const response = await createRecord(value)
            alert("Work Record Created successfully!")
            Navigate("/dashboard")
        }catch(error){
            console.log("TOKEN:", localStorage.getItem("token"));
            console.log("create work reacord error: ",error)
            console.log("backend responce (create workrecord) ",error.response?.data)
            alert(error.response?.data?.message || "Failed to create work record")
        }
        finally{setLoading(false)}}
    return(
        <div>
            <h1>Create Work Record</h1>

            
        <form onSubmit={HandleSubmit}>
        <div>
            <label>Title</label>
            <input 
            type="text"
            name="title"
            value={value.title}
            onChange={handleChange}
            maxLength={100}
            placeholder="Example:AC Instalation"
            required

            />
            
        </div>
        <div>
            <label>Type</label>
            <select
            name="type"
            value={value.type}
            onChange={handleChange}
            required
            >
                <option value="">Select type</option>
                <option value="New">New</option>
                <option value="installation">installation</option>
                <option value="repair">repair</option>
                <option value="maintenance">maintenance</option>
                <option value="replacement">replacement</option>
                <option value="inspection">inspection</option>
                <option value="service">service</option>
                
            </select>
        </div>
        <div>
    <label>Category</label>

    <input
        type="text"
        name="category"
        value={value.category}
        onChange={handleChange}
        required
    />
    </div>
    <div className="engagement-type">
     <label className="field-label">Engagement type</label>

    <div className="engagement-options">
        <label>
            <input
            type="radio"
            name="engagementType"
            value="work"
            checked={value.engagementType === "work"}
            onChange={handleChange}
        />

      <span>
        <strong>One-time work</strong>
        <small>For a single project or task</small>
      </span>
    </label>

    <label>
      <input
        type="radio"
        name="engagementType"
        value="contract"
        checked={value.engagementType === "contract"}
        onChange={handleChange
        }
      />

      <span>
        <strong>Contract</strong>
        <small>For ongoing or fixed-term work</small>
      </span>
    </label>
  </div>
</div>
        <div>
            <label>visibility</label>
            <select
            name="visibility"
            value={value.visibility}
            onChange={handleChange}
            required
            >
                <option value="public" >public</option>
                <option value="private">private</option>
            </select>
        </div>
        <div>
            <lable>amount</lable>
            <input
            name="amount"
            value={value.amount}
            type="number"
            onChange={handleChange}
            min="0"
            placeholder="ex:2500"
            required

            />
        </div>
        <div>
            <lable>customer whatsapp Number</lable>
            <input
            name="customerWhatsappNumber"
            value={value.customerWhatsappNumber}
            type="tel"
            onChange={handleChange}
            
            placeholder="+91 1234567890"
            required

            />
        </div>
        <div>
            <label>city</label>
            <input 
            type="text"
            name="city"
            value={value.city}
            onChange={handleChange}
            maxLength={100}
            placeholder="Example:Hyderabad"
            required

            />
            
        </div>
        <div>
            <label>Description</label>
            <input 
            type="text"
            name="description"
            value={value.description}
            onChange={handleChange}
            minLength={10}
            placeholder="Example: i installed 2 Ac units ..."
            required

            />
            
        </div>
        <p>many days work can edit and add day by day works </p>

        <button type="submit" disabled={loading}>{loading?"Creating":"Create Work Record"}</button>
        </form>
        </div>
    )
}

export default CreateWorkRecord;