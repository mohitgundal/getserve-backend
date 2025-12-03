const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

// Load env vars
dotenv.config();

const seedAdmin = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        const adminEmail = 'admin@getserve.in';
        const adminPassword = 'adminpassword123';

        // Check if admin exists
        const userExists = await User.findOne({ email: adminEmail });

        if (userExists) {
            console.log('Admin user already exists');
            console.log(`Email: ${adminEmail}`);
            console.log('If you forgot the password, you may need to manually reset it or delete the user.');
            process.exit();
        }

        // Create admin user
        const user = await User.create({
            name: 'Admin User',
            email: adminEmail,
            password: adminPassword,
            role: 'admin',
            isVerified: true
        });

        console.log('Admin user created successfully');
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedAdmin();
