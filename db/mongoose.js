const mongoose=require('mongoose');

mongoose.connect('mongodb://localhost:27017/HaTaApp',{ useNewUrlParser: true });

module.exports={
  mongoose
}
