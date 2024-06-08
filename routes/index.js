var express = require("express");
var router = express.Router();

const userModel = require("./users");
const postModel = require("./post");
const passport = require("passport");
const localStrategy = require("passport-local");
const upload = require("./multer");
const admin = require("firebase-admin");

var serviceAccount = require("./config/serviceAccountkey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://pinterest-authentication-default-rtdb.firebaseio.com",
});

const db = admin.database();

passport.use(new localStrategy(userModel.authenticate()));

// Middleware to check if user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/");
}

// Routes
router.get("/", (req, res, next) => {
  res.render("index", { nav: false });
});

router.get("/register", function (req, res, next) {
  res.render("register", { nav: false });
});
router.get("/profile", isLoggedIn, async function (req, res, next) {
  const user = await userModel
    .findOne({ username: req.session.passport.user })
    .populate("posts");
  res.render("profile", { user, nav: true });
});

router.get("/feed", isLoggedIn, async (req, res, next) => {
  try {
    const user = await userModel.findOne({ username: req.session.passport.user });
    const posts = await postModel.find().populate("user");

    const firebaseRef = db.ref("posts");
    const firebaseData = await firebaseRef.once("value");
    const firebasePosts = firebaseData.val();
    console.log("Firebase Posts:", firebasePosts);

    res.render("feed", { user, posts, firebasePosts, nav: true });
  } catch (err) {
    next(err);
  }
});

router.get("/show/posts", isLoggedIn, async (req, res, next) => {
  try {
    const user = await userModel
      .findOne({ username: req.session.passport.user })
      .populate("posts");
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

    const storageRef = admin.storage().ref();
    const imageRef = storageRef.child(`profile_images/${user.username}/${req.file.filename}`);
    await imageRef.put(req.file.buffer);
    user.profileImage = req.file.filename;
    await user.save();

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

    userModel.register(data, req.body.password, async (err, user) => {
      if (err) {
        console.error(err);
        return res.redirect("/register");
      }

      const firebaseUserRef = db.ref(`users/${user.username}`);
      firebaseUserRef.set({
        username: user.username,
        email: user.email,
        contact: user.contact,
        name: user.name,
      });

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

module.exports = router;
