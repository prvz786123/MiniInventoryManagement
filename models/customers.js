const jwt = require('jsonwebtoken');

const {mongoose} = require('./../db/mongoose');

const CustomerSchema = mongoose.Schema({
  email:{
    unique:true,
    type:String,
    required:true,
    trim:true

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
      productID:{
        required:true,
        type:String
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

CustomerSchema.methods.placeOrder=function(NewOrder){
  let customer=this;
  customer.orders.unshift(NewOrder)
  return customer.save().then((PlacedOrder)=>{
    if(!PlacedOrder){
      return Promise.reject("unable to place order");
    }
    return Promise.resolve(NewOrder);
  }).catch((err)=>{
    return Promise.reject("err"+err);
  })
}

CustomerSchema.methods.cancelOrder=function(orderID){
  let customer=this;

  for(let i=0; i<customer.orders.length;i++){
    if(customer.orders[i]._id.equals(mongoose.Types.ObjectId(orderID))){
      let cancelQty=customer.orders[i].orderQuantity;
      let cancelProductID=customer.orders[i].productID;

      if(customer.orders[i].orderStatus=='confirmed'){
        customer.orders[i].orderStatus='Cancelled';
        return Customer.findByIdAndUpdate(customer._id,customer,{new:true}).then((updatedCust)=>{
          return Promise.resolve({cancelQty,cancelProductID});
        }).catch((err)=>{
            return Promise.reject(err);
        })
      }else{
        return Promise.reject('Bad Request');
      }

    }
  }
  return Promise.reject("unable to cancel Order")

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
