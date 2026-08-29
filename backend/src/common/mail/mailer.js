const nodemailer = require("nodemailer")

const transporter = nodemailer.createTransport({
    host:process.env.MAIL_HOST,
    port:Number(process.env.MAIL_PORT),
    secure:false,
    auth:{
        user:process.env.MAIL_USER,
        pass:process.env.MAIL_PASSWORD
    }
})

const sendMail = async({to,subject,text,html})=>{
    const info = await transporter.sendMail({
        from:process.env.MAIL_USER,
        to,
        subject,
        text,
        html
    })
    return info;

}

module.exports ={sendMail}