const express = require("express");
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();
const app = express();
app.use(express.json());

const WORDPRESS_USERS_API_URL = process.env.WORDPRESS_USERS_API_URL;
const WORDPRESS_AUTH_TOKEN_API_URL = process.env.WORDPRESS_AUTH_TOKEN_API_URL;
const WORDPRESS_ADMIN_USERNAME = process.env.WORDPRESS_ADMIN_USERNAME;
const WORDPRESS_ADMIN_PASSWORD = process.env.WORDPRESS_ADMIN_PASSWORD;
const WOOCOMMERCE_CONSUMER_KEY = process.env.WOOCOMMERCE_CONSUMER_KEY;
const WOOCOMMERCE_CONSUMER_SECREAT = process.env.WOOCOMMERCE_CONSUMER_SECREAT;
const WEBSITE_URL = process.env.WEBSITE_URL;

app.get("/", (req, res) => {
  res.send({ msg: "Home Page" });
});

const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;

const WooCommerce = new WooCommerceRestApi({
  url: WEBSITE_URL,
  consumerKey: WOOCOMMERCE_CONSUMER_KEY,
  consumerSecret: WOOCOMMERCE_CONSUMER_SECREAT,
  version: "wc/v3",
});

// Register User
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const authResponse = await axios.post(WORDPRESS_AUTH_TOKEN_API_URL, {
      username: WORDPRESS_ADMIN_USERNAME,
      password: WORDPRESS_ADMIN_PASSWORD,
    });

    const authToken = authResponse.data.token;

    const response = await axios.post(
      WORDPRESS_USERS_API_URL,
      { username, email, password },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    res.send({ message: "User registered successfully", data: response.data });
  } catch (error) {
    console.error("Error registering user:", error.response.data);
    res.send({
      message: "User Registration Failed",
      error: error.response.data,
    });
  }
});

// Login User
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const authResponse = await axios.post(WORDPRESS_AUTH_TOKEN_API_URL, {
      username,
      password,
    });

    const authToken = authResponse.data.token;
    const userdata = authResponse.data;
    res.send({ data: userdata });
  } catch (error) {
    console.error("Error logging in:", error.response.data);
    res.send({ message: "Login failed", error: error.response.data });
  }
});

// Route to update a user by ID
app.patch("/users/update/:id", async (req, res) => {
  const userId = req.params.id;
  const { username, email, password } = req.body;

  const updatedUserData = {
    username,
    email,
    password
  };

  try {
    const authResponse = await axios.post(WORDPRESS_AUTH_TOKEN_API_URL, {
      username: WORDPRESS_ADMIN_USERNAME,
      password: WORDPRESS_ADMIN_PASSWORD,
    });

    const authToken = authResponse.data.token;

    const response = await axios.patch(`${WORDPRESS_USERS_API_URL}/${userId}`, updatedUserData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    res.send(response.data);
  } catch (error) {
    console.error("Error updating user:", error.response.data);
    res.send({
      message: "Error Updating User",
      error: error.response.data,
    });
  }
});

// Route to delete a user by ID
app.delete("/users/delete/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    const authResponse = await axios.post(WORDPRESS_AUTH_TOKEN_API_URL, {
      username: WORDPRESS_ADMIN_USERNAME,
      password: WORDPRESS_ADMIN_PASSWORD,
    });

    const authToken = authResponse.data.token;
    const response = await axios.delete(`${WORDPRESS_USERS_API_URL}/${userId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    res.send(response.data);
  } catch (error) {
    console.error("Error deleting user:", error.response.data);
    res.send({
      message: "Error Deleting User",
      error: error.response.data,
    });
  }
});


// Fetching All the Users Data
app.get("/users", async (req, res) => {
  try {
    const response = await axios.get(WORDPRESS_USERS_API_URL);
    res.send(response.data);
  } catch (error) {
    res.send({
      message: "Error Fetching Wordpress All Users",
      error: error.response.data,
    });
  }
});

// Fetching Single User
app.get("/users/:id", async (req, res) => {
  const userId = req.params.id;
  console.log("userID : ", userId);
  console.log("URL : ", `${WORDPRESS_USERS_API_URL}/${userId}`);

  try {
    const authResponse = await axios.post(WORDPRESS_AUTH_TOKEN_API_URL, {
      username: WORDPRESS_ADMIN_USERNAME,
      password: WORDPRESS_ADMIN_PASSWORD,
    });

    const authToken = authResponse.data.token;
    const response = await axios.get(`${WORDPRESS_USERS_API_URL}/${userId}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    console.log("Getting Response : ", response);
    res.send(response.data);
  } catch (error) {
    console.error("Error fetching WordPress user:", error);
    res.send({
      message: "Error Fetching to Single User",
      error: error.response.data,
    });
  }
});

// Getting the All Products

app.get("/products", async (req, res) => {
  try {
    const response = await WooCommerce.get("products");
    res.send(response.data);
  } catch (error) {
    console.error("Error fetching products:", error.response.data);
    res.status(500).send({
      message: "Error Fetching Products",
      error: error.response.data,
    });
  }
});

// Getting the Single Product

app.get("/products/:id", async (req, res) => {
  let productID = req.params.id;

  try {
    const response = await WooCommerce.get(`products/${productID}`);
    res.send(response.data);
  } catch (error) {
    console.error("Error fetching products:", error.response.data);
    res.status(500).send({
      message: "Error Fetching Products",
      error: error.response.data,
    });
  }
});

// Route to add a new product
app.post("/products/add", async (req, res) => {
  const { name, price, description, sku } = req.body;

  const newProductData = {
    name,
    regular_price: price,
    description,
    sku,
  };

  try {
    const response = await WooCommerce.post("products", newProductData);
    res.send({
      message: "Product is Added Successfully",
      productAddedInfo: response.data,
    });
  } catch (error) {
    console.error("Error adding product:", error.response.data);
    res.send({
      message: "Error Adding Product",
      error: error.response.data,
    });
  }
});

// Route to update a product by ID
app.patch("/products/update/:id", async (req, res) => {
  const productId = req.params.id;
  const { name, price, description, sku } = req.body;

  const updatedProductData = {
    name,
    regular_price: price,
    description,
    sku,
  };

  try {
    const response = await WooCommerce.patch(
      `products/${productId}`,
      updatedProductData
    );
    res.send({
      message: "Product is Updated Successfully",
      productUpdatedInfo: response.data,
    });
  } catch (error) {
    console.error("Error updating product:", error.response.data);
    res.send({
      message: "Error Updating Product",
      error: error.response.data,
    });
  }
});

// Route to delete a product by ID
app.delete("/products/delete/:id", async (req, res) => {
  const productId = req.params.id;
  try {
    const response = await WooCommerce.delete(`products/${productId}`, { force: true });
    res.send({message : "Product is Deleted Successfully", productDeletedInfo : response.data});
  } catch (error) {
    console.error("Error deleting product:", error.response.data);
    res.send({
      message: "Error Deleting Product",
      error: error.response.data,
    });
  }
});

// Running the Server on Port 4500

app.listen(4500, () => {
  console.log("Server is Running on Port 4500");
});
