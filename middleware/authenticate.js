const {Employee} = require('./../models/employees');
const {Customer} = require('./../models/customers');

let authenticateEmployee=(req,res,next)=>{
  let token = req.header('x-auth');

  Employee.findEmployeeByToken(token).then((employee)=>{
    if(!employee){
      return Promise.reject();
    }
    req.employee=employee;
    req.token=token;
    next();
  }).catch((err)=>{
    res.status(401).send();
  })
}

let authenticateCustomer=(req,res,next)=>{
    let token=req.header('x-auth');
    Customer.findCustomerByToken(token).then((customer)=>{
      if(!customer){
        return Promise.reject("th");
      }
      req.customer=customer;
      req.token=token;
      next();
    }).catch((err)=>{
      res.status(401).send("i");
    })
}

module.exports={
  authenticateEmployee,
  authenticateCustomer
}
