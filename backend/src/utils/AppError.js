class AppError extends Error {
    
    constructor(message,statusCode){
        
        super(message)

        this.statusCode=statusCode;
        
        this.status = `${statusCode}`.startsWith("4")?"fail":"error";


        Error.captureStackTrace(this,this.constructor)   // where error occurred  which functions were called and debugging information
    }
}

module.exports = AppError;