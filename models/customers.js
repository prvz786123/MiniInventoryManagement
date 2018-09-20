const jwt = require('jsonwebtoken');

const {mongoose} = require('./../db/mongoose');

const CustomerSchema = mongoose.Schema({
  email:{
    type:String,
    required:true,
    trim:true,
    unique:true
  },
  password:{
    type:String,
    required:true,
    minlength:8
  },
  name:{
    type:String,
    required:true,
    trim:true
  },
  orders:[
    {
      productName:{
        type:String,
        required:true,
      },
      orderQuantity:{
        type:Number,
        required:true
      },
      orderStatus:{
        type:String
      }
    }
  ],
  tokens:[
    {
      token:{
      type:String,
      required:true
      }
    }
  ]
})

CustomerSchema.methods.placeOrder=function(orderQuantity,productName){
  let customer=this;
  let NewOrder={
    productName,
    orderQuantity,
    orderStatus:'confirmed'
  }
  customer.orders.unshift(NewOrder)
  return customer.save().then((successOrderCustDetails)=>{
    return Promise.resolve(successOrderCustDetails);
  }).catch((err)=>{
    return Promise.reject(err);
  })
}

CustomerSchema.methods.generateAuthTokenCustomer=function(){
  let customer = this;
  let access='auth';
  let id=customer._id;

  let TokenDetails={
    id,
    access
  }

  let token = jwt.sign(TokenDetails,'secretkey');

  customer.tokens.unshift({token,access})

  return customer.save().then((savedCustomer)=>{
    return Promise.resolve(token);
  }).catch((err)=>{
    return Promise.reject('unable to save')
  })
}

CustomerSchema.statics.findCustomerByToken=function(token){
  let Customer = this;
  let decodedToken;
  try {
    decodedToken=jwt.verify(token,'secretkey')
  } catch (e) {
    return Promise.reject("Unable to verify token"+e);
  }

  return Customer.findById(decodedToken.id)

}

let Customer = mongoose.model('customers',CustomerSchema);

module.exports={
 Customer
}
