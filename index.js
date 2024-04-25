const express = require('express');
const bodyParser = require('body-parser');
const Category = require('./models/categoryModal');
const BlogPost = require('./models/blogPostModal');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());
// Add CORS middleware
app.use(cors());

// multer setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../public/images'));
    },
    filename: (req, file, cb) => {
        const name = Date.now() + '-' + file.originalname;
        // Attach the filename to the request object for later access
        req.uploadedFileName = path.join(__dirname, '../public/images', name);
        cb(null, name);
    }
});

// connect mongodb 
mongoose.connect('mongodb://localhost:27017/bloggy').then(() => {
    console.log("DB connected SuccessFuly");
}).catch(err => {
    console.log(err.message);
});


// filter for filtering multer file
const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
        cb(null, true);
    } else {
        cb(null, false);
    }
}

const upload = multer({
    storage: storage,
    fileFilter: fileFilter
});


// Define routes

// Route to fetch all blog posts
app.get('/api/posts', async (req, res) => {
    const posts = await BlogPost.find().populate('category');
    return res.status(200).json({
        success: 'true',
        blog: posts
    })
});

// Route to fetch all blog posts
app.get('/api/category', async (req, res) => {
    const posts = await Category.find();
    return res.status(200).json({
        success: 'true',
        blog: posts
    })
});

// Route to fetch a single blog post by ID
app.get('/api/posts/:id', async (req, res) => {
    const postId = req.params.id;

    try {
        const post = await BlogPost.findById(postId);

        // Check if the post was found
        if (!post) {
            return res.status(404).json({
                success: false,
                message: 'Blog post not found'
            });
        }

        // Return the post if it was found
        return res.status(200).json({
            success: true,
            blog: post
        });
    } catch (error) {
        // Log the error for debugging purposes
        console.error("Error fetching the blog post:", error);

        // Handle cases where the postId might be malformed
        if (error.kind === 'ObjectId') {
            return res.status(400).json({
                success: false,
                message: 'Invalid blog post ID format'
            });
        }

        // Return a general error message
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching the blog post'
        });
    }
});

// Route to create a new Category
app.post('/api/category', upload.none(), async (req, res) => {
    const { category: name, description } = req.body;
    const newCategory = new Category({
        name,
        description
    });

    const category = await newCategory.save();
    return res.status(200).json({
        success: true,
        category: category,
        message: "New Category Created"
    });
});

// Route to create a new blog post
app.post('/api/posts', upload.none(), (req, res) => {
    const { title, content, category } = req.body;

    // Validate the necessary inputs
    if (!title.trim() || !content.trim() || !category.trim()) {
        return res.status(400).json({
            success: false,
            message: "Missing or invalid required fields. Ensure title, content, and category are provided."
        });
    }

    // Sanitize the inputs here (if handling HTML/JS content)
    // Consider using a library like sanitize-html for content that contains HTML

    // Create a new blog post instance
    const newBlogPost = new BlogPost({
        title: title,
        content: content,
        category: category // Assuming `category` here is the ObjectId of the selected category
    });

    // Save the blog post to the database
    newBlogPost.save()
        .then(savedPost => {
            return res.status(201).json({ // Use 201 for successful creation
                success: true,
                post: savedPost,
                message: "New Blog Post Created Successfully"
            });
        })
        .catch(error => {
            console.error("Error saving blog post:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to create new blog post due to an internal error"
            });
        });
});
// Route to update an existing blog post by ID
app.put('/api/posts/:id', (req, res) => {
    const postId = req.params.id;
    const updatedPostData = req.body;
    // Logic to update an existing blog post in the CMS database
    // Example:
    // const updatedPost = await updatePostInCMS(postId, updatedPostData);
    // res.json(updatedPost);
});

// Route to delete a blog post by ID
app.delete('/api/posts/:id', (req, res) => {
    const postId = req.params.id;
    // Logic to delete a blog post by ID from the CMS database
    // Example:
    // const deletedPost = await deletePostFromCMS(postId);
    // res.json(deletedPost);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
