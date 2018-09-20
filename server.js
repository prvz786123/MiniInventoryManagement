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

let port=process.env.PORT || 3000;

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended:true}));

app.get('/',(req,res)=>{
  res.send("Home Page")
})

//Only Employees can post product after successfull authentication
app.post('/products',authenticateEmployee,(req,res)=>{

    console.log(req.body)
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

app.patch('/products',authenticateEmployee,(req,res)=>{
  let stockUpdateDetails=_.pick(req.body,['productID','newStock'])
  let productID=stockUpdateDetails.productID;
  let newStock=stockUpdateDetails.newStock;
  Product.findById(productID).then((product)=>{
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

//it will return all the products details
app.get('/products',(req,res)=>{
  Product.find().then((products)=>{
    res.send(products)
  }).catch((err)=>{
    res.send(err);
  })
})

app.get('/products/:id',(req,res)=>{
  res.send(req.params.id);
})

//register new customer
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

app.post('/customers/login',(req,res)=>{
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


app.post('/customers/orders',authenticateCustomer,(req,res)=>{

  let OrderDetails=_.pick(req.body,['productID','orderQty','customerID']);

  Product.findById(OrderDetails.productID).then((returnProduct)=>{
    let updateCustomer;
    if(returnProduct.stock>=OrderDetails.orderQty){
      Customer.findById(OrderDetails.customerID).then((returnCustomer)=>{
        updateCustomer=new Customer(returnCustomer)
        updateCustomer.placeOrder(OrderDetails.orderQty,returnProduct.name).then((confirmedOrder)=>{
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

app.listen(port,()=>{
  console.log('server started on '+port)
})
