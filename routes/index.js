const express = require('express');
const router = express.Router();
const services = require('../services');

const multer = require('multer');
const upload = multer({ dest: './uploads' });

/* GET home page. */
router.get('/', function(req, res, next) {
  res.redirect('/login');
});

router.get('/register', function(req, res, next) {
  res.render('register', { title: 'Register' });
});

router.post('/register', function(req, res, next) {
  services.registerUser(req.body).then(done => {
    res.redirect('/login');
  }).catch(error => {
    res.json(error);
  });
});

router.get('/login', function(req, res, next) {
  res.render('login', { title: 'Login' });
});

router.post('/login', function(req, res, next) {
  services.loginUser(req.body).then(done => {
    req.session.isAuthenticated = true;
    req.session.isAdmin = done.isAdmin;
    req.session.userUuid = done.userUuid;
    res.redirect('/dashboard');
  }).catch(error => {
    res.json(error);
  });
});

router.get('/logout', function(req, res, next) {
  req.session.isAuthenticated = false;
  res.redirect('/login');
});

router.get('/dashboard', function(req, res, next) {
  if (!req.session.isAuthenticated) {
    res.redirect('/login');
    return;
  }

  if (req.session.isAdmin) {
    res.render('dashboard', {
      title: 'Admin dashboard',
      isAdmin: req.session.isAdmin
    });
    return;
  }

  services.getUserUploads(req).then(done => {
    res.render('dashboard', {
      title: 'Dashboard',
      isAdmin: req.session.isAdmin,
      files: done.files
    });
  }).catch(error => {
    res.render('dashboard', {
      title: 'Dashboard',
      isAdmin: req.session.isAdmin,
      files: []
    });
  });
});

router.post('/har_upload', upload.single('har_upload'), function (req, res, next) {
  if (!req.session.isAuthenticated) {
    res.json({
      status: 'error',
      message: 'Unauthorized user'
    });
    return;
  }

  services.handleUpload(req).then(done => {
    res.redirect('/dashboard');
  }).catch(error => {
    res.redirect('/dashboard');
  });
});

router.post('/har_download', function (req, res, next) {
  if (!req.session.isAuthenticated) {
    res.json({
      status: 'error',
      message: 'Unauthenticated request'
    })
    return;
  }

  services.handleDownloadHar(req).then(done => {
    res.download(done.path, done.filename);
  }).catch(error => {
    res.json(error);
  });
});

router.post('/update_username', function (req, res, next) {
  if (!req.session.isAuthenticated) {
    res.json({
      status: 'error',
      message: 'Unauthenticated request'
    })
    return;
  }

  services.updateUsername(req.body).then(done => {
    res.redirect('/dashboard');
  }).catch(error => {
    res.json(error);
  });
});

router.post('/update_password', function (req, res, next) {
  if (!req.session.isAuthenticated) {
    res.json({
      status: 'error',
      message: 'Unauthenticated request'
    })
    return;
  }

  services.updatePassword(req.body).then(done => {
    res.redirect('/dashboard');
  }).catch(error => {
    res.json(error);
  });
});

router.get('/user_stats', function (req, res, next) {
  if (!req.session.isAuthenticated) {
    res.json({
      status: 'error',
      message: 'Unauthenticated request'
    })
    return;
  }

  services.userStats(req.session).then(done => {
    res.json(done);
  }).catch(error => {
    res.json(error);
  });
});

router.get('/total_users', function (req, res, next) {
  if (!req.session.isAuthenticated || !req.session.isAdmin) {
    res.json({
      status: 'error',
      message: 'Unauthenticated request'
    })
    return;
  }

  services.totalUsers(req.session).then(done => {
    res.json(done);
  }).catch(error => {
    res.json(error);
  });
});

router.get('/admin_stats', function (req, res, next) {
  if (!req.session.isAuthenticated) {
    res.json({
      status: 'error',
      message: 'Unauthenticated request'
    })
    return;
  }

  services.countMethods(req.session).then(done => {
    res.json(done);
  }).catch(error => {
    res.json(error);
  });
});

module.exports = router;
