const jwt=require('jsonwebtoken');

const {mongoose} = require('./../db/mongoose');

let EmployeeSchema = mongoose.Schema({
  email:{
    type:String,
    required:true,
    unique:true,
    trim:true
  },
  password:{
    type:String,
    required:true,
    minlength:8
  },
  employeeName:{
    type:String,
    required:true,
    trim:true
  },
  designation:{
    type:String,
    required:true
  },
  tokens:[
    {
      access:{
        type:String,
        required:true,
      },
      token:{
        type:String,
        required:true
      }
  }
  ]
})

EmployeeSchema.methods.generateAuthTokenEmployee=function(){
  let employee = this;
  let access='read';
  let id=employee._id;
  if(employee.designation=='Manager'){
    access:'read-write'
  }
  let TokenDetails={
    id,
    access
  }
  let token = jwt.sign(TokenDetails,'secretkey');

  employee.tokens.unshift({token,access})

  return employee.save().then((savedEmployee)=>{
    return Promise.resolve(token);
  }).catch((err)=>{
    return Promise.reject('unable to save')
  })
}

EmployeeSchema.statics.findEmployeeByToken=function(token){
  let User=this;

  let decode;
  try {
    decode=jwt.verify(token,'secretkey');
  } catch (e) {
    return Promise.reject();
  }
    return User.findById(decode.id)
}

let Employee = mongoose.model('employees',EmployeeSchema);


module.exports={
  Employee
}
