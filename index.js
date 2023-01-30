const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const Product = require('./models/product');
const methodOverride = require('method-override');
const AppError = require('./AppError');

main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/farmStand');
  console.log('CONNECTION OPEN')
  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}


app.set('views',path.join(__dirname,'views'))
app.set('view engine','ejs')

app.use(express.urlencoded({extended:true}))
app.use(methodOverride('_method'))

const categories = ['fruit','vegetable','dairy']

app.get('/products/new',(req,res)=>{
  res.render('products/new',{categories})
})

app.post('/products',wrapAsync( async (req,res,next)=>{
  const newProduct = new Product(req.body)
  await newProduct.save();
  res.redirect(`/products/${newProduct._id}`)
}))

app.get('/products', wrapAsync( async (req,res,next)=>{
  const {category} = req.query;
  if (category){
    const products = await Product.find({category})
    res.render('products/index',{products,category})
  } else {
    const products = await Product.find({})
    res.render('products/index',{products,category:'All'})
  }
}))

function wrapAsync(fn){
  return function(req,res,next){
    fn(req,res,next).catch(e=>next(e))
  }
}

app.get('/products/:id',wrapAsync(async (req,res,next)=>{

  const {id} = req.params;
  const product = await Product.findById(id)
  if (!product){
    new AppError('Product Not Found',404);
  }
  res.render('products/show',{product})
}))

app.get('/products/:id/edit',wrapAsync(async (req,res,next)=>{
  const {id} = req.params;
  const product = await Product.findById(id);
  if (!product){
    return next(new AppError('Product Not Found',404));
  }
  res.render('products/edit',{product,categories})
}))

app.put('/products/:id', wrapAsync (async (req,res,next)=>{
  const {id} = req.params;
  const product = await Product.findByIdAndUpdate(id,req.body,{runValidators:true,new:true})
  res.redirect(`/products/${product._id}`);
}))

app.delete('/products/:id',async (req,res)=>{
  const {id} = req.params;
  const product = await Product.findByIdAndDelete(id);
  res.redirect('/products');
} )

app.use((err,req,res,next)=>{
  console.log(err.name);
  next(err);
})

app.use((err,req,res,next)=>{
  const {status = 500, message='Something went wrong'} = err;
  res.status(status).send(message);
})

app.listen(3000,()=>{
    console.log("APP IS LISTENING ON PORT 3000")
})