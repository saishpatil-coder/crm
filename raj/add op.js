"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Button,
  TextField,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Chip,
  InputAdornment,
  Alert,
  Snackbar,
  FormHelperText,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import ReCAPTCHA from "react-google-recaptcha";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import BusinessIcon from "@mui/icons-material/Business";
import DescriptionIcon from "@mui/icons-material/Description";
import CategoryIcon from "@mui/icons-material/Category";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import BadgeIcon from "@mui/icons-material/Badge";
import ReceiptIcon from "@mui/icons-material/Receipt";
import api from "../../../utils/api";
import { DataDecrypt } from "../../../utils/encryption";

const RECAPTCHA_SITE_KEY =
  process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ||
  "6LdHTbwrAAAAAGawIo2escUPr198m8cP3o_ZzZK1";

// Styled components
const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

const GradientButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
  border: 0,
  borderRadius: 8,
  color: "white",
  height: 48,
  padding: "0 30px",
  boxShadow: "0 3px 5px 2px rgba(33, 203, 243, .3)",
  "&:hover": {
    boxShadow: "0 4px 8px 2px rgba(33, 203, 243, .4)",
  },
  "&:disabled": {
    background: theme.palette.grey[300],
    color: theme.palette.grey[500],
    boxShadow: "none",
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: 8,
  textTransform: "none",
  fontWeight: 600,
  padding: theme.spacing(1, 3),
  variants: [
    {
      props: { variant: "outlined" },
      style: {
        border: `2px solid ${theme.palette.primary.main}`,
        color: theme.palette.primary.main,
        "&:hover": {
          border: `2px solid ${theme.palette.primary.dark}`,
          backgroundColor: "rgba(25, 118, 210, 0.04)",
        },
      },
    },
    {
      props: { variant: "contained" },
      style: {
        background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
        color: "white",
        boxShadow: "0 3px 5px 2px rgba(33, 150, 243, .3)",
        "&:hover": {
          boxShadow: "0 4px 8px 2px rgba(33, 150, 243, .4)",
        },
      },
    },
  ],
}));

const ErrorText = styled(Typography)(({ theme }) => ({
  color: theme.palette.error.main,
  fontSize: "0.75rem",
  marginTop: "3px",
  display: "flex",
  alignItems: "center",
  gap: "4px",
}));

const ValidatedTextField = styled(TextField, {
  shouldForwardProp: (prop) => prop !== "haserror",
})(({ theme, haserror }) => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    ...(haserror === "true" && {
      "& .MuiOutlinedInput-notchedOutline": {
        borderColor: theme.palette.error.main,
        borderWidth: "2px",
      },
    }),
  },
}));

const smallInputProps = (icon) => ({
  size: "small",
  InputProps: {
    startAdornment: (
      <InputAdornment position="start">
        {React.cloneElement(icon, { fontSize: "small", sx: { fontSize: 18 } })}
      </InputAdornment>
    ),
  },
});

const AddOperator = () => {
  const handleGoBack = () => {
    if (typeof window !== "undefined") {
      window.history.back();
    }
  };

  const [operatorName, setOperatorName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [billerId, setBillerId] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Error states
  const [formErrors, setFormErrors] = useState({
    operatorName: "",
    description: "",
    category: "",
    billerId: "",
    selectedFile: "",
    recaptcha: "",
  });

  // Snackbar for notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const recaptchaRef = useRef(null);

  // Fetch categories on component mount
  useEffect(() => {
    console.log("AddOperator component mounted");
    fetchCategories();
  }, []);

  // Fetch distinct categories from backend
  const fetchCategories = async () => {
    console.log("Fetching categories...");
    setLoadingCategories(true);
    try {
      const response = await api.get("/api/operator/get-operator-categories");
      console.log("Categories API response:", response.data);

      if (response.data?.status === 200) {
        const sortedCategories = (response.data.data || []).sort();
        console.log("Fetched categories:", sortedCategories);
        setCategories(sortedCategories);
      } else {
        console.warn("Failed to fetch categories:", response.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoadingCategories(false);
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Show snackbar message
  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  // Validate individual field
  const validateField = (name, value) => {
    let error = "";

    switch (name) {
      case "operatorName":
        if (!value?.trim()) error = "Operator name is required";
        else if (value.length < 2)
          error = "Operator name must be at least 2 characters";
        else if (value.length > 100)
          error = "Operator name must not exceed 100 characters";
        break;
      case "description":
        if (!value?.trim()) error = "Description is required";
        else if (value.length < 10)
          error = "Description must be at least 10 characters";
        else if (value.length > 500)
          error = "Description must not exceed 500 characters";
        break;
      case "category":
        if (!value?.trim()) error = "Category is required";
        break;
      case "billerId":
        if (!value?.trim()) error = "Biller ID is required";
        else if (!/^\d+$/.test(value))
          error = "Biller ID must be a valid number";
        break;
      case "selectedFile":
        if (!value) error = "Please upload an operator image";
        else if (!value.type.startsWith("image/"))
          error = "File must be an image";
        else if (value.size > 5 * 1024 * 1024)
          error = "Image size must be less than 5MB";
        break;
      case "recaptcha":
        if (!value) error = "Please verify you're not a robot";
        break;
      default:
        break;
    }

    setFormErrors((prev) => ({ ...prev, [name]: error }));
    return !error;
  };

  // Validate entire form
  const validateForm = () => {
    const fields = [
      { name: "operatorName", value: operatorName },
      { name: "description", value: description },
      { name: "category", value: category },
      { name: "billerId", value: billerId },
      { name: "selectedFile", value: selectedFile },
      { name: "recaptcha", value: recaptchaToken },
    ];

    let isValid = true;
    fields.forEach((field) => {
      if (!validateField(field.name, field.value)) {
        isValid = false;
      }
    });

    return isValid;
  };

  // Handle field changes with validation
  const handleOperatorNameChange = (e) => {
    const value = e.target.value;
    setOperatorName(value);
    if (formErrors.operatorName) validateField("operatorName", value);
  };

  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    setDescription(value);
    if (formErrors.description) validateField("description", value);
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setCategory(value);
    if (formErrors.category) validateField("category", value);
  };

  const handleBillerIdChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^\d+$/.test(value)) {
      setBillerId(value);
      if (formErrors.billerId) validateField("billerId", value);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    console.log("File selected:", file);
    setSelectedFile(file);
    if (formErrors.selectedFile) validateField("selectedFile", file);
  };

  // CAPTCHA handler
  const onRecaptchaChange = (token) => {
    console.log("reCAPTCHA verified, token received");
    setRecaptchaToken(token);
    setCaptchaVerified(true);
    if (formErrors.recaptcha) validateField("recaptcha", token);
  };

  // Reset CAPTCHA
  const resetCaptcha = () => {
    console.log("reCAPTCHA reset");
    setRecaptchaToken(null);
    setCaptchaVerified(false);
    if (recaptchaRef.current) recaptchaRef.current.reset();
  };

  // Reset form
  const resetForm = () => {
    console.log("Resetting form");
    setOperatorName("");
    setDescription("");
    setCategory("");
    setBillerId("");
    setSelectedFile(null);
    setFormErrors({
      operatorName: "",
      description: "",
      category: "",
      billerId: "",
      selectedFile: "",
      recaptcha: "",
    });
    resetCaptcha();
  };

  // SUBMIT OPERATOR
  const handleSubmit = async () => {
    console.log("Submit button clicked");

    if (!validateForm()) {
      console.log("Form validation failed");
      showSnackbar("Please fix all errors before submitting", "error");
      return;
    }

    console.log("Form validation passed, preparing FormData");
    console.log("Form data:", {
      operator_name: operatorName.trim(),
      description: description.trim(),
      category: category.trim(),
      biller_id: billerId,
      image: selectedFile?.name,
      image_size: selectedFile?.size,
      image_type: selectedFile?.type,
    });

    const formData = new FormData();
    formData.append("operator_name", operatorName.trim());
    formData.append("description", description.trim());
    formData.append("category", category.trim());
    formData.append("biller_id", billerId);
    formData.append("image", selectedFile);

    try {
      setLoading(true);
      console.log(
        "Sending POST request to /api/operator/428fd54ea9e40f7c816b6ffc2887e35015ee539e",
      );

      const response = await api.post(
        "/api/operator/428fd54ea9e40f7c816b6ffc2887e35015ee539e",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      console.log("API Response received:", response);
      console.log("Response status:", response.status);
      console.log("Response data:", response.data);

      let responseData = response.data;

      if (responseData.status === 201 || responseData.status === 200) {
        console.log("Operator added successfully:", responseData.data);
        showSnackbar(
          responseData.message || "Operator added successfully!",
          "success",
        );
        resetForm();
        fetchCategories();

        console.log("Navigating back to previous page after 2 seconds");
        setTimeout(() => {
          handleGoBack();
        }, 2000);
      } else {
        console.error("Add operator failed:", responseData);
        showSnackbar(
          responseData.message || responseData.error || "Upload failed",
          "error",
        );
      }
    } catch (error) {
      console.error("Upload error details:", error);
      console.error("Error response:", error.response);
      console.error("Error message:", error.message);
      showSnackbar(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Upload failed. Please try again.",
        "error",
      );
    } finally {
      setLoading(false);
      console.log("Loading state set to false");
    }
  };

  const hasErrors = Object.values(formErrors).some((error) => error !== "");

  return (
    <main className="p-6 space-y-6">
      <Grid container spacing={4} sx={{ padding: 2 }}>
        <Grid item xs={12}>
          <Paper
            elevation={3}
            sx={{ borderRadius: "16px", overflow: "hidden" }}
          >
            {/* HEADER with Back Button */}
            <Box
              sx={{
                padding: "24px",
                backgroundColor: "transparent",
                borderBottom: "1px solid #e9ecef",
                display: "flex",
                alignItems: "center",
                gap: 2,
                color: "black",
              }}
            >
              <IconButton
                onClick={handleGoBack}
                sx={{
                  bgcolor: "grey.100",
                  "&:hover": { bgcolor: "grey.200" },
                }}
              >
                <ArrowBackIcon />
              </IconButton>
              <Typography variant="h5" sx={{ fontWeight: 600, color: "black" }}>
                Add New Operator
              </Typography>
            </Box>

            {/* BODY */}
            <Box sx={{ p: 4 }}>
              <Grid container spacing={3}>
                {/* ERROR ALERT */}
                {hasErrors && (
                  <Grid item xs={12}>
                    <Alert
                      severity="error"
                      icon={<ErrorOutlineIcon />}
                      onClose={() =>
                        setFormErrors({
                          operatorName: "",
                          description: "",
                          category: "",
                          billerId: "",
                          selectedFile: "",
                          recaptcha: "",
                        })
                      }
                      sx={{ mb: 2 }}
                    >
                      Please fix the errors in the form before submitting.
                    </Alert>
                  </Grid>
                )}

                {/* OPERATOR DETAILS SECTION */}
                <Grid item xs={12}>
                  <Typography
                    variant="h6"
                    sx={{
                      mb: 2,
                      color: "#1976d2",
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <BusinessIcon /> Operator Details
                  </Typography>
                </Grid>

                {/* Operator Name */}
                <Grid item xs={12} md={6}>
                  <ValidatedTextField
                    fullWidth
                    label="Operator Name *"
                    value={operatorName}
                    onChange={handleOperatorNameChange}
                    onBlur={() => validateField("operatorName", operatorName)}
                    {...smallInputProps(<BadgeIcon />)}
                    haserror={formErrors.operatorName ? "true" : "false"}
                    error={!!formErrors.operatorName}
                    helperText={formErrors.operatorName}
                    placeholder="Enter operator name (e.g., Jio, Airtel, VI)"
                    required
                  />
                </Grid>

                {/* Category - Dropdown */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth error={!!formErrors.category}>
                    <InputLabel>Category *</InputLabel>
                    <Select
                      value={category}
                      onChange={handleCategoryChange}
                      onBlur={() => validateField("category", category)}
                      label="Category *"
                      disabled={loadingCategories}
                    >
                      <MenuItem value="" disabled>
                        Select Category
                      </MenuItem>
                      {categories.map((cat, index) => (
                        <MenuItem key={index} value={cat}>
                          {cat}
                        </MenuItem>
                      ))}
                    </Select>
                    {formErrors.category && (
                      <FormHelperText>{formErrors.category}</FormHelperText>
                    )}
                  </FormControl>
                </Grid>

                {/* Biller ID */}
                <Grid item xs={12} md={6}>
                  <ValidatedTextField
                    fullWidth
                    label="Biller ID *"
                    value={billerId}
                    onChange={handleBillerIdChange}
                    onBlur={() => validateField("billerId", billerId)}
                    {...smallInputProps(<ReceiptIcon />)}
                    haserror={formErrors.billerId ? "true" : "false"}
                    error={!!formErrors.billerId}
                    helperText={formErrors.billerId}
                    placeholder="Enter biller ID (numeric)"
                    inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                    required
                  />
                </Grid>

                {/* Description */}
                <Grid item xs={12}>
                  <ValidatedTextField
                    fullWidth
                    label="Description *"
                    value={description}
                    onChange={handleDescriptionChange}
                    onBlur={() => validateField("description", description)}
                    {...smallInputProps(<DescriptionIcon />)}
                    multiline
                    rows={3}
                    haserror={formErrors.description ? "true" : "false"}
                    error={!!formErrors.description}
                    helperText={formErrors.description}
                    placeholder="Enter operator description"
                    required
                  />
                </Grid>

                {/* FILE UPLOAD */}
                <Grid item xs={12} md={6}>
                  <ActionButton
                    component="label"
                    variant="contained"
                    startIcon={<CloudUploadIcon />}
                    fullWidth
                    sx={{ height: "56px" }}
                  >
                    Upload Operator Image *
                    <VisuallyHiddenInput
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      onBlur={() => validateField("selectedFile", selectedFile)}
                    />
                  </ActionButton>
                  {formErrors.selectedFile && (
                    <ErrorText sx={{ mt: 1 }}>
                      <ErrorOutlineIcon fontSize="small" />{" "}
                      {formErrors.selectedFile}
                    </ErrorText>
                  )}
                  {selectedFile && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mt: 1,
                        flexWrap: "wrap",
                      }}
                    >
                      <CheckCircleOutlineIcon
                        color="success"
                        fontSize="small"
                      />
                      <Chip
                        label={selectedFile.name}
                        onDelete={() => {
                          setSelectedFile(null);
                          validateField("selectedFile", null);
                        }}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                      <Typography variant="caption" color="text.secondary">
                        ({(selectedFile.size / 1024).toFixed(2)} KB)
                      </Typography>
                    </Box>
                  )}
                </Grid>

                {/* CAPTCHA */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 1 }}>
                    <ReCAPTCHA
                      ref={recaptchaRef}
                      sitekey={RECAPTCHA_SITE_KEY}
                      onChange={onRecaptchaChange}
                      onExpired={resetCaptcha}
                    />
                    {formErrors.recaptcha && (
                      <ErrorText sx={{ mt: 1 }}>
                        <ErrorOutlineIcon fontSize="small" />{" "}
                        {formErrors.recaptcha}
                      </ErrorText>
                    )}
                    <FormHelperText>
                      Please verify that you are human
                    </FormHelperText>
                  </Box>
                </Grid>

                {/* ACTION BUTTONS */}
                <Grid item xs={12}>
                  <Box
                    sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}
                  >
                    <ActionButton
                      variant="outlined"
                      onClick={resetForm}
                      disabled={loading}
                      sx={{ minWidth: 120 }}
                    >
                      Reset
                    </ActionButton>
                    <GradientButton
                      onClick={handleSubmit}
                      disabled={loading || hasErrors || !captchaVerified}
                      startIcon={
                        loading ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : null
                      }
                      sx={{ minWidth: 200 }}
                    >
                      {loading ? "Adding Operator..." : "ADD OPERATOR"}
                    </GradientButton>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </main>
  );
};

export default AddOperator;
// addoperator;
