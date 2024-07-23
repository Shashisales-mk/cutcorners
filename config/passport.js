const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

// Passport Local Strategy
passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        console.log('Received email:', email);
        console.log('Received password:', password);

        const user = await User.findOne({ email });

        if (!user) {
          console.log('User not found:', email);
          return done(null, false, { message: 'Invalid email or password' });
        }

        console.log('User found:', user);
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
          console.log('Incorrect password for user:', user);
          return done(null, false, { message: 'Invalid email or password' });
        }

        console.log('Authentication successful for user:', user);
        return done(null, user);
      } catch (err) {
        console.error('Error during authentication:', err);
        return done(err);
      }
    }
  )
);
// Serialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;