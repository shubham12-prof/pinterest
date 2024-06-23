const express = require("express");
const router = express.Router();

const userModel = require("./users");
const postModel = require("./post");
const passport = require("passport");
const localStrategy = require("passport-local");
const upload = require("./multer");
const path = require('path');

// Initialize Passport
passport.use(new localStrategy(userModel.authenticate()));

// Middleware to check if user is authenticated
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/");
}

// Routes
router.get("/", (req, res) => {
  res.render("index", { nav: false });
});

router.get("/register", (req, res) => {
  res.render("register", { nav: false });
});

router.get("/profile", isLoggedIn, async (req, res, next) => {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user }).populate("posts");
    res.render("profile", { user, nav: true });
  } catch (err) {
    next(err);
  }
});

router.get("/feed", isLoggedIn, async (req, res, next) => {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });
    const posts = await postModel.find().populate("user");
    res.render("feed", { user, posts, nav: true });
  } catch (err) {
    next(err);
  }
});

router.get("/show/posts", isLoggedIn, async (req, res, next) => {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user }).populate("posts");
    res.render("show", { user, nav: true });
  } catch (err) {
    next(err);
  }
});

router.get("/add", isLoggedIn, async (req, res, next) => {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });
    res.render("add", { user, nav: true });
  } catch (err) {
    next(err);
  }
});

router.post("/createpost", isLoggedIn, upload.single("postimage"), async (req, res, next) => {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });

    const post = await postModel.create({
      user: user._id,
      title: req.body.title,
      description: req.body.description,
      image: req.file.filename,
    });

    user.posts.push(post._id);
    await user.save();

    res.redirect("/profile");
  } catch (err) {
    next(err);
  }
});

router.post("/fileupload", isLoggedIn, upload.single("image"), async (req, res, next) => {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });

    res.redirect("/profile");
  } catch (err) {
    next(err);
  }
});

router.post("/register", async (req, res, next) => {
  try {
    const data = new userModel({
      username: req.body.username,
      email: req.body.email,
      contact: req.body.contact,
      name: req.body.fullname,
    });

    userModel.register(data, req.body.password, (err, user) => {
      if (err) {
        console.error(err);
        return res.redirect("/register");
      }

      passport.authenticate("local")(req, res, () => {
        console.log("Authentication successful");
        res.redirect("/profile");
      });
    });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/profile",
    failureRedirect: "/",
  })
);

router.get("/logout", (req, res, next) => {
  req.logOut((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

// Serve favicon
router.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'favicon.ico'));
});

module.exports = router;
