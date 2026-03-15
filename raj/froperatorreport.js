"use client";
import React, { useState } from "react";
import {
  Button,
  Grid,
  Box,
  Paper,
  Table,
  TableBody,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  Modal,
  CircularProgress,
  IconButton,
  Tooltip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
} from "@mui/material";
import api from "../../../utils/api";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import { styled } from "@mui/material/styles";
import dayjs from "dayjs";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import HelpOutlineOutlinedIcon from "@mui/icons-material/HelpOutlineOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CloseIcon from "@mui/icons-material/Close";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { DataEncrypt, DataDecrypt } from "../../../utils/encryption";

const OperatorsTransactions = ({
  showServiceTrans,
  loading,
  onOperatorUpdate,
}) => {
  const getDate = (timeZone) => {
    if (!timeZone) return "-";
    const dateString = timeZone;
    const dateObject = new Date(dateString);
    const year = dateObject.getFullYear();
    const month = String(dateObject.getMonth() + 1).padStart(2, "0");
    const day = String(dateObject.getDate()).padStart(2, "0");
    const hours = String(dateObject.getHours()).padStart(2, "0");
    const minutes = String(dateObject.getMinutes()).padStart(2, "0");
    const amOrPm = hours >= 12 ? "PM" : "AM";
    const formattedHours = hours % 12 === 0 ? "12" : String(hours % 12);
    const formattedDateTime = `${day}-${month}-${year} ${formattedHours}:${minutes} ${amOrPm}`;
    return formattedDateTime;
  };

  let rows;
  if (showServiceTrans && showServiceTrans.length > 0) {
    rows = [...showServiceTrans];
  } else {
    rows = [];
  }

  const rowsPerPageOptions = [5, 10, 25, 50, 100];
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);

  // Modal states
  const [openDeleteModal, setOpenDeleteModal] = React.useState(false);
  const [openUpdateModal, setOpenUpdateModal] = React.useState(false);
  const [selectedOperator, setSelectedOperator] = React.useState(null);
  const [actionType, setActionType] = React.useState(""); // 'delete', 'active', 'inactive'

  // Update form states
  const [updateOperatorName, setUpdateOperatorName] = useState("");
  const [updateDescription, setUpdateDescription] = useState("");
  const [updateCategory, setUpdateCategory] = useState("");
  const [updateBillerId, setUpdateBillerId] = useState("");
  const [updateStatus, setUpdateStatus] = useState(1);
  const [updateSelectedFile, setUpdateSelectedFile] = useState(null);
  const [updateFileName, setUpdateFileName] = useState("");
  const [categories, setCategories] = useState([]);

  // Snackbar for notifications
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const StyledTablePagination = styled(TablePagination)(({ theme }) => ({
    background: "#fff",
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    borderTop: "1px solid #e0e0e0",
    marginTop: 0,
    ".MuiTablePagination-toolbar": {
      minHeight: "52px",
      padding: "0 16px",
      flexWrap: "wrap",
      gap: "4px",
    },
  }));

  const StyledTableCell = styled(TableCell)(({ theme }) => ({
    [`&.${tableCellClasses.head}`]: {
      background: "#2198f3",
      color: "#fff",
      fontWeight: 700,
      fontSize: 12,
      textTransform: "uppercase",
      padding: "12px 8px",
      border: "1px solid rgba(255, 255, 255, 0.3)",
      whiteSpace: "nowrap",
      letterSpacing: 1,
    },
    [`&.${tableCellClasses.body}`]: {
      fontSize: 12,
      padding: "10px 8px",
      border: "1px solid #e0e0e0",
    },
  }));

  const StyledTableRow = styled(TableRow)(({ theme }) => ({
    "&:nth-of-type(odd)": {
      backgroundColor: theme.palette.action.hover,
    },
    "&:hover": {
      backgroundColor: "#f5f5f5",
    },
  }));

  const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 600,
    maxHeight: "90vh",
    overflowY: "auto",
    bgcolor: "background.paper",
    borderRadius: 2,
    boxShadow: 24,
    p: 4,
  };

  // Fetch categories
  React.useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/api/operator/get-operator-categories");
        if (response.data?.status === 200) {
          setCategories(response.data.data || []);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Handle update click - Open modal with operator data
  const handleUpdateClick = (operator) => {
    setSelectedOperator(operator);
    setUpdateOperatorName(operator.operator_name || "");
    setUpdateDescription(operator.description || "");
    setUpdateCategory(operator.category || "");
    setUpdateBillerId(operator.biller_id?.toString() || "");
    setUpdateStatus(operator.status || 1);
    setUpdateSelectedFile(null);
    setUpdateFileName("");
    setOpenUpdateModal(true);
  };

  // Handle file change for update
  const handleUpdateFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setSnackbar({
          open: true,
          message: "Please select an image file",
          severity: "error",
        });
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setSnackbar({
          open: true,
          message: "Image size must be less than 5MB",
          severity: "error",
        });
        return;
      }
      setUpdateSelectedFile(file);
      setUpdateFileName(file.name);
    }
  };

  // Handle update submit
  const handleUpdateSubmit = async () => {
    if (!selectedOperator) return;

    // Validate required fields
    if (!updateOperatorName.trim()) {
      setSnackbar({
        open: true,
        message: "Operator name is required",
        severity: "error",
      });
      return;
    }
    if (!updateCategory) {
      setSnackbar({
        open: true,
        message: "Category is required",
        severity: "error",
      });
      return;
    }
    if (!updateBillerId.trim()) {
      setSnackbar({
        open: true,
        message: "Biller ID is required",
        severity: "error",
      });
      return;
    }
    if (!updateDescription.trim()) {
      setSnackbar({
        open: true,
        message: "Description is required",
        severity: "error",
      });
      return;
    }

    setUpdateLoading(true);
    try {
      const formData = new FormData();
      formData.append("id", selectedOperator.id);
      formData.append("operator_name", updateOperatorName.trim());
      formData.append("description", updateDescription.trim());
      formData.append("category", updateCategory.trim());
      formData.append("biller_id", updateBillerId.trim());
      formData.append("status", updateStatus);

      if (updateSelectedFile) {
        formData.append("image", updateSelectedFile);
      }

      console.log("Sending update request for ID:", selectedOperator.id);

      // Log FormData contents for debugging
      for (let pair of formData.entries()) {
        console.log(pair[0] + ": " + pair[1]);
      }

      const response = await api.post(
        "/api/operator/update-operator",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      console.log("Update response:", response.data);

      if (response.data.status === 200 || response.data.status === 201) {
        setSnackbar({
          open: true,
          message: response.data.message || "Operator updated successfully!",
          severity: "success",
        });
        setOpenUpdateModal(false);
        // Refresh the list
        if (onOperatorUpdate) {
          setTimeout(() => {
            onOperatorUpdate();
          }, 500);
        }
      } else {
        setSnackbar({
          open: true,
          message: response.data.message || "Failed to update operator",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Update error:", error);
      console.error("Error response:", error.response);
      setSnackbar({
        open: true,
        message:
          error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          "Failed to update operator. Please try again.",
        severity: "error",
      });
    } finally {
      setUpdateLoading(false);
    }
  };

  // Handle delete click
  const handleDeleteClick = (operator) => {
    setSelectedOperator(operator);
    setActionType("delete");
    setOpenDeleteModal(true);
  };

  // Handle status change click
  const handleStatusChangeClick = (operator, newStatus) => {
    setSelectedOperator(operator);
    setActionType(newStatus === 1 ? "active" : "inactive");
    setOpenDeleteModal(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setOpenDeleteModal(false);
    setOpenUpdateModal(false);
    setSelectedOperator(null);
    setActionType("");
    setUpdateSelectedFile(null);
    setUpdateFileName("");
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!selectedOperator) return;

    setDeleteLoading(true);
    try {
      const response = await api.post(
        "/api/operator/b3e1d7f2a94c6082ef5d4a1b3c7e9f08124ad653",
        { id: selectedOperator.id },
      );

      let responseData = response.data;
      if (response.data.data && typeof response.data.data === "string") {
        try {
          responseData = JSON.parse(DataDecrypt(response.data.data));
        } catch (e) {
          console.log("Response not encrypted");
        }
      }

      if (responseData.status === 200) {
        setSnackbar({
          open: true,
          message: responseData.message || "Operator deleted successfully",
          severity: "success",
        });
        setOpenDeleteModal(false);
        if (onOperatorUpdate) {
          setTimeout(() => {
            onOperatorUpdate();
          }, 500);
        }
      } else {
        setSnackbar({
          open: true,
          message: responseData.message || "Failed to delete operator",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Delete error:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to delete operator",
        severity: "error",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle status update - FIXED: Using FormData to match backend expectation
  const handleStatusUpdate = async () => {
    if (!selectedOperator) return;

    setDeleteLoading(true);
    try {
      const newStatus = actionType === "active" ? 1 : 2;

      // Create form data for status update
      const formData = new FormData();
      formData.append("id", selectedOperator.id);
      formData.append("status", newStatus);

      console.log(
        "Sending status update for ID:",
        selectedOperator.id,
        "New Status:",
        newStatus,
      );

      const response = await api.post(
        "/api/operator/update-operator",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      console.log("Status update response:", response.data);

      if (response.data.status === 200) {
        setSnackbar({
          open: true,
          message:
            response.data.message ||
            `Operator ${actionType === "active" ? "activated" : "inactivated"} successfully`,
          severity: "success",
        });
        setOpenDeleteModal(false);

        // Refresh the list
        if (onOperatorUpdate) {
          setTimeout(() => {
            onOperatorUpdate();
          }, 500);
        }
      } else {
        setSnackbar({
          open: true,
          message: response.data.message || "Failed to update status",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Status update error:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || "Failed to update status",
        severity: "error",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleLinkClick = (img) => {
    window.open(img, "_blank", "noopener,noreferrer");
  };

  return (
    <main className="p-6 space-y-6">
      <Grid container spacing={4} sx={{ padding: "0px 16px" }}>
        <Grid item={true} xs={12}>
          <TableContainer
            component={Paper}
            sx={{
              maxHeight: 500,
              overflowY: "auto",
              overflowX: "auto",
              position: "relative",
              borderRadius: "8px",
              boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
            }}
          >
            <Table
              stickyHeader
              aria-label="Operators Report"
              sx={{ minWidth: "1300px", width: "100%" }}
            >
              <TableHead>
                <TableRow>
                  <StyledTableCell align="center">Sl No.</StyledTableCell>
                  <StyledTableCell>Operator ID</StyledTableCell>
                  <StyledTableCell>Operator Name</StyledTableCell>
                  <StyledTableCell>Description</StyledTableCell>
                  <StyledTableCell>Category</StyledTableCell>
                  <StyledTableCell>Image</StyledTableCell>
                  <StyledTableCell>Created Date</StyledTableCell>
                  <StyledTableCell>Status</StyledTableCell>
                  <StyledTableCell align="center">Actions</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                      <CircularProgress size={30} />
                    </TableCell>
                  </TableRow>
                ) : rows.length > 0 ? (
                  (rowsPerPage > 0
                    ? rows.slice(
                        page * rowsPerPage,
                        page * rowsPerPage + rowsPerPage,
                      )
                    : rows
                  ).map((row, index) => (
                    <StyledTableRow key={row.id}>
                      <StyledTableCell align="center">
                        {index + 1 + page * rowsPerPage}
                      </StyledTableCell>
                      <StyledTableCell>{row.id || "-"}</StyledTableCell>
                      <StyledTableCell sx={{ fontWeight: 500 }}>
                        {row.operator_name || "-"}
                      </StyledTableCell>
                      <StyledTableCell sx={{ maxWidth: 250 }}>
                        <Tooltip title={row.description || ""}>
                          <span>
                            {row.description?.length > 50
                              ? `${row.description.substring(0, 50)}...`
                              : row.description || "-"}
                          </span>
                        </Tooltip>
                      </StyledTableCell>
                      <StyledTableCell>
                        <Box
                          sx={{
                            bgcolor: "#e3f2fd",
                            color: "#1976d2",
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                            display: "inline-block",
                            fontSize: "11px",
                            fontWeight: 600,
                          }}
                        >
                          {row.category || "-"}
                        </Box>
                      </StyledTableCell>
                      <StyledTableCell>
                        {row.image ? (
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => handleLinkClick(row.image)}
                            sx={{
                              textTransform: "none",
                              fontSize: "12px",
                              color: "#1976d2",
                              "&:hover": { textDecoration: "underline" },
                            }}
                          >
                            <VisibilityIcon sx={{ fontSize: 16, mr: 0.5 }} />
                            View
                          </Button>
                        ) : (
                          "-"
                        )}
                      </StyledTableCell>
                      <StyledTableCell sx={{ whiteSpace: "nowrap" }}>
                        {row.created_on
                          ? dayjs.isDayjs(row.created_on)
                            ? row.created_on.format("DD-MM-YYYY")
                            : getDate(row.created_on)
                          : "-"}
                      </StyledTableCell>
                      <StyledTableCell>
                        <Box
                          sx={{
                            bgcolor:
                              row.status === 1
                                ? "#e8f5e8"
                                : row.status === 2
                                  ? "#f3e5f5"
                                  : "#f5f5f5",
                            color:
                              row.status === 1
                                ? "#2e7d32"
                                : row.status === 2
                                  ? "#7b1fa2"
                                  : "#757575",
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 2,
                            display: "inline-block",
                            fontSize: "11px",
                            fontWeight: 600,
                          }}
                        >
                          {row.status === 1
                            ? "Active"
                            : row.status === 2
                              ? "Inactive"
                              : "Deleted"}
                        </Box>
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        <Box
                          sx={{
                            display: "flex",
                            gap: 1,
                            justifyContent: "center",
                            flexWrap: "wrap",
                          }}
                        >
                          {/* UPDATE BUTTON - Dark Blue */}
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleUpdateClick(row)}
                            sx={{
                              bgcolor: "#1976d2",
                              color: "white",
                              fontSize: "11px",
                              fontWeight: 600,
                              minWidth: "60px",
                              padding: "4px 8px",
                              "&:hover": {
                                bgcolor: "#1565c0",
                              },
                            }}
                          >
                            Update
                          </Button>

                          {/* INACTIVE/ACTIVE BUTTON - Purple for Inactive, Green for Active */}
                          {row.status === 1 ? (
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => handleStatusChangeClick(row, 2)}
                              sx={{
                                bgcolor: "#9c27b0",
                                color: "white",
                                fontSize: "11px",
                                fontWeight: 600,
                                minWidth: "60px",
                                padding: "4px 8px",
                                "&:hover": {
                                  bgcolor: "#7b1fa2",
                                },
                              }}
                            >
                              Inactive
                            </Button>
                          ) : row.status === 2 ? (
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => handleStatusChangeClick(row, 1)}
                              sx={{
                                bgcolor: "#2e7d32",
                                color: "white",
                                fontSize: "11px",
                                fontWeight: 600,
                                minWidth: "60px",
                                padding: "4px 8px",
                                "&:hover": {
                                  bgcolor: "#1b5e20",
                                },
                              }}
                            >
                              Active
                            </Button>
                          ) : null}

                          {/* DELETE BUTTON - Red */}
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleDeleteClick(row)}
                            sx={{
                              bgcolor: "#d32f2f",
                              color: "white",
                              fontSize: "11px",
                              fontWeight: 600,
                              minWidth: "60px",
                              padding: "4px 8px",
                              "&:hover": {
                                bgcolor: "#b71c1c",
                              },
                            }}
                          >
                            Delete
                          </Button>
                        </Box>
                      </StyledTableCell>
                    </StyledTableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      align="center"
                      sx={{
                        height: 200,
                        background: "#fff",
                      }}
                    >
                      <Box
                        display="flex"
                        flexDirection="column"
                        alignItems="center"
                        justifyContent="center"
                      >
                        <InfoOutlinedIcon
                          sx={{ color: "#9e9e9e", fontSize: 48, mb: 2 }}
                        />
                        <Typography
                          color="#757575"
                          fontWeight="500"
                          fontSize={16}
                        >
                          No Operators Found
                        </Typography>
                        <Typography color="#9e9e9e" fontSize={14} mt={1}>
                          Click "Add Operator" to create a new operator
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <StyledTablePagination
            rowsPerPageOptions={rowsPerPageOptions}
            component="div"
            count={rows.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Grid>
      </Grid>

      {/* Update Operator Modal */}
      <Modal
        open={openUpdateModal}
        onClose={handleCloseModal}
        aria-labelledby="update-modal-title"
      >
        <Box sx={style}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Typography variant="h6" component="h2">
              Update Operator
            </Typography>
            <IconButton onClick={handleCloseModal} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Operator Name"
                value={updateOperatorName}
                onChange={(e) => setUpdateOperatorName(e.target.value)}
                size="small"
                required
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth size="small" required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={updateCategory}
                  onChange={(e) => setUpdateCategory(e.target.value)}
                  label="Category"
                >
                  {categories.map((cat, index) => (
                    <MenuItem key={index} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Biller ID"
                value={updateBillerId}
                onChange={(e) => setUpdateBillerId(e.target.value)}
                size="small"
                required
                inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={updateDescription}
                onChange={(e) => setUpdateDescription(e.target.value)}
                size="small"
                multiline
                rows={3}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={updateStatus}
                  onChange={(e) => setUpdateStatus(e.target.value)}
                  label="Status"
                >
                  <MenuItem value={1}>Active</MenuItem>
                  <MenuItem value={2}>Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Button
                component="label"
                variant="outlined"
                startIcon={<CloudUploadIcon />}
                fullWidth
                sx={{ height: 40 }}
              >
                Upload New Image (Optional)
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleUpdateFileChange}
                />
              </Button>
              {updateFileName && (
                <Typography
                  variant="caption"
                  display="block"
                  sx={{ mt: 1, color: "success.main" }}
                >
                  Selected: {updateFileName}
                </Typography>
              )}
              {selectedOperator?.image && !updateSelectedFile && (
                <Typography
                  variant="caption"
                  display="block"
                  sx={{ mt: 1, color: "text.secondary" }}
                >
                  Current image will be kept if no new image is uploaded
                </Typography>
              )}
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" gap={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={handleCloseModal}
                  disabled={updateLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleUpdateSubmit}
                  disabled={updateLoading}
                  startIcon={
                    updateLoading ? <CircularProgress size={20} /> : null
                  }
                  sx={{
                    bgcolor: "#1976d2",
                    "&:hover": { bgcolor: "#1565c0" },
                  }}
                >
                  {updateLoading ? "Updating..." : "Update Operator"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Modal>

      {/* Delete/Status Confirmation Modal */}
      <Modal
        open={openDeleteModal}
        onClose={handleCloseModal}
        aria-labelledby="delete-modal-title"
      >
        <Box sx={{ ...style, width: 400 }}>
          <Box display="flex" justifyContent="center" mb={2}>
            <HelpOutlineOutlinedIcon sx={{ fontSize: 50 }} color="warning" />
          </Box>
          <Typography
            id="delete-modal-title"
            variant="h6"
            component="h2"
            align="center"
            gutterBottom
          >
            {actionType === "delete"
              ? "Delete Operator"
              : actionType === "active"
                ? "Activate Operator"
                : "Deactivate Operator"}
          </Typography>
          <Typography align="center" color="text.secondary" sx={{ mb: 3 }}>
            {actionType === "delete"
              ? `Are you sure you want to delete "${selectedOperator?.operator_name}"? This action cannot be undone.`
              : actionType === "active"
                ? `Are you sure you want to activate "${selectedOperator?.operator_name}"?`
                : `Are you sure you want to deactivate "${selectedOperator?.operator_name}"?`}
          </Typography>
          <Box display="flex" justifyContent="center" gap={2}>
            <Button
              variant="contained"
              color={
                actionType === "delete"
                  ? "error"
                  : actionType === "active"
                    ? "success"
                    : "warning"
              }
              onClick={
                actionType === "delete"
                  ? handleDeleteConfirm
                  : handleStatusUpdate
              }
              disabled={deleteLoading}
              startIcon={deleteLoading ? <CircularProgress size={20} /> : null}
            >
              {deleteLoading
                ? "Processing..."
                : actionType === "delete"
                  ? "Yes, Delete"
                  : actionType === "active"
                    ? "Yes, Activate"
                    : "Yes, Deactivate"}
            </Button>
            <Button
              variant="outlined"
              onClick={handleCloseModal}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </main>
  );
};

export default OperatorsTransactions;

// operatorsReport.js ch code