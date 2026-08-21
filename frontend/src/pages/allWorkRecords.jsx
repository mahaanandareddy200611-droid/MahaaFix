import { useNavigate } from "react-router-dom";
import { getAllWorkRecords } from "../services/workrecord.service";
import { useState } from "react";
import { useEffect } from "react";

function WorkRecords(){
    const navigate = useNavigate()

    const [records,setRecords] = useState([])   
    const [loading,setLoding]=useState(true)
    const [error,setError] = useState("")
    const [filters,setFilters] = useState({
        title:"",
        category:"",
        type:"",
        city:"",
    })
    const handleChange = (e)=>{
        setFilters({
            ...filters,
            [e.target.name]:e.target.value
        })
    }
    const fetchRecords = async()=>{
        try{
            setLoding(true)
            setError("")

            const responce = await getAllWorkRecords(filters)

            console.log("Work record responce: ", responce.data)
            setRecords(responce.data.data)
        } catch (error){
            console.log("getworkrecords error: ",error)
            setError(
                error.response?.data?.message||"failed to get work records"
            )
        } finally {
            setLoding(false)
        }
    }

    useEffect(()=>{fetchRecords()},[])  // [] means runs only once whrn rendered 
    const handleSearch = () => {
        fetchRecords();
    };

    const handleClear = () => {

        const emptyFilters = {
            title: "",
            category: "",
            type: "",
            city: ""
        };

        setFilters(emptyFilters);
        // Fetch without filters
        getAllWorkRecords({})
            .then((response) => {
                setRecords(response.data.data);
            })
            .catch((error) => {
                console.log(error);
            });
        }
    const handleRecordClick = (id) => {
        navigate(`/workRecords/${id}`);
    };

    
    return (
        <div>

            <h1>Work Records</h1>

            {/* FILTERS */}

            <div>

                <input
                    type="text"
                    name="title"
                    placeholder="Search title"
                    value={filters.title}
                    onChange={handleChange}
                />

                <input
                    type="text"
                    name="category"
                    placeholder="Category"
                    value={filters.category}
                    onChange={handleChange}
                />

                <select
                    name="type"
                    value={filters.type}
                    onChange={handleChange}
                >
                    <option value="">All types</option>
                    <option value="New">New</option>
                    <option value="installation">
                        Installation
                    </option>
                    <option value="repair">
                        Repair
                    </option>
                    <option value="maintenance">
                        Maintenance
                    </option>
                    <option value="replacement">
                        Replacement
                    </option>
                    <option value="inspection">
                        Inspection
                    </option>
                    <option value="service">
                        Service
                    </option>
                </select>

                <input
                    type="text"
                    name="city"
                    placeholder="City"
                    value={filters.city}
                    onChange={handleChange}
                />

                <button onClick={handleSearch}>
                    Search
                </button>

                <button onClick={handleClear}>
                    Clear
                </button>

            </div>

            {/* LOADING */}

            {loading && (
                <p>Loading work records...</p>
            )}

            {/* ERROR */}

            {error && (
                <p>{error}</p>
            )}

            {/* RECORDS */}

            {!loading && !error && (
                <div>

                    <h2>
                        Available Work Records
                    </h2>

                    {records.length === 0 ? (

                        <p>
                            No work records found.
                        </p>

                    ) : (

                        records.map((record) => (

                            <div
                                key={record._id}
                                onClick={() =>
                                    handleRecordClick(record._id)
                                }
                                style={{
                                    border: "1px solid black",
                                    padding: "15px",
                                    margin: "10px 0",
                                    cursor: "pointer"
                                }}
                            > 

                                <h3>
                                    {record.title}
                                </h3>

                                <p>
                                    Worker:{" "}
                                    {record.worker?.name ||
                                        "Unknown worker"}
                                </p>

                                <p>
                                    Category: {record.category}
                                </p>

                                <p>
                                    Type: {record.type}
                                </p>

                                <p>
                                    City: {record.city}
                                </p>

                            </div>

                        ))

                    )}

                </div>
            )}

        </div>
    );
}

export default WorkRecords ;