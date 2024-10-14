const express = require(`express`);
const bcrypt = require("bcrypt");
const app = express();
const mongoose = require('mongoose');


mongoose.connect('mongodb://127.0.0.1:27017/dashboard').then(() => {
    console.log("We are connected")
}).catch((error) => {
    console.log(error, "there is an error")
})

app.set("view engine", "ejs");  //set ejs som view engine, for å kunne bruke ejs filer

app.use(express.static("public")) //vis at public folder har statiske filer slik som css og bilder

app.use(express.json()) //for å sende data i forms fra frontend til backend

app.use(express.urlencoded({extended: true})) // forms

let saltRounds = 10;

const User = mongoose.model('User', { brukernavn: String, passord: String });
const Guide = mongoose.model('Guide', {title: String, tag: String, beskrivelse: String});

app.get(`/`, (req, res) => {
    res.render("index")
});
app.get(`/innlogging`, (req, res) => { //path
    res.render("innlogging") //file
});

app.post(`/innlogging`, (req, res) => { //path
    const { brukernavn, passord }= req.body
    User.findOne({brukernavn : brukernavn}).then((user) => {
        console.log (user)

        bcrypt.compare(passord, user.passord, function(err, result) {
            if(result) {
                res.status(200).redirect("/dashboard")

            } else {
                res.status(400).json("Bruker eller passord finnes ikke")
            }
        });

    })
});

app.get("/bruker", (req, res) => { 
    res.render("bruker")
})


app.get("/dashboard", (req, res) => { 


    Guide.find().then((guides) => {
        res.render("dashboard")
    })
})

app.post("/dashboard", (req, res) => {
    console.log(req.body)

    const { title, tag, beskrivelse } = req.body;

    if(title && tag && beskrivelse) {
        console.log("All fields have been received");
        const guide = new Guide({title, tag, beskrivelse})
        guide.save().then((result) => {
            console.log("guide saved", result)

            res.status(200);
        });
    }

})

app.get("/reset-password", (req, res) => {
    res.render("reset-password"); 
});

app.post("/reset-password", (req, res) => {
    const { brukernavn, newPassord, gjentapassord } = req.body;

    if (newPassord !== gjentapassord) {
        return res.status(400).json("Passordene samsvarer ikke.");
    }

    User.findOne({ brukernavn }).then((user) => {
        if (!user) {
            return res.status(404).json("Bruker ikke funnet.");
        }

        bcrypt.hash(newPassord, saltRounds, function(err, hash) {
            if (err) {
                return res.status(500).json("Feil ved hashing av passord.");
            }

            user.passord = hash;
            user.save().then(() => {
                console.log("Passord oppdatert.");
                res.status(200).redirect("/innlogging"); // Redirect back to the login page
            }).catch((error) => {
                console.error(error);
                res.status(500).json("Feil ved oppdatering av passord.");
            });
        });
    }).catch((error) => {
        console.error(error);
        res.status(500).json("Feil ved henting av bruker.");
    });
});



app.listen(4000, () => {
    console.log(`Server starter på port 4000`)
});
