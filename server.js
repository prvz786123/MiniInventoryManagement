//Third party modules imports
const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');

//My Personal Imports
const {Product} = require('./models/products');
const {Customer} = require('./models/customers');
const {Employee} = require('./models/employees');
const {authenticateEmployee} = require('./middleware/authenticate');
const {authenticateCustomer} = require('./middleware/authenticate');


const app=express();

//port initialized
let port=process.env.PORT || 3000;

//bodyParser middleware
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}));

//root route
app.get('/',(req,res)=>{
  res.send("Home Page")
})

//Add New Product
//Only Employees can add new product after successfull authentication
app.post('/products',authenticateEmployee,(req,res)=>{

    let productDetails = _.pick(req.body,['name','stock']);
    let newProduct = new Product(productDetails);
    newProduct.save().then((savedProduct)=>{
      console.log("saved")
      res.send(savedProduct);
    }).catch((err)=>{
      console.log(err)
      res.send(err);
    })
})

//update stock empDetails
//Only Employees can update stock after successfull authentication
app.patch('/products',authenticateEmployee,(req,res)=>{
  let stockUpdateDetails=_.pick(req.body,['productID','newStock'])
  let productID=stockUpdateDetails.productID;
  let newStock=stockUpdateDetails.newStock;
  Product.findById(productID).then((product)=>{
    if(!product){
      return res.send("unable to find product")
    }
    let stock=product.stock+newStock;
    Product.findByIdAndUpdate(productID,{
      $set:{
        stock
      }
    },{new:true}).then((updatedStockProduct)=>{
      res.send(updatedStockProduct);
    }).catch((err)=>{
      res.send("err 53"+err)
    })
  })
})

//it will return all the product with stock details
app.get('/products',(req,res)=>{
  Product.find().then((products)=>{
    res.send(products)
  }).catch((err)=>{
    res.send(err);
  })
})


//New Customer Registration

app.post('/customers',(req,res)=>{
  let customerData = _.pick(req.body,['email','password','name']);
  let customer = new Customer(customerData);
  customer.save().then((savedCustomer)=>{
    customer.generateAuthTokenCustomer().then((token)=>{
      res.header('x-auth',token);
      res.send("62"+savedCustomer);
    })
  }).catch((err)=>{
    res.send("65"+err);
  })
})

//Customer Login with valid credential
app.patch('/customers/login',(req,res)=>{
  let credentials = _.pick(req.body,['email','password'])
  Customer.findOne({
    email:credentials.email
  }).then((customer)=>{
    if(!customer){
      res.status(401).send('Invalid credentials')
    }else if (customer.password==credentials.password) {
        customer.generateAuthTokenCustomer().then((token)=>{
          res.header('x-auth',token);
          res.send("login success")
        }).catch((err)=>{
          res.send(err);
        })
    }else {
      res.status(401).send("Invalid credentials")
    }
  })
})

//logout
//all authentication tokens will be removed
app.delete('/customers/logout',(req,res)=>{
    let token=req.header('x-auth');
    Customer.findCustomerByToken(token).then((customer)=>{
      if(customer.tokens.length<=0){
        return res.send("already logged out")
      }
      customer.tokens=[];

      customer.save().then((loggedOutcust)=>{
        res.send("successfully logged out")
      })
    }).catch((err)=>{
      res.send("invalid details");
    })
})

//Place New OrderDetails
//Only valid customers can place order after succe authentication
app.patch('/customers/orders',authenticateCustomer,(req,res)=>{

  let OrderDetails=_.pick(req.body,['productID','orderQty','customerID']);

  Product.findById(OrderDetails.productID).then((returnProduct)=>{
    if(!returnProduct){
      return res.send("Unable to find product")
    }
    if(returnProduct.stock>=OrderDetails.orderQty){
      Customer.findById(OrderDetails.customerID).then((customer)=>{
        customer.placeOrder(OrderDetails.orderQty,returnProduct.name,returnProduct._id).then((confirmedOrder)=>{
          returnProduct.stock-=OrderDetails.orderQty;
          Product.findByIdAndUpdate(OrderDetails.productID,returnProduct,{new:true}).then((updatedStockProduct)=>{
            res.send(updatedStockProduct);
          })
        })
      }).catch((err)=>{
          res.send(err);
        })
    }
    else{
      res.send({
        err:"Low Stock",
        msg:`you can order only ${returnProduct.stock}`
      })
    }
  }).catch((err)=>{
    res.send("err"+err);
  })
})

//Cancel Order
//Only customer who has created the order can cancel it
app.delete('/customers/orders/cancel',authenticateCustomer,(req,res)=>{
    let orderID=_.pick(req.body,['orderID','productID']).orderID

    req.customer.cancelOrder(orderID).then((cancelDetails)=>{
        if(!cancelDetails){
          return res.status(404).send();
        }
        Product.findByIdAndUpdate(cancelDetails.cancelProductID,{
          $inc:{
            stock:cancelDetails.cancelQty
          }
        },{new:true}).then((updatedProduct)=>{
          res.send(updatedProduct);
        })
    }).catch((err)=>{
      res.status(400).send("err "+err);
    })
})

//Employee Registration
app.post('/employees',(req,res)=>{
  let empDetails=_.pick(req.body,['email','password','employeeName','designation','access'])
  let newEmployee=Employee(empDetails);

  newEmployee.save().then((employee)=>{
    newEmployee.generateAuthTokenEmployee().then((token)=>{
      res.header('x-auth',token);
      res.send(token);
    })
  }).catch((err)=>{
    res.send(err);
  })
})

//Employee login
//Only Employees with valid credential can login
app.post('/employees/login',(req,res)=>{
  let credentials = _.pick(req.body,['email','password']);

  Employee.findOne({email:credentials.email}).then((employee)=>{
    if(!employee){
      res.status(401).send('Invalid credentials')
    }else if (employee.password==credentials.password) {
      employee.generateAuthTokenEmployee().then((token)=>{
        res.header('x-auth',token)
        res.send("employee login success")
      }).catch((err)=>{
        res.send(err)
      })
    } else {
      res.status(401).end('Invalid credentials')
    }
  })
})

//start app on port
app.listen(port,()=>{
  console.log('server started on '+port)
})
