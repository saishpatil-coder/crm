const express = require('express');
const operatorController = require('../../controller/operator/serviceOperator.controller');
const authenticateJWT = require('../../middleware/authMiddleware');
const logMiddleware = require('../../middleware/logMiddleware');
const { configureMulter } = require('../../utility/upload.utility');


const serviceOperator = express.Router();

// Multer saves file temporarily — final storage is on S3 (public/operators/)
const destinationPath = 'uploads/temp';
const fileUpload = configureMulter(destinationPath).single('image');

const endpoints = {
	'/add-operator': '428fd54ea9e40f7c816b6ffc2887e35015ee539e',
	'/get-operator': '8a6bb5e0bc0e95eec947e2327b2278d137373901',
	'/get-mobile-operator': '922833daa96b124c3d9de9ba182ce9a69be0f11e',
	'/delete-operator': 'b3e1d7f2a94c6082ef5d4a1b3c7e9f08124ad653',
};


// ✅ Add Operator (hashed route — app facing)
serviceOperator.post(
	"/428fd54ea9e40f7c816b6ffc2887e35015ee539e",
	fileUpload,
	logMiddleware,
	async (req, res) => {
		try {
			await operatorController.addOperator(req, res);
		} catch (error) {
			console.error('Error requesting Add Operator:', error);
			if (!res.headersSent) {
				res.status(500).json({ error: 'Internal Server Error' });
			}
		}
	}
);

// ✅ Delete Operator (hashed route — soft delete by id)
serviceOperator.post(
	"/b3e1d7f2a94c6082ef5d4a1b3c7e9f08124ad653",
	logMiddleware,
	async (req, res) => {
		try {
			await operatorController.deleteOperator(req, res);
		} catch (error) {
			console.error('Error requesting Delete Operator:', error);
			if (!res.headersSent) {
				res.status(500).json({ error: 'Internal Server Error' });
			}
		}
	}
);

// ✅ Update Operator — S3 upload
serviceOperator.post('/update-operator', fileUpload, (req, res) => {
	operatorController.updateOperator(req, res);
});

serviceOperator.post('/8a6bb5e0bc0e95eec947e2327b2278d137373901', (req, res) => {

	operatorController.getOperator(req.body, res)
		.catch(error => {
			console.error('Error requesting Get Operator:', error);
			res.status(500).json({ error: 'Internal Server Error' });
		});
});

serviceOperator.post('/922833daa96b124c3d9de9ba182ce9a69be0f11e', logMiddleware, (req, res) => {

	operatorController.getOperatorTest(req.body, res)
		.then(data => res.json(data))
		.catch(error => {
			console.error('Error requesting Get Mobile Operator:', error);
			res.status(500).json({ error: 'Internal Server Error' });
		});
});



serviceOperator.post('/add-operator', fileUpload, async (req, res) => {
	// if (req.file.fileValidationError) {
	// 	// Handle file validation errors
	// 	return res.status(400).json({ status: 400, error: req.fileValidationError });
	// }
	const fileName = req.file.filename;
	operatorController.addOperator(fileName, req.body, res).then(data => res.json(data));
});

serviceOperator.post('/get-operator', (req, res) => {

	operatorController.getOperator(req.body, res).then(data => res.json(data));
});

serviceOperator.post('/get-mobile-operator', (req, res) => {

	operatorController.getOperatorTest(req.body, res).then(data => res.json(data));
});


serviceOperator.get('/get-operator-categories', async (req, res) => {
	operatorController.getOperatorCategories(req, res);
});
//
module.exports = serviceOperator;
