import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as LocalStrategy } from "passport-local";
import pg from "pg";
import bcrypt from "bcrypt";
dotenv.config();
const app= express();
app.use(bodyParser.urlencoded({extended:true}));
const port=3000;

app.use(express.static("public"));
app.set("view engine", "ejs");
const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});
db.connect();
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.get("/",(req,res)=>{

    console.log("USER:",req.user);
    console.log("AUTH:",req.isAuthenticated());

    res.render("index.ejs",{
        loggedIn:req.isAuthenticated()
    });

});
app.get("/books",(req,res)=>{
    res.render("books")
});
app.get("/electronics",(req,res)=>{
    res.render("electronics")
});
app.get("/iot",(req,res)=>{
    res.render("iot")
});
app.get("/uniform",(req,res)=>{
    res.render("uniform")
});
app.get("/sell",(req,res)=>{
    res.render("sell")
});
app.get("/profile", (req, res) => {

    res.render("profile");

});
app.get("/messages", (req, res) => {

    res.render("message");

});
app.get("/wishlist", (req, res) => {

    res.render("wishlist");

});
app.get("/login",(req,res)=>{
    res.render("login", {
        message: null
    });
});
app.get("/register",(req,res)=>{
    res.render("register");
});
app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);
app.get(
  "/auth/google/secrets",
  passport.authenticate("google", {
    successRedirect: "/",
    failureRedirect: "/login",
  })
);
app.post("/login", (req, res, next) => {

    passport.authenticate("local", (err, user, info) => {

        if (err) {
            return next(err);
        }

        if (!user) {
            return res.render("login", {
                message: "Account not found. Please create an account first."
            });
        }

        req.login(user, (err) => {
            if (err) {
                return next(err);
            }

            res.redirect("/");
        });

    })(req, res, next);

});
app.post("/register", async(req,res)=>{

    const email = req.body.email;
    const password = req.body.password;

    const hashedPassword = await bcrypt.hash(password,10);

    const result = await db.query(
        "INSERT INTO user_information(email,password) VALUES($1,$2) RETURNING *",
        [email,hashedPassword]
    );

    const user = result.rows[0];

    req.login(user, (err)=>{
        if(err){
            console.log(err);
            return res.redirect("/login");
        }

        res.redirect("/");
    });

});
passport.use(
  "local",
  new LocalStrategy(
    {
      usernameField: "email"
    },
    async function verify(email, password, cb) {
         console.log("EMAIL:", email);
        console.log("PASSWORD:", password);
        try {
        const result = await db.query("SELECT * FROM user_information WHERE email = $1 ", [
            email,
        ]);
        if (result.rows.length > 0) {
            const user = result.rows[0];
            const storedHashedPassword = user.password;
            bcrypt.compare(password, storedHashedPassword, (err, valid) => {
            if (err) {
                console.error("Error comparing passwords:", err);
                return cb(err);
            } else {
                if (valid) {
                return cb(null, user);
                } else {
                return cb(null, false);
                }
            }
            });
        } else {
            return cb(null, false, { message: "Account not found. Please create an account first." });
        }
        } catch (err) {
        console.log(err);
        }
    })
    );
passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/auth/google/secrets",
      userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
    },
   async (accessToken, refreshToken, profile, cb) => {

    try {

        const email = profile.emails[0].value;

        const result = await db.query(
            "SELECT * FROM user_information WHERE email=$1",
            [email]
        );

        if(result.rows.length === 0){

            const newUser = await db.query(
                "INSERT INTO user_information(email,password) VALUES($1,$2) RETURNING *",
                [email,"google"]
            );

            return cb(null,newUser.rows[0]);

        }else{

            return cb(null,result.rows[0]);

        }

    } catch(err){
        return cb(err);
    }

}
  )
);
passport.serializeUser((user, cb)=>{
    cb(null, user.id);
});

passport.deserializeUser(async(id, cb)=>{
    try{
        const result = await db.query(
            "SELECT * FROM user_information WHERE id=$1",
            [id]
        );

        cb(null, result.rows[0]);

    }catch(err){
        cb(err);
    }
});
app.listen(port,()=>{
    console.log(`Server is running at port ${port}`)
});
