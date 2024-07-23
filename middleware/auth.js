module.exports = {
    ensureAuthenticated: function (req, res, next) {
      if (req.isAuthenticated()) {
        // Check user's role
        if (req.user.role === 'admin') {
          return next(); // Allow access to authenticated admin users
        } else if (req.user.role === 'visitor') {
          // Redirect to visitor panel or desired route
          return res.redirect('/');
        } else {
          // Handle invalid role
          return res.redirect('/login');
        }
      }
      // If not authenticated, redirect to login page
      res.redirect('/login');
    },
  };