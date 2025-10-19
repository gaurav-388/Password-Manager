const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5003;

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

// MongoDB Connection (replace with your connection string)
const uri = process.env.MONGO_URI || "mongodb+srv://gauravgarg18:Garg12345@cluster0.7kgmbvo.mongodb.net/";

mongoose.connect(uri)
  .then(() => console.log("MongoDB database connection established successfully"))
  .catch(err => console.log(err));

// API Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/credentials', require('./routes/credentials'));

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});