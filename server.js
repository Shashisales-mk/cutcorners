const express = require("express");
const path = require("path");
const methodOverride = require("method-override");
const ejs = require('ejs');
const ejsMate = require("ejs-mate");
const mongoose = require("mongoose");
const multer = require('multer');
const bannerRoutes = require('./routes/banners');
const Banner = require('./models/Banner');
const Category = require('./models/Category');
const Product = require('./models/Product');
const MenuItem = require('./models/Menuitem');
const Occasion = require('./models/Occasion');
const Order = require('./models/Order');
const Slot = require('./models/Slot');
const Section = require('./models/Section');
const categoryRoutes = require('./routes/categories');
const productRoutes = require('./routes/products');
const fs = require('fs').promises;
const occasionRoutes = require('./routes/occasions');
const adminRoutes = require('./routes/orders'); // Add this line
const bookingRoutes = require('./routes/bookingRoutes');
const slotsroute = require('./routes/slots');
const sectionRoutes = require('./routes/sections');
const session = require('express-session');
const flash = require('connect-flash');
const User = require("./models/User");
const Page = require("./models/Page");
const Booking = require('./models/Booking');
const passport = require('./config/passport');
const Templatesender = require("./utils/mailSender");
const jsSHA = require('jssha');
const request = require('request');
const dotenv = require('dotenv');
const MongoStore = require('connect-mongo');
const Screen = require('./models/screenImages');
const imageRoutes = require('./routes/theatreimages');
const Theatreimages = require('./models/Theatreimage')



const app = express();
const mongoURL = process.env.MONGO_URL;


main().then(() => {
  console.log("connected to the DB");
}).catch((err) => {
  console.log(err);
});

async function main() {
  await mongoose.connect("mongodb://CutCorner:cutcorner1234@93.127.195.9:27017/cutcorners");
}



app.use(session({
  secret: 'cut-corners',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: 'mongodb://CutCorner:cutcorner1234@93.127.195.9:27017/cutcorners',
    collectionName: 'sessions',
  }),
  cookie: {
    maxAge: 48 * 60 * 60 * 1000,
  },
}));


// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "/public")));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(flash());

dotenv.config();

// Middleware to make flash messages available to all views
app.use((req, res, next) => {
  res.locals.flashMessages = req.flash();
  next();
});


// Set up Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/') // Make sure this directory exists
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)) // Appending extension
  }
});

const upload = multer({ storage: storage });



// Authentication middleware
const isAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.redirect('/login');
};


const fetchCategories = async (req, res, next) => {
  try {
    const categories = await Category.find().select('name');
    res.locals.categories = categories;
    next();
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.locals.categories = [];
    next();
  }
};
const fetchMenuitems = async (req, res, next) => {
  try {
    const menuItems = await MenuItem.find();;
    res.locals.menuItems = menuItems;
    next();
  } catch (error) {
    console.error('Error fetching menuItems:', error);
    res.locals.menuItems = [];
    next();
  }
};



const fetchProducts = async (req, res, next) => {
  try {
    const products = await Product.find().populate('category').select('name price image category');
    res.locals.products = products;
    next();
  } catch (error) {
    console.error('Error fetching products:', error);
    res.locals.products = [];
    next();
  }
};


app.use(fetchCategories);
app.use(fetchMenuitems);
app.use(fetchProducts);









// Routes
app.use('/', bannerRoutes);

app.use('/admin/categories', categoryRoutes);
app.use('/admin/products', productRoutes);
// Use the occasion routes
app.use('/admin/occasions', occasionRoutes);
app.use('/order', adminRoutes); // Add this line instead
app.use('/booking', bookingRoutes);
app.use('/slot', slotsroute);

app.use('/section', sectionRoutes);
app.use('/theatreimages', imageRoutes);


const MERCHANT_KEY = process.env.PAYU_MERCHANT_KEY ;
const MERCHANT_SALT = process.env.PAYU_MERCHANT_SALT;
const PAYU_BASE_URL = 'https://secure.payu.in/_payment';








app.get("/admin-panel", isAdmin, async (req, res) => {
  try {
    const { search, sortBy } = req.query;

    // Build the filter object
    let filter = {};
    if (search) {
      filter = {
        $or: [
          { _id: mongoose.Types.ObjectId.isValid(search) ? mongoose.Types.ObjectId(search) : null },
          { event: { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Build the sort object
    let sort = {};
    if (sortBy === 'dateAsc') {
      sort = { date: 1 };
    } else {
      sort = { date: -1 }; // Default to newest first
    }

    const banners = await Banner.find();
    const products = await Product.find().populate('category');
    const categories = await Category.find();
    const occasions = await Occasion.find();
    const orders = await Order.find().sort({ createdAt: -1 })
      .populate('occasion')
      .populate('slot')
      .populate('categories')
      .populate('products')
      .sort(sort);;
    const slots = await Slot.find();
    const availableSlots = await Slot.find({ isAvailable: true });
    const menuItems = await MenuItem.find();
    const pages = await Page.find().sort({ createdAt: -1 });
    const bookings = await Booking.find().sort({ createdAt: -1 })
    const sections = await Section.find();
    const screens = await Screen.find();
    const images = await Theatreimages.find();

    // Fetch all slots
    let ptSlots = await Slot.find({ type: 'pt' });
    let phSlots = await Slot.find({ type: 'ph' });

    // If a date is provided, filter the slots
    if (req.query.date) {
      const selectedDate = new Date(req.query.date);

      ptSlots = ptSlots.filter(slot =>
        slot.privateScreen1Available &&
        slot.privateScreen2Available &&
        !slot.unavailableDates.some(ud =>
          ud.date.toDateString() === selectedDate.toDateString() &&
          (ud.screen === 'Private Screen-1' || ud.screen === 'Private Screen-2')
        )
      );

      phSlots = phSlots.filter(slot =>
        slot.partyHallAvailable &&
        !slot.unavailableDates.some(ud =>
          ud.date.toDateString() === selectedDate.toDateString() &&
          ud.screen === 'Party Hall'
        )
      );
    }


    res.render('admin-panel', {
      search: search || '',
      sortBy: sortBy || 'dateDesc',
      screens, sections, bookings,
      banners, products, categories,
      occasions, orders, slots,
      availableSlots, menuItems,
      pages,
      ptSlots,
      phSlots,
      selectedDate: req.query.date || '',
      images
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

app.get("/add-ons", async (req, res) => {
  try {
    const categories = await Category.find().populate('products');

    res.render('add-ons', { categories });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});


// Routes
app.get('/api/menu-items', async (req, res) => {
  try {
    const menuItems = await MenuItem.find();
    res.json(menuItems);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch menu items' });
  }
});

app.post('/api/menu-items', async (req, res) => {
  const { name, link, category } = req.body;
  try {
    const newMenuItem = new MenuItem({ name, link, category });
    await newMenuItem.save();
    res.json(newMenuItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add menu item' });
  }
});

app.delete('/api/menu-items/:id', async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete menu item' });
  }
});
app.get("/", async (req, res) => {
  res.render("index")
})
app.get("/contact", async (req, res) => {
  res.render("contact")
})
app.get("/about", async (req, res) => {
  res.render("about")
})
app.get("/add-ons", async (req, res) => {
  res.render("add-ons")
})
app.get("/refund", async (req, res) => {
  res.render("refund")
})
app.get("/book-now", async (req, res) => {
  res.redirect("/booking")
})
app.get("/party-hall", async (req, res) => {
  res.render("party-hall")
})
app.get('/private-theater', async (req, res) => {
  let screens = await Screen.find();

  // If no screens in database, create default ones
  if (screens.length === 0) {
    const defaultScreens = [
      { screenId: 'screen1', image1Url: '/assets/img/ps-screen1-1.png', image2Url: '/assets/img/ps-screen1-2.png' },
      { screenId: 'screen2', image1Url: '/assets/img/ps-screen2-1.png', image2Url: '/assets/img/ps-screen2-2.png' }
    ];
    await Screen.insertMany(defaultScreens);
    screens = await Screen.find();
  }

  res.render('private-theater', { screens });
});
app.get("/screening", async (req, res) => {
  res.render("screening")
})
app.get("/testp", async (req, res) => {
  res.render("test")
})
// app.get("/love-theme", async (req, res) => {
//   try {
//     const section = await Section.findOne({ name: "Love Theme" });

//     // if (!section) {
//     //   return res.status(404).send('Love Theme section not found');
//     // }

//     res.render("love-theme", { section });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Server error');
//   }
// });



// server.js or routes file
app.get('/section/:id', async (req, res) => {
  try {
    const section = await Section.findById(req.params.id).populate('menuItem');
    if (!section) {
      return res.status(404).send('Section not found');
    }
    res.render('section-template', { section });
  } catch (error) {
    console.error(error);
    res.status(500).send('Server error');
  }
});











app.get('/:pageName', async (req, res, next) => {
  try {
    const pageName = req.params.pageName;

    if (pageName === 'favicon.ico') {
      return next();
    }

    const page = await Page.findOne({ name: pageName }).populate('theme').populate('sections');
    console.log(page, "page");

    if (!page) {
      console.log(`Page not found: ${pageName}`);
      return next();
    }

    res.render('page-template', {
      page,
      sections: page.sections || [], // Pass the sections here
      pageTitle: page.title,
      pageHeading: page.title,
      pageContent: page.content
    });
  } catch (error) {
    console.error('Error in /:pageName route:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/create-page', async (req, res) => {
  try {
    const { pageName, pageTitle, pageHeading, pageContent, themeId } = req.body;

    const sanitizedPageName = pageName.replace(/[^a-z0-9]/gi, '-').toLowerCase();

    // Create the page
    const newPage = new Page({
      name: sanitizedPageName,
      title: pageTitle,
      url: `/${sanitizedPageName}`,
      theme: themeId,
      content: pageContent,
      sections: []
    });

    const savedPage = await newPage.save();

    // Read template files
    const templatePath = path.resolve(__dirname, 'views', 'page-template.ejs');
    const layoutPath = path.resolve(__dirname, 'views', 'layouts', 'boilerplate.ejs');
    const navbarPath = path.resolve(__dirname, 'views', 'includes', 'navbar.ejs');
    const footerPath = path.resolve(__dirname, 'views', 'includes', 'footer.ejs');

    const [template, layoutContent, navbarContent, footerContent] = await Promise.all([
      fs.readFile(templatePath, 'utf-8'),
      fs.readFile(layoutPath, 'utf-8'),
      fs.readFile(navbarPath, 'utf-8'),
      fs.readFile(footerPath, 'utf-8')
    ]);

    // Create a mock Express response object
    const mockRes = {
      render: async (view, options) => {
        const pageContent = await ejs.render(template, {
          ...options,
          layout: (file) => layoutContent,
          include: (file) => {
            if (file === '../includes/navbar') return navbarContent;
            if (file === '../includes/footer') return footerContent;
            throw new Error(`Include file not found: ${file}`);
          },
          body: options.body || ''
        }, { async: true });

        return ejs.render(layoutContent, {
          body: pageContent,
          include: (file) => {
            if (file === '../includes/navbar') return navbarContent;
            if (file === '../includes/footer') return footerContent;
            throw new Error(`Include file not found: ${file}`);
          }
        }, { async: true });
      }
    };

    // Render the page content
    const renderedPage = await mockRes.render('page-template', {
      page: savedPage,
      sections: [],
      pageTitle,
      pageHeading,
      pageContent
    });

    const newPagePath = path.resolve(__dirname, 'views', `${sanitizedPageName}.ejs`);
    await fs.writeFile(newPagePath, renderedPage);

    const theme = await MenuItem.findById(themeId);

    res.json({
      success: true,
      message: 'Page created successfully',
      pageName: sanitizedPageName,
      url: `/${sanitizedPageName}`,
      themeName: theme.name
    });
  } catch (error) {
    console.error('Error creating page:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating page',
      error: error.message,
      errorCode: error.code
    });
  }
});


app.get('/page-list', async (req, res) => {
  try {
    const pages = await Page.find().sort({ createdAt: -1 });
    res.json({ success: true, pages });
  } catch (error) {
    console.error('Error listing pages:', error);
    res.status(500).json({ success: false, message: 'Error listing pages' });
  }

});

app.delete('/delete-page/:id', isAdmin, async (req, res) => {
  try {
    const page = await Page.findById(req.params.id);
    if (!page) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }

    // Delete the EJS file
    const filePath = path.resolve(__dirname, 'views', `${page.name}.ejs`);
    await fs.unlink(filePath);

    // Remove from database
    await Page.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Page deleted successfully' });
  } catch (error) {
    console.error('Error deleting page:', error);
    res.status(500).json({ success: false, message: 'Error deleting page' });
  }
});


// private theater images change route
// GET route to fetch current images
app.get('/admin/screen-images', async (req, res) => {
  let screens = await Screen.find();

  // If no screens in database, create default ones
  if (screens.length === 0) {
    const defaultScreens = [
      { screenId: 'screen1', image1Url: '/assets/img/ps-screen1-1.png', image2Url: '/assets/img/ps-screen1-2.png' },
      { screenId: 'screen2', image1Url: '/assets/img/ps-screen2-1.png', image2Url: '/assets/img/ps-screen2-2.png' }
    ];
    await Screen.insertMany(defaultScreens);
    screens = await Screen.find();
  }

  res.render('/private-theater', { screens });
});


// POST route to update images
app.post('/admin/update-screen-images', upload.fields([{ name: 'image1', maxCount: 1 }, { name: 'image2', maxCount: 1 }]), async (req, res) => {
  const { screenId } = req.body;
  const updateData = {};

  if (req.files['image1']) {
    updateData.image1Url = '/uploads/' + req.files['image1'][0].filename;
  }
  if (req.files['image2']) {
    updateData.image2Url = '/uploads/' + req.files['image2'][0].filename;
  }

  await Screen.findOneAndUpdate({ screenId }, updateData, { upsert: true });
  res.redirect('/admin-panel');
});









// admin panel code 
async function createDefaultAdminUsers() {
  try {
    // Check if any admin or manager users exist
    const existingAdmins = await User.find({ role: 'admin' });


    if (existingAdmins.length > 0) {
      console.log('Admin user already exist');
      return;
    }

    // Check if environment variables are set
    // if (!process.env.ADMIN_PASS || !process.env.ADMIN_EMAIL) {
    //     throw new Error('Environment variables MANAGER_PASS, ADMIN_PASS, and ADMIN_EMAIL must be set');
    // }




    const adminUser = new User({
      name: 'Admin User',
      email: "cutcorners.in@gmail.com",
      password: "test@123",
      role: 'admin'
    });

    await adminUser.save();

    console.log('Default admin created successfully');
  } catch (err) {
    console.error('Error creating default admin and manager users:', err);
  }
}
// Call the function to create the default admin users
// createDefaultAdminUsers(); 


app.get('/login', (req, res) => {
  const { successMessage, errorMessage } = req.flash();
  res.render('login', {
    successMessage,
    errorMessage,

  });
});

app.post(
  '/login',
  passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: true,
  }),
  (req, res) => {
    const { role } = req.user;
    if (role === 'admin') {
      res.redirect('/admin-panel'); // Redirect to admin panel
    } else {
      res.redirect('/login'); // Redirect to home page
    }
  }
);


app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Error during logout:', err);
    }
    res.redirect('/login');
  });
});



app.get('/forgot-password', (req, res) => {
  res.render('forgot-password');
});

app.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    req.flash('error', 'No account with that email address exists.');
    return res.redirect('/forgot-password');
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString(); // Generate OTP
  user.otp = otp;
  user.otpExpires = Date.now() + 3600000; // 1 hour
  await user.save();

  // Send OTP email (assuming you have a sendEmail function)
  await Templatesender(user.email, `Your OTP is ${otp}`, 'Password Reset');

  req.flash('success', 'An email has been sent to reset your password.');
  res.redirect('/verify-otp');
});


app.get('/verify-otp', (req, res) => {
  res.render('verify-otp');
});

app.post('/verify-otp', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    req.flash('error', 'No account with that email address exists.');
    return res.redirect('/verify-otp');
  }

  if (user.otp !== otp || Date.now() > user.otpExpires) {
    req.flash('error', 'OTP is invalid or has expired.');
    return res.redirect('/verify-otp');
  }

  user.password = newPassword;
  user.otp = undefined; // Clear OTP
  user.otpExpires = undefined; // Clear OTP expiry
  await user.save();

  req.flash('success', 'Your password has been reset.');
  res.redirect('/login');
});




// payment Gateway Setting

app.get('/pay', (req, res) => {
  
  
  res.render('payU-form');
  
});
const logger = console; // You might want to use a more robust logging solution in production

app.get('/payment/success', (req, res) => {
  logger.info('Payment success callback received');
  console.log('Success route hit:', new Date().toISOString());
  logger.info('Query parameters:', req.query);
  logger.info('Body:', req.body);
  const amount = req.query.amount;
  const email = req.query.email;
  const name = req.query.name;

  try {

    const htmlTemp = `
    <!DOCTYPE html>
 <html lang="en">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Shashi sales and marketing</title>

        <style>
._failed {
border-bottom: solid 4px red !important;
}

._failed i {
color: red !important;
}

.bl {
background-color: black;
}

.container {
width: 100%;
margin-top: 6rem;
display: flex;
align-items: center;
justify-content: center;
}


._success {
box-shadow: 0 15px 25px #00000019;
padding: 45px;
width: 100%;
text-align: center;
margin: 40px auto;
border-bottom: solid 4px #28a745;
}

._success i {
font-size: 55px;
color: #28a745;
}

._success h2 {
margin-bottom: 12px;
font-size: 40px;
font-weight: 500;
line-height: 1.2;
margin-top: 10px;
}

._success p {
margin-bottom: 20px;
font-size: 18px;
color: #495057;
font-weight: 500;
}
a{
color: blue;
font-size: 1.2rem;
font-weight: bold;
text-decoration: underline;

}
h3{
font-size: 1.5rem;
margin-bottom: 20px;
}
span{
font-size: 2rem;
color: #28a745;
}
@media screen and (max-width:400px) {
._success{
    padding: 20px;
    width: 95%;
}
}
</style>
</head>
<body>
<style>
._failed {
border-bottom: solid 4px red !important;
}

._failed i {
color: red !important;
}

.bl {
background-color: black;
}

.container {
width: 100%;
margin-top: 6rem;
display: flex;
align-items: center;
justify-content: center;
}


._success {
box-shadow: 0 15px 25px #00000019;
padding: 45px;
width: 100%;
text-align: center;
margin: 40px auto;
border-bottom: solid 4px #28a745;
}

._success i {
font-size: 55px;
color: #28a745;
}

._success h2 {
margin-bottom: 12px;
font-size: 40px;
font-weight: 500;
line-height: 1.2;
margin-top: 10px;
}

._success p {
margin-bottom: 20px;
font-size: 18px;
color: #495057;
font-weight: 500;
}
a{
color: blue;
font-size: 1.2rem;
font-weight: bold;
text-decoration: underline;

}
h3{
font-size: 1.5rem;
margin-bottom: 20px;
}
span{
font-size: 2rem;
color: #28a745;
}
</style>

<div class="container">
<div class="row justify-content-center">
<div class="col-md-5">
    <div class="message-box _success">
        <i class="fa fa-check-circle" aria-hidden="true"></i>
        <h2> Your payment was successful </h2>
        <h3>Amount paid: <span>₹${amount}</span></h3>
        <p> Thank you ${name} for your payment. we will <br>
            be in contact with more details shortly </p>
    </div>
</div>
</div>


</div>
</body>
</html>
`

    Templatesender(email, htmlTemp, "Payment confirmation from cutcorners");
    

    res.render('paymentsucess' , {
      amount
    });
  } catch (error) {
    logger.error('Error in success callback:', error);
    res.status(500).render('error', { message: 'An error occurred while processing your payment.' });
  }
});

app.post("/payment/success" , (req, res)=>{
  const amount = req.query.amount;
  const email = req.query.email;
  const name = req.query.name;
  res.redirect(`/payment/success?amount=${amount}&email=${email}&name=${name}`)
})


app.get('/payment/fail', (req, res) => {
  logger.info('Payment failure callback received');
  logger.info('Query parameters:', req.query);
  logger.info('Body:', req.body);

  try {
    res.render('paymentfail');
  } catch (error) {
    logger.error('Error in failure callback:', error);
    res.status(500).render('error', { message: 'An error occurred while processing your payment.' });
  }
});


app.post('/payment_gateway/payumoney', (req, res) => {
  logger.info('Payment initiation request received');
 

  try {
    const { amount, phone, email, name } = req.body;
    const txnid = 'txn' + Date.now(); // Generate a unique transaction ID
    const productinfo = "Test Product";
    amount = 550;
     

    logger.info('Payment details:', { amount, phone, email, name, txnid, productinfo });

    const hashString = `${MERCHANT_KEY}|${txnid}|${amount}|${productinfo}|${name}|${email}|||||||||||${MERCHANT_SALT}`;
    const sha = new jsSHA('SHA-512', "TEXT");
    sha.update(hashString);
    const hash = sha.getHash("HEX");

    console.log('Hash String:', hashString);
  console.log('MERCHANT_KEY:', MERCHANT_KEY);
  console.log('MERCHANT_SALT:', MERCHANT_SALT);

    const paymentData = {
      key: MERCHANT_KEY,
      txnid: txnid,
      amount: amount,
      productinfo: productinfo,
      firstname: name,
      email: email,
      phone: phone,
      surl: `https://cutcorners.in/payment/success?amount=${amount}&email=${email}&name=${name}`,
      // surl: `http://localhost:4000/payment/success?amount=${amount}&email=${email}&name=${name}`,
      furl: 'https://cutcorners.in/payment/fail',
      hash: hash,
      service_provider: 'payu_paisa',
    };

    logger.info('Sending request to PayU');

    request.post({
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      url: PAYU_BASE_URL,
      form: paymentData
    }, function (error, httpResponse, body) {
      if (error) {
        logger.error('Error in PayU request:', error);
        return res.status(500).send({ status: false, message: error.toString() });
      }

      logger.info('PayU response received', { statusCode: httpResponse.statusCode });

      if (httpResponse.statusCode === 200) {
        res.send(body);
      } else if (httpResponse.statusCode >= 300 && httpResponse.statusCode <= 400) {
        logger.info('Redirecting to:', httpResponse.headers.location);
        res.redirect(httpResponse.headers.location.toString());
      } else {
        logger.error('Unexpected status code:', httpResponse.statusCode);
        res.status(500).send({ status: false, message: 'Unexpected response from payment gateway' });
      }
    });

  
  } catch (error) {
    logger.error('Error in payment initiation:', error);
    res.status(500).send({ status: false, message: 'An error occurred while initiating the payment' });
  }
});




app.all("*", (req, res) => {
  res.render("error");
});



app.listen(4000, () => {
  console.log("listening on port 4000");
})