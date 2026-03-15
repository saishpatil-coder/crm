const { connect, baseurl } = require("../../config/db.config");
//const logger = require('../../logger/api.logger');
const { secretKey } = require("../../middleware/config");
const { QueryTypes, Sequelize, Model, DataTypes, Op } = require("sequelize");
const jwt = require("jsonwebtoken");
const utility = require("../../utility/utility");
//const helper = require('../utility/helper');
const pino = require("pino");
const { paginate } = require("../../utility/pagination.utility");
const logger = pino({ level: "info" }, process.stdout);

const uploadFileToS3 = require("../../utility/s3Upload.utility"); // ✅ S3 uploader

const crypto = require("crypto");
const redisSession = require("../../utility/redis.session.utility");

require("dotenv").config();
// const baseUrl = process.env.API_BASE_URL;
// const baseUrl ='https://apis.mayway.in/';

class ServicesOperator {
  db = {};

  constructor() {
    this.db = connect();
  }

  async addOperator(req, res) {
    let t;

    try {
      const { operator_name, description, category, biller_id } = req.body;
      const uploadedFile = req.file;

      console.log("📥 Incoming Body:", req.body);
      console.log("📸 Uploaded File:", req.file);

      if (!uploadedFile) {
        return res
          .status(400)
          .json({ status: 400, message: "Image is required" });
      }

      // ✅ Upload to S3 under public/operators/{category}/
      const s3Result = await uploadFileToS3.uploadOperatorImage(
        uploadedFile,
        category || "default",
      );
      const imageUrl = s3Result.downloadUrl; // permanent public URL

      t = await this.db.sequelize.transaction();

      const existing = await this.db.serviceOperator.findOne({
        where: { operator_name, status: 1 },
      });

      if (existing) {
        await t.rollback();
        return res
          .status(400)
          .json({ status: 400, message: "Operator already exists" });
      }

      const operatorData = {
        operator_name,
        description,
        category,
        image: imageUrl, // ✅ S3 public URL
        status: 1,
        biller_id,
      };

      const newOperator = await this.db.serviceOperator.insertData(
        operatorData,
        {
          validate: true,
          transaction: t,
        },
      );

      await t.commit();

      return res.status(201).json({
        status: 201,
        message: "Operator added successfully",
        data: newOperator,
      });
    } catch (error) {
      if (t) await t.rollback();
      return res.status(500).json({
        status: 500,
        message: "Failed to add operator",
        error: error.message,
      });
    }
  }

  async updateOperator(req, res) {
    let t;

    try {
      console.log("📥 Incoming Update Request Body:", req.body);
      console.log("📸 Uploaded File:", req.file);

      const { id, operator_name, description, category, status } = req.body;
      const uploadedFile = req.file;

      t = await this.db.sequelize.transaction();

      // Fetch existing operator
      const operator = await this.db.serviceOperator.findOne({
        where: { id},
      });

      console.log("🔍 Existing Operator Data:", operator?.dataValues);

      if (!operator) {
        await t.rollback();
        return res
          .status(404)
          .json({ status: 404, message: "Operator not found" });
      }

      // Duplicate name check
      if (operator_name) {
        console.log(
          `🔎 Checking duplicate for operator_name: ${operator_name}`,
        );

        const exists = await this.db.serviceOperator.findOne({
          where: {
            operator_name,
            status: { [Op.in]: [1, 2] }, // active or inactive
            id: { [Op.ne]: id }, // FIXED: Using Op directly to prevent 500 error
          },
        });

        if (exists) {
          console.log("⚠ Duplicate name found:", exists.operator_name);
          await t.rollback();
          return res
            .status(400)
            .json({ status: 400, message: "Operator name already exists" });
        }
      }

      const updateData = {
        operator_name: operator_name || operator.operator_name,
        description: description || operator.description,
        category: category || operator.category,
      };

      // ✅ Allow status update (0 = inactive, 1 = active)
      if (status !== undefined && status !== null && status !== "") {
        updateData.status = parseInt(status);
      }

      // ✅ If new image uploaded — upload to S3 (old S3 key is just orphaned, no need to delete)
      if (uploadedFile) {
        const 
        
        Category = updateData.category;
        const s3Result = await uploadFileToS3.uploadOperatorImage(
          uploadedFile,
          resolvedCategory,
        );
        updateData.image = s3Result.downloadUrl; // ✅ S3 public URL
        console.log("🆕 New S3 Image URL:", updateData.image);
      }

      console.log("📦 Final Update Data:", updateData);

      await this.db.serviceOperator.update(updateData, {
        where: { id },
        transaction: t,
      });

      await t.commit();

      console.log("✅ Operator Updated Successfully");

      return res.status(200).json({
        status: 200,
        message: "Operator updated successfully",
        data: updateData,
      });
    } catch (error) {
      if (t) await t.rollback();

      console.error("❌ Error in updateOperator:", error);

      return res.status(500).json({
        status: 500,
        message: "Failed to update operator",
        error: error.message,
      });
    }
  }

  async getOperator(req, res) {
    try {
      // Decrypt Request
      //  console.log("req.body ", req.body);
      const decryptedObject = utility.DataDecrypt(req.encReq);
      console.log("This is the decryptedObject ", decryptedObject);
      const { category, user_id, page } = decryptedObject;

      const pagecount = page ? parseInt(page) : 1;
      let orderExtension = [];
      let getOperator = [];

      // ===============================
      // REDIS CACHE CHECK (Following Flight Pattern)
      // ===============================

      // Generate cache key from request params
      const cacheKey = `operator_list:${crypto
        .createHash("md5")
        .update(JSON.stringify({ category, page: pagecount }))
        .digest("hex")}`;

      // Try to get from Redis cache
    //   const cached = await redisSession.getSearchSession(cacheKey);
    //   if (cached) {
    //     console.log("✅ Returning operator list from Redis cache");
    //     return res.status(200).json(
    //       utility.DataEncrypt(
    //         JSON.stringify({
    //           ...cached,
    //           fromCache: true,
    //         }),
    //       ),
    //     );
    //   }

      // ===============================
      // USER CIRCLE BASED SORTING
      // ===============================
      if (user_id) {
        const userRow = await this.db.user.findOne({
          where: { id: user_id },
          attributes: ["circle"],
        });

        if (userRow?.circle) {
          orderExtension.push([
            Sequelize.literal(
              `(CASE WHEN location = '${userRow.circle}' THEN 0 ELSE 1 END)`,
            ),
            "ASC",
          ]);
        }
      }

      // ===============================
      // CATEGORY VALIDATION
      // ===============================
      if (!category) {
        return res.status(400).json({
          status: 400,
          message: "category is required",
          data: [],
        });
      }

      // ===============================
      // FETCH OPERATORS (FILTERED)
      // ===============================
      const whereClause = {
        // status: 1,
        category: category,
      };

      const paginatedResult = await paginate(this.db.serviceOperator, {
        whereClause,
        order: orderExtension,
        page: pagecount,
        pageSize: 100,
      });

      getOperator = paginatedResult.data;

      // ===============================
      // RESPONSE MAPPING
      // ===============================
      const getOperatorWithPath = getOperator.map((operator) => ({
        id: operator.id,
        operator_name: operator.operator_name,
        image: operator.image,
        category: operator.category,
        description: operator.description,
        status: operator.status,
        biller_id: operator.biller_id,
      }));

      // ===============================
      // STATIC DATA
      // ===============================
      const circle = [
        "Andhra Pradesh & Telangana",
        "Assam",
        "Bihar & Jharkhand",
        "Chennai",
        "Delhi & NCR",
        "Gujarat",
        "Haryana",
        "Himachal Pradesh",
        "Jammu & Kashmir",
        "Karnataka",
        "Kerala",
        "Kolkata",
        "Madhya Pradesh & Chhattisgarh",
        "Maharashtra & Goa",
        "Mumbai",
        "North East",
        "Odissa",
        "Punjab",
        "Rajasthan",
        "Tamil Nadu",
        "UP East",
        "UP West",
        "West Bengal",
      ];

      const circle2 = [
        { circleId: 1, circleName: "Andhra Pradesh & Telangana" },
        { circleId: 2, circleName: "Assam" },
        { circleId: 3, circleName: "Bihar & Jharkhand" },
        { circleId: 4, circleName: "Chennai" },
        { circleId: 5, circleName: "Delhi & NCR" },
        { circleId: 6, circleName: "Gujarat" },
        { circleId: 7, circleName: "Haryana" },
        { circleId: 8, circleName: "Himachal Pradesh" },
        { circleId: 9, circleName: "Jammu & Kashmir" },
        { circleId: 10, circleName: "Karnataka" },
        { circleId: 11, circleName: "Kerala" },
        { circleId: 12, circleName: "Kolkata" },
        { circleId: 13, circleName: "Madhya Pradesh & Chhattisgarh" },
        { circleId: 14, circleName: "Maharashtra & Goa" },
        { circleId: 15, circleName: "Mumbai" },
        { circleId: 16, circleName: "North East" },
        { circleId: 17, circleName: "Odissa" },
        { circleId: 18, circleName: "Punjab" },
        { circleId: 19, circleName: "Rajasthan" },
        { circleId: 20, circleName: "Tamil Nadu" },
        { circleId: 21, circleName: "UP East" },
        { circleId: 22, circleName: "UP West" },
        { circleId: 23, circleName: "West Bengal" },
      ];

      const rechargeType = [
        { rechargeTypeId: 1, rechargeType: "Top-up" },
        { rechargeTypeId: 3, rechargeType: "Full Talktime" },
        { rechargeTypeId: 4, rechargeType: "SMS" },
        { rechargeTypeId: 5, rechargeType: "2G Data" },
        { rechargeTypeId: 6, rechargeType: "3G Data" },
        { rechargeTypeId: 8, rechargeType: "4G Data" },
        { rechargeTypeId: 9, rechargeType: "Local" },
        { rechargeTypeId: 10, rechargeType: "STD" },
        { rechargeTypeId: 11, rechargeType: "ISD" },
        { rechargeTypeId: 13, rechargeType: "Roaming" },
        { rechargeTypeId: 14, rechargeType: "Other" },
        { rechargeTypeId: 16, rechargeType: "Validity" },
        { rechargeTypeId: 17, rechargeType: "Plan" },
        { rechargeTypeId: 18, rechargeType: "FRC" },
      ];

      // ===============================
      // PREPARE RESPONSE (ORIGINAL FORMAT - DO NOT CHANGE)
      // ===============================
      const responseData = {
        status: 200,
        message: "success",
        data: getOperatorWithPath,
        circle,
        circle2,
        rechargeType,
        fromCache: false,
      };

      // ===============================
      // STORE IN REDIS (0 TTL)
      // ===============================
      await redisSession.setSearchSession(cacheKey, responseData, 2592000);
      console.log("💾 Stored operator list in Redis cache");

      // ===============================
      // RETURN (ORIGINAL FORMAT FOR BACKWARD COMPATIBILITY)
      // ===============================
      return res
        .status(200)
        .json(utility.DataEncrypt(JSON.stringify(responseData)));
    } catch (err) {
      console.error("Operator API Error:", err);
      return res.status(500).json(
        utility.DataEncrypt(
          JSON.stringify({
            status: 500,
            message: err.message,
            data: [],
          }),
        ),
      );
    }
  }

  async getOperatorTest(req, res) {
    try {
      const decryptedObject = utility.DataDecrypt(req.body.encReq);
      // const decryptedObject = req
      // console.log("decryptedObject are: ", decryptedObject)
      const { category } = decryptedObject;

      // return decryptedObject;

      const requiredKeys = 
      Object.keys({ category });
      let getOperator = [];

      if (
        !requiredKeys.every(
          (key) =>
            key in decryptedObject &&
            decryptedObject[key] !== "" &&
            decryptedObject[key] !== undefined,
        )
      ) {
        getOperator = await this.db.serviceOperator.getAllData();
      } else {
        getOperator = await this.db.serviceOperator.getDataWithClause(category);
      }

      let getOperatorWithPath = getOperator.map((operator) => {
        return {
          id: operator.id,
          operator_name: operator.operator_name,
          image: baseurl + operator.image,
          category: operator.category,
          description: operator.description,
          status: operator.status,
          biller_id: operator.biller_id,
        };
      });

      const circle = [
        "Andhra Pradesh & Telangana",
        "Assam",
        "Bihar & Jharkhand",
        "Chennai",
        "Delhi & NCR",
        "Gujarat",
        "Haryana",
        "Himachal Pradesh",
        "Jammu Kashmir",
        "Karnataka",
        "Kerala",
        "Kolkata",
        "Madhya Pradesh & Chhattisgarh",
        "Maharashtra Goa",
        "Mumbai",
        "North East",
        "Odissa",
        "Punjab",
        "Rajasthan",
        "Tamil Nadu",
        "UP East",
        "UP West",
        "West Bengal",
      ];
      //return res.status(200).json({ status: 200, message: 'success', data: getOperatorWithPath, circle: circle });
      return res.status(200).json(
        utility.DataEncrypt(
          JSON.stringify({
            status: 200,
            message: "success",
            data: getOperatorWithPath,
            circle: circle,
          }),
        ),
      );
    } catch (err) {
      logger.error(`Unable to find : ${err}`);
      if (err.name === "SequelizeValidationError") {
        const validationErrors = err.errors.map((err) => err.message);
        return res
          .status(500)
          .json(
            utility.DataEncrypt(
              JSON.stringify({ status: 500, errors: validationErrors }),
            ),
          );
        //return res.status(500).json({ status: 500, errors: validationErrors });
      }
      return res.status(500).json(
        utility.DataEncrypt(
          JSON.stringify({
            status: 500,
            message: err.message,
            data: [],
          }),
        ),
      );
      //return res.status(500).json({ status: 500, message: err.message, data: [] });
    }
  }

  async getMobileOperator(req, res) {
    try {
      const decryptedObject = utility.DataDecrypt(req.encReq);
      const { mobile } = decryptedObject;

      const requiredKeys = Object.keys({ mobile });

      if (
        !requiredKeys.every(
          (key) =>
            key in decryptedObject &&
            decryptedObject[key] !== "" &&
            decryptedObject[key] !== undefined,
        )
      ) {
        return res
          .status(400)
          .json(
            utility.DataEncrypt(
              JSON.stringify({
                status: 400,
                message: "Required input data is missing or empty",
                columns: requiredKeys,
              }),
            ),
          );
      }

      const mOperator = await this.db.mobileOperator.findOne({
        where: { status: 1, mobile_no: mobile },
      });

      let getOperatorWithPath = [];

      if (mOperator) {
        const operator = await this.db.serviceOperator.findOne({
          where: { status: 1, id: mOperator.operator_id },
        });

        getOperatorWithPath = {
          id: operator.id,
          operator_name: operator.operator_name,
          category: operator.category,
          description: operator.description,
          image: baseurl + operator.image,
          status: operator.status,
          biller_id: operator.biller_id,
        };
      }

      const circle = [
        "Andhra Pradesh & Telangana",
        "Assam",
        "Bihar & Jharkhand",
        "Chennai",
        "Delhi & NCR",
        "Gujarat",
        "Haryana",
        "Himachal Pradesh",
        "Jammu Kashmir",
        "Karnataka",
        "Kerala",
        "Kolkata",
        "Madhya Pradesh & Chhattisgarh",
        "Maharashtra Goa",
        "Mumbai",
        "North East",
        "Odissa",
        "Punjab",
        "Rajasthan",
        "Tamil Nadu",
        "UP East",
        "UP West",
        "West Bengal",
      ];

      return res
        .status(200)
        .json(
          utility.DataEncrypt(
            JSON.stringify({
              status: 200,
              message: "success",
              data: getOperatorWithPath,
              circle: circle,
            }),
          ),
        );
    } catch (err) {
      logger.error(`Unable to find : ${err}`);
      if (err.name === "SequelizeValidationError") {
        const validationErrors = err.errors.map((err) => err.message);
        //return res.status(500).json({ status: 500,errors: validationErrors });
        return res
          .status(500)
          .json(
            utility.DataEncrypt(
              JSON.stringify({ status: 500, errors: validationErrors }),
            ),
          );
      }
      //return res.status(500).json({ status: 500, message: err.message,data: []  });
      return res
        .status(500)
        .json(
          utility.DataEncrypt(
            JSON.stringify({ status: 500, message: err.message, data: [] }),
          ),
        );
    }
  }

  async getOperatorCategories(req, res) {
    try {
      const categories = await this.db.serviceOperator.getDistinctCategories();
      return res.status(200).json({
        status: 200,
        message: "success",
        data: categories,
      });
    } catch (err) {
      logger.error(`Unable to fetch categories: ${err}`);
      return res.status(500).json({
        status: 500,
        message: err.message,
        data: [],
      });
    }
  }

  async deleteOperator(req, res) {
    let t;
    try {
      const { id } = req.body;

      if (!id) {
        return res
          .status(400)
          .json({ status: 400, message: "Operator id is required" });
      }

      t = await this.db.sequelize.transaction();

      const operator = await this.db.serviceOperator.findOne({
        where: { id },
      });

      if (!operator) {
        await t.rollback();
        return res
          .status(404)
          .json({ status: 404, message: "Operator not found" });
      }

      // Hard delete — permanently remove the row
      await this.db.serviceOperator.destroy({
        where: { id },
        transaction: t,
      });

      await t.commit();

      return res.status(200).json({
        status: 200,
        message: "Operator deleted successfully",
      });
    } catch (error) {
      if (t) await t.rollback();
      console.error("❌ Error in deleteOperator:", error);
      return res.status(500).json({
        status: 500,
        message: "Failed to delete operator",
        error: error.message,
      });
    }
  }
}

module.exports = new ServicesOperator();
