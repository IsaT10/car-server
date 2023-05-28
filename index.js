const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require("mongodb");
const { ObjectId } = require("mongodb/lib/bson");
require("dotenv").config();

//middle wares
app.use(cors());
app.use(express.json());

//J3Siv0hRqm5INq7f carDbUser

console.log(process.env.DB_USER);
console.log(process.env.DB_PASSWORD);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.kfd97zi.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
// const verifyJWT = (req, res, next) => {
//   const authHeader = req.headers.authorization;
//   console.log(authHeader);
//   if (!authHeader) {
//     res.status(401)({ message: "unauthorized access" });
//   }
//   const token = authHeader.split(" ")[1];
//   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
//     if (err) {
//       res.status(401)({ message: "unauthorized access" });
//     }
//     req.decoded = decoded;
//     next();
//   });
// };

function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Firbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    const serviceCollections = client.db("carService").collection("services");
    const ordersCollections = client.db("carService").collection("orders");
    const productsCollections = client.db("carService").collection("products");

    app.get("/services", async (req, res) => {
      const query = {};
      const cursor = serviceCollections.find(query);
      const services = await cursor.toArray();
      res.send(services);
    });

    app.get("/services/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const service = await serviceCollections.findOne(query);
      res.send(service);
    });

    //products
    app.get("/products", async (req, res) => {
      const query = {};
      const cursor = productsCollections.find(query);
      const products = await cursor.toArray();
      res.send(products);
    });

    //orders
    app.get("/orders", verifyJWT, async (req, res) => {
      const decoded = req.decoded;
      console.log("inside api", decoded);
      if (decoded.email !== req.query.email) {
        return res.status(403).send({ message: "unauthorized access" });
      }

      let query = {};
      if (req.query.email) {
        query = {
          email: req.query.email,
        };
      }
      const cursor = ordersCollections.find(query);
      const orders = await cursor.toArray();
      res.send(orders);
    });

    app.post("/orders", async (req, res) => {
      const order = req.body;
      const result = await ordersCollections.insertOne(order);
      res.send(result);
    });

    //update
    app.patch("/orders/:id", async (req, res) => {
      const { id } = req.params;
      const status = req.body.status;
      const query = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          status: status,
        },
      };
      const result = await ordersCollections.updateOne(query, updatedDoc);
      res.send(result);
    });

    //delete
    app.delete("/orders/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await ordersCollections.deleteOne(query);
      res.send(result);
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

//jwt
app.post("/jwt", (req, res) => {
  const user = req.body;
  // console.log(user);
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1h",
  });
  res.send({ token });
});

app.get("/", (req, res) => {
  res.send("genius car server is running");
});

app.listen(port, () => {
  console.log(`Genius car server is running on ${port}`);
});
