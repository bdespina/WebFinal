const fs = require('fs');
const os = require('os');
const path = require('path');
const { Op }  = require('sequelize');
const uuidv4 = require('uuid').v4;
const validators = require('../validators');
const helpers = require('../helpers');
const models = require('../models');

module.exports = {
  registerUser: function (body) {
    return new Promise(async (resolve, reject) => {
      if (!('email' in body)
        || !('username' in body)
        || !('password' in body)
        || !validators.register.email(body.email)
        || !validators.register.password(body.password)
      ) {
        reject({
          status: 'error',
          message: 'Invalid registration information'
        });

        return;
      }

      const user = models.user.build({
        email: body.email,
        username: body.username,
        password: body.password,
        role: 'user'
      });

      await user.save();

      resolve({
        status: 'ok',
        message: 'User created successfully'
      });
    });
  },
  loginUser: function (body) {
    return new Promise(async (resolve, reject) => {
      if (!('username' in body)
        || !('password' in body)
      ) {
        reject({
          status: 'error',
          message: 'Invalid login information'
        });

        return;
      }

      const user = await models.user.findOne({
        where: {
          [Op.and]: [
            { username: body.username },
            { password: body.password }
          ]
        }
      });

      if (user === null) {
        reject({
          status: 'error',
          message: 'Invalid login information'
        });

        return;
      }

      const isAdmin = user.role === 'admin';

      resolve({
        status: 'ok',
        message: 'User logged in successfully',
        isAdmin,
        userUuid: user.userUuid
      });
    });
  },
  handleUpload: function (req) {
    return new Promise(async (resolve, reject) => {
      if (!('file' in req)) {
        reject({
          status: 'error',
          message: 'No uploaded file'
        });
        return;
      }

      const parsedData = helpers.parseHarFile(req.file);

      if (parsedData === null) {
        reject({
          status: 'error',
          message: 'Failed to upload file'
        });
        return;
      }

      const geoResponse = await this.saveGeoUser(req);

      const uniqueServerIps = {};
      parsedData.forEach(o => {
        uniqueServerIps[o.serverIPAddress] = true;
      });

      const geoResponseServer = Object.keys(uniqueServerIps).map((o) => {
        return this.saveGeoServer(o);
      });

      Promise.allSettled(geoResponseServer).then(async(res) => {
        const uploadNameUuid = uuidv4();
        const data = parsedData.map((o) => {
          o.userUuid = req.session.userUuid;
          o.uploadName = `${uploadNameUuid}-${req.file.originalname}`;
          if (geoResponse.status === 'ok') {
            o.geo = geoResponse.data;
          }

          const geoObj = res.find(u => {
            return u.value.data.userIpAddress === o.serverIPAddress;
          });

          if (geoObj.value.status === 'ok') {
            o.serverLongtitude = geoObj.value.data.longtitude,
            o.serverLatitude = geoObj.value.data.latitude;
          }
          return o;
        });

        await models.har.bulkCreate(data);

        resolve({
          status: 'ok',
          message: 'File uploaded successfully'
        });
      }).catch(err => {
        reject({
          status: 'error',
          message: 'Failed to upload file'
        });
      });
    });
  },
  saveGeoUser: function (req) {
    return new Promise(async (resolve, reject) => {
      if (!('file' in req)) {
        reject({
          status: 'error',
          message: 'No uploaded file'
        });
        return;
      }

      helpers.getGeoData().then((response) => {
        resolve(response);
      }).catch((error) => {
        reject(error);
      });
    });
  },
  saveGeoServer: function (ip) {
    return new Promise(async (resolve, reject) => {
      helpers.getGeoData(ip).then((response) => {
        resolve(response);
      }).catch((error) => {
        reject(error);
      });
    });
  },
  getUserUploads: function(req) {
    return new Promise(async (resolve, reject) => {
      const hars = await models.har.findAll({
        where: {
          [Op.and]: [
            { userUuid: req.session.userUuid }
          ]
        }
      });

      if (hars === null) {
        reject({
          status: 'error',
          message: 'Error getting uploaded HARs'
        });
        return;
      }

      const files = [];
      hars.forEach(o => {
        if (files.indexOf(o.uploadName) < 0) {
          files.push(o.uploadName);
        }
      });

      resolve({
        status: 'ok',
        files
      });
    });
  },
  handleDownloadHar: function (req) {
    return new Promise(async (resolve, reject) => {
      if (!('filename' in req.body)) {
        reject({
          status: 'error',
          message: 'Malformed request'
        });
        return;
      }

      const filename = req.body.filename;
      const hars = await models.har.findAll({
        where: {
          [Op.and]: [
            { uploadName: filename }
          ]
        }
      });

      const data = [];
      hars.forEach(o => {
        delete o.userUuid;
        delete o.uploadName;
        data.push(o);
      });

      const tempDownloadFile = path.join(os.tmpdir(), filename);
      fs.writeFileSync(tempDownloadFile, JSON.stringify(hars, null, 2));

      resolve({
        status: 'ok',
        path: tempDownloadFile,
        filename
      });
    });
  },
  updateUsername: function (body) {
    const oldusername = body.oldusername;
    const newusername = body.newusername;
    const curpassword = body.curpassword;
    return new Promise(async (resolve, reject) => {
      if (!('oldusername' in body)
        || !('curpassword' in body)) {
        reject({
          status: 'error',
          message: 'Invalid request'
        });
        return;
      }

      await models.user.update({ username: newusername }, {
        where: {
          [Op.and]: [
            { username: oldusername },
            { password: curpassword }

          ]
        }
      }).catch(error => {
        reject({
          status: 'error',
          message: error.message

        });
      });

      resolve({
        status: 'ok',
        message: 'Username updated successfully'
      });
    });
  },
  updatePassword: function (body) {
    const username = body.username;
    const oldpassword = body.oldpassword;
    const newpassword = body.newpassword;
    const repnewpassword = body.repnewpassword;
    return new Promise(async (resolve, reject) => {
      if (!('oldpassword' in body)
        || !('username' in body)
        || !validators.register.password(newpassword)
        || (newpassword !== repnewpassword)) {
        reject({
          status: 'error',
          message: 'Invalid request'
        });
        return;
      }

      await models.user.update({ password: newpassword }, {
        where: {
          [Op.and]: [
            { username: body.username },
            { password: oldpassword }
          ]
        }
      }).catch(error => {
        reject({
          status: 'error',
          message: error.message
        });
      });

      resolve({
        status: 'ok',
        message: 'Password updated successfully'
      });
    });
  },
  userStats: function (session) {
    return new Promise(async (resolve, reject) => {
      if (!('userUuid' in session)) {
        reject({
          status: 'error',
          message: 'Invalid request'
        });
        return;
      }

      const latestHar = await models.har.findAll({
        where: {
          [Op.and]: [
            { userUuid: session.userUuid }
          ]
        },
        order: [['createdAt', 'DESC']]
      }).catch(error => {s
        reject({
          status: 'error',
          message: error.message
        })
      });

      resolve({
        status: 'ok',
        lastUpload: latestHar.length > 0 ? latestHar[0].createdAt : '-',
        totalRecords: latestHar.length,
        data: latestHar.map(o => {
          return {
            contentType: o.response.headers.contentType,
            serverIPAddress: o.serverIPAddress,
            latitude: o.serverLatitude,
            longtitude: o.serverLongtitude
          };
        })
      });
    }).catch(() => {
      reject({
        status: 'error',
        message: 'Failed to fetch all geo data'
      });
    });
  },
  totalUsers: function (session) {
    return new Promise(async (resolve, reject) => {
      if (!('userUuid' in session)) {
        reject({
          status: 'error',
          message: 'Invalid request'
        });
        return;
      }

      const numUsers = await models.user.findAll({
        where: {
          [Op.and]: [
            { role: 'user' }
          ]
        },
      })
      .catch(error => {
        reject({
          status: 'error',
          message: error.message
        })
      });

      resolve({
        status: 'ok',
        totalUsers: numUsers.length
      });
    });
  },
  countMethods: function (session) {
    return new Promise(async (resolve, reject) => {
      if (!('userUuid' in session)) {
        reject({
          status: 'error',
          message: 'Invalid request'
        });
        return;
      }
      const hars = await models.har.findAll()
        .catch(error => {
        reject({
          status: 'error',
          message: error.message
        })
      });

      const stats = helpers.findStats(hars);

      resolve({
        status: 'ok',
        stats
      });
    });
  }
};
